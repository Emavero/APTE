"""Tests des encaissements : signature du webhook, rejeu, rapprochement des montants.

Ce fichier couvre la faille principale de l'ancienne implémentation : le webhook
de paiement acceptait n'importe quel appel non signé, ce qui permettait de faire
passer une commande en « payée » sans avoir rien réglé.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal

import pytest
from django.test import override_settings
from django.urls import reverse

from apps.common.exceptions import ConflictError, NotFoundError, PaymentError, PermissionDeniedError
from apps.orders.models import OrderStatus, Payment, PaymentStatus
from apps.orders.services import checkout, payment_flow
from apps.orders.services.payments.base import CheckoutSession, WebhookEvent
from apps.orders.services.payments.wave import WaveGateway

pytestmark = pytest.mark.django_db

WEBHOOK_SECRET = "test-webhook-secret"
DELIVERY = {"name": "Awa", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""}


class FakeGateway:
    """Double de test : aucun appel réseau, comportement piloté par le test."""

    name = "wave"

    def __init__(self, *, fail=False, reference="chk_1"):
        self.fail = fail
        self.reference = reference
        self.calls = []
        self.idempotency_keys = []

    def is_configured(self):
        return True

    def create_checkout(self, **kwargs):
        self.calls.append(kwargs)
        self.idempotency_keys.append(kwargs["idempotency_key"])
        if self.fail:
            raise PaymentError("indisponible")
        return CheckoutSession(
            reference=self.reference,
            checkout_url=f"https://pay.example/{self.reference}",
            raw={"id": self.reference},
        )

    def fetch_status(self, reference):
        return WebhookEvent(reference=reference, status="succeeded", amount=Decimal("25000"))

    def verify_webhook(self, *, payload, signature):
        return json.loads(payload.decode())

    def parse_webhook(self, data):
        return WebhookEvent(
            reference=str(data.get("id", "")),
            status=data.get("status", "pending"),
            amount=Decimal(str(data["amount"])) if "amount" in data else None,
            currency=data.get("currency"),
            raw=data,
        )


@pytest.fixture
def wave_order(user, product):
    return checkout.place_order(
        user=user,
        items=[{"product_id": product.id, "quantity": 1}],
        payment_method="wave",
        phone_number="770000001",
        delivery=DELIVERY,
    )


def sign(body: bytes, secret: str = WEBHOOK_SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


# ------------------------------------------------ ouverture de session de paiement
def test_start_payment_opens_a_session_and_moves_the_order(wave_order):
    gateway = FakeGateway()
    payment = payment_flow.start_payment(wave_order, gateway=gateway)

    assert payment.status == PaymentStatus.PENDING
    assert payment.checkout_url == "https://pay.example/chk_1"
    assert payment.amount == wave_order.total_price
    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.AWAITING_PAYMENT


def test_start_payment_sends_an_idempotency_key(wave_order):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    assert gateway.idempotency_keys and all(gateway.idempotency_keys)


def test_clicking_pay_twice_reuses_the_open_session(wave_order):
    gateway = FakeGateway()
    first = payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()
    second = payment_flow.start_payment(wave_order, gateway=gateway)
    assert first.pk == second.pk
    assert Payment.objects.filter(order=wave_order).count() == 1


def test_a_gateway_failure_marks_the_payment_failed_but_keeps_the_order(wave_order):
    with pytest.raises(PaymentError):
        payment_flow.start_payment(wave_order, gateway=FakeGateway(fail=True))
    payment = Payment.objects.get(order=wave_order)
    assert payment.status == PaymentStatus.FAILED
    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.PENDING
    assert wave_order.invoice is not None


def test_cash_order_cannot_open_a_mobile_payment(user, product):
    order = checkout.place_order(
        user=user,
        items=[{"product_id": product.id, "quantity": 1}],
        payment_method="cash",
        delivery=DELIVERY,
    )
    with pytest.raises(Exception):
        payment_flow.start_payment(order, gateway=FakeGateway())


# --------------------------------------------------------- application d'un paiement
def test_successful_event_marks_order_and_invoice_paid(wave_order):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()

    payment_flow.apply_payment_event(
        WebhookEvent(reference="chk_1", status="succeeded", amount=wave_order.total_price),
        gateway=gateway,
    )

    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.PAID
    assert wave_order.paid_at is not None
    assert wave_order.invoice.status == "paid"
    assert Payment.objects.get(order=wave_order).status == PaymentStatus.SUCCEEDED


def test_replaying_the_same_success_event_is_harmless(wave_order):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()
    event = WebhookEvent(reference="chk_1", status="succeeded", amount=wave_order.total_price)

    payment_flow.apply_payment_event(event, gateway=gateway)
    payment_flow.apply_payment_event(event, gateway=gateway)

    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.PAID
    assert Payment.objects.filter(order=wave_order, status=PaymentStatus.SUCCEEDED).count() == 1


def test_underpaid_event_is_refused(wave_order):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()

    with pytest.raises(ConflictError):
        payment_flow.apply_payment_event(
            WebhookEvent(reference="chk_1", status="succeeded", amount=Decimal("1")),
            gateway=gateway,
        )

    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.AWAITING_PAYMENT


def test_wrong_currency_is_refused(wave_order):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()

    with pytest.raises(ConflictError):
        payment_flow.apply_payment_event(
            WebhookEvent(
                reference="chk_1",
                status="succeeded",
                amount=wave_order.total_price,
                currency="EUR",
            ),
            gateway=gateway,
        )


def test_unknown_reference_is_rejected(wave_order):
    with pytest.raises(NotFoundError):
        payment_flow.apply_payment_event(
            WebhookEvent(reference="inconnue", status="succeeded"), gateway=FakeGateway()
        )


def test_failed_event_cancels_the_order_and_frees_the_stock(wave_order, product):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()
    product.refresh_from_db()
    assert product.stock == 9

    payment_flow.apply_payment_event(WebhookEvent(reference="chk_1", status="failed"), gateway=gateway)

    wave_order.refresh_from_db()
    product.refresh_from_db()
    assert wave_order.status == OrderStatus.CANCELED
    assert product.stock == 10


def test_refresh_status_recovers_a_lost_webhook(wave_order):
    gateway = FakeGateway()
    payment_flow.start_payment(wave_order, gateway=gateway)
    wave_order.refresh_from_db()

    payment_flow.refresh_payment_status(wave_order, gateway=gateway)

    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.PAID


# ------------------------------------------------------- signature du webhook Wave
class TestWaveWebhookSignature:
    """override_settings ne décore pas une classe pytest : on passe par un fixture."""

    @pytest.fixture(autouse=True)
    def _signed_webhooks(self, settings):
        settings.WAVE_WEBHOOK_SECRET = WEBHOOK_SECRET
        settings.WAVE_REQUIRE_SIGNED_WEBHOOK = True

    def test_valid_signature_is_accepted(self):
        body = json.dumps({"id": "chk_1", "payment_status": "succeeded"}).encode()
        data = WaveGateway().verify_webhook(payload=body, signature=sign(body))
        assert data["id"] == "chk_1"

    def test_signature_in_header_list_form_is_accepted(self):
        body = json.dumps({"id": "chk_1"}).encode()
        header = f"t=1700000000,v1={sign(body)}"
        assert WaveGateway().verify_webhook(payload=body, signature=header)["id"] == "chk_1"

    def test_missing_signature_is_refused(self):
        body = json.dumps({"id": "chk_1", "payment_status": "succeeded"}).encode()
        with pytest.raises(PermissionDeniedError):
            WaveGateway().verify_webhook(payload=body, signature=None)

    def test_forged_signature_is_refused(self):
        body = json.dumps({"id": "chk_1", "payment_status": "succeeded"}).encode()
        with pytest.raises(PermissionDeniedError):
            WaveGateway().verify_webhook(payload=body, signature="0" * 64)

    def test_signature_of_another_payload_is_refused(self):
        body = json.dumps({"id": "chk_1", "payment_status": "succeeded"}).encode()
        other = json.dumps({"id": "chk_2", "payment_status": "succeeded"}).encode()
        with pytest.raises(PermissionDeniedError):
            WaveGateway().verify_webhook(payload=body, signature=sign(other))

    def test_signature_from_another_secret_is_refused(self):
        body = json.dumps({"id": "chk_1"}).encode()
        with pytest.raises(PermissionDeniedError):
            WaveGateway().verify_webhook(payload=body, signature=sign(body, "mauvais-secret"))

    def test_unreadable_body_is_refused(self):
        body = b"{ceci n'est pas du json"
        with pytest.raises(PaymentError):
            WaveGateway().verify_webhook(payload=body, signature=sign(body))


@override_settings(WAVE_WEBHOOK_SECRET="", WAVE_REQUIRE_SIGNED_WEBHOOK=True)
def test_webhook_is_refused_when_no_secret_is_configured():
    body = json.dumps({"id": "chk_1"}).encode()
    with pytest.raises(PermissionDeniedError):
        WaveGateway().verify_webhook(payload=body, signature=None)


def test_wave_event_parsing_normalises_status_and_amount():
    event = WaveGateway().parse_webhook(
        {"id": "chk_9", "payment_status": "SUCCEEDED", "amount": "25000", "currency": "XOF"}
    )
    assert event.reference == "chk_9"
    assert event.status == "succeeded"
    assert event.amount == Decimal("25000")


def test_wave_event_parsing_handles_enveloped_payload():
    event = WaveGateway().parse_webhook(
        {"type": "checkout.session.completed", "data": {"id": "chk_7", "payment_status": "complete"}}
    )
    assert event.reference == "chk_7"
    assert event.status == "succeeded"


# -------------------------------------------------------------- endpoint webhook
@override_settings(WAVE_WEBHOOK_SECRET=WEBHOOK_SECRET, WAVE_REQUIRE_SIGNED_WEBHOOK=True)
def test_unsigned_webhook_request_cannot_mark_an_order_paid(api, wave_order):
    payment_flow.start_payment(wave_order, gateway=FakeGateway())
    wave_order.refresh_from_db()

    response = api.post(
        reverse("api:orders:wave-callback"),
        data=json.dumps({"id": "chk_1", "payment_status": "succeeded"}),
        content_type="application/json",
    )

    assert response.status_code == 403
    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.AWAITING_PAYMENT
    assert wave_order.invoice.status != "paid"


@override_settings(WAVE_WEBHOOK_SECRET=WEBHOOK_SECRET, WAVE_REQUIRE_SIGNED_WEBHOOK=True)
def test_signed_webhook_request_marks_the_order_paid(api, wave_order):
    payment_flow.start_payment(wave_order, gateway=FakeGateway())
    wave_order.refresh_from_db()
    body = json.dumps(
        {
            "id": "chk_1",
            "payment_status": "succeeded",
            "amount": str(wave_order.total_price),
            "currency": wave_order.currency,
        }
    ).encode()

    response = api.post(
        reverse("api:orders:wave-callback"),
        data=body,
        content_type="application/json",
        HTTP_WAVE_SIGNATURE=sign(body),
    )

    assert response.status_code == 200
    wave_order.refresh_from_db()
    assert wave_order.status == OrderStatus.PAID
