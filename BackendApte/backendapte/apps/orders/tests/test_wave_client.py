"""Tests du client HTTP Wave (réseau simulé, aucun appel sortant réel)."""

from __future__ import annotations

import json
from decimal import Decimal

import pytest
import requests
import requests_mock
from django.test import override_settings

from apps.common.exceptions import PaymentError
from apps.orders.services.payments import get_gateway
from apps.orders.services.payments.wave import WaveGateway

BASE_URL = "https://api.wave.test/v1"
CHECKOUT_URL = f"{BASE_URL}/checkout/sessions"


@pytest.fixture
def gateway(settings):
    settings.WAVE_API_URL = BASE_URL
    settings.WAVE_API_KEY = "cle-de-test"
    settings.WAVE_WEBHOOK_SECRET = "secret-de-test"
    return WaveGateway()


def checkout_args(**overrides):
    return {
        "amount": Decimal("25000"),
        "currency": "XOF",
        "reference": "ORDER-1",
        "phone_number": "+221 77 123 45 67",
        "idempotency_key": "cle-idempotence",
        "success_url": "https://apte.test/orders/1",
        "callback_url": "https://api.apte.test/api/orders/wave-callback/",
        **overrides,
    }


# ------------------------------------------------------------------ résolution
def test_gateway_is_resolved_from_settings(settings):
    settings.PAYMENT_GATEWAY = "apps.orders.services.payments.wave.WaveGateway"
    assert isinstance(get_gateway(), WaveGateway)


@override_settings(WAVE_API_KEY="", WAVE_API_URL=BASE_URL)
def test_gateway_reports_missing_configuration():
    assert WaveGateway().is_configured() is False


def test_checkout_without_configuration_is_refused(settings):
    settings.WAVE_API_KEY = ""
    with pytest.raises(PaymentError) as excinfo:
        WaveGateway().create_checkout(**checkout_args())
    assert excinfo.value.code == "gateway_not_configured"


# -------------------------------------------------------------------- checkout
def test_create_checkout_sends_the_expected_request(gateway):
    with requests_mock.Mocker() as mock:
        mock.post(
            CHECKOUT_URL,
            json={"id": "chk_42", "wave_launch_url": "https://pay.wave.test/chk_42"},
            status_code=201,
        )
        session = gateway.create_checkout(**checkout_args())

        request = mock.request_history[0]
        body = json.loads(request.body)

    assert session.reference == "chk_42"
    assert session.checkout_url == "https://pay.wave.test/chk_42"
    # Le montant part en chaîne : un flottant JSON introduirait une dérive.
    assert body["amount"] == "25000"
    assert body["currency"] == "XOF"
    assert body["client_reference"] == "ORDER-1"
    # Le numéro est normalisé avant envoi.
    assert body["restrict_payer_mobile"] == "221771234567"
    assert request.headers["Authorization"] == "Bearer cle-de-test"
    # La clé d'idempotence évite qu'un rejeu réseau ouvre deux encaissements.
    assert request.headers["Idempotency-Key"] == "cle-idempotence"


def test_create_checkout_omits_the_phone_when_absent(gateway):
    with requests_mock.Mocker() as mock:
        mock.post(CHECKOUT_URL, json={"id": "chk_1", "wave_launch_url": "https://pay.wave.test/1"})
        gateway.create_checkout(**checkout_args(phone_number=""))
        body = json.loads(mock.request_history[0].body)
    assert "restrict_payer_mobile" not in body


@pytest.mark.parametrize("status_code", [400, 401, 429, 500, 503])
def test_gateway_http_errors_become_payment_errors(gateway, status_code):
    with requests_mock.Mocker() as mock:
        mock.post(CHECKOUT_URL, status_code=status_code, json={"message": "refusé"})
        with pytest.raises(PaymentError):
            gateway.create_checkout(**checkout_args())


def test_network_timeout_becomes_a_payment_error(gateway):
    with requests_mock.Mocker() as mock:
        mock.post(CHECKOUT_URL, exc=requests.exceptions.ConnectTimeout)
        with pytest.raises(PaymentError):
            gateway.create_checkout(**checkout_args())


def test_unreadable_response_becomes_a_payment_error(gateway):
    with requests_mock.Mocker() as mock:
        mock.post(CHECKOUT_URL, text="<html>maintenance</html>")
        with pytest.raises(PaymentError):
            gateway.create_checkout(**checkout_args())


@pytest.mark.parametrize(
    "payload",
    [
        {"id": "chk_1"},  # URL de paiement manquante
        {"wave_launch_url": "https://pay.wave.test/1"},  # référence manquante
        {},
    ],
)
def test_incomplete_response_is_refused(gateway, payload):
    """Une réponse tronquée ne doit pas produire une session inutilisable."""
    with requests_mock.Mocker() as mock:
        mock.post(CHECKOUT_URL, json=payload)
        with pytest.raises(PaymentError):
            gateway.create_checkout(**checkout_args())


def test_alternate_launch_url_field_is_accepted(gateway):
    with requests_mock.Mocker() as mock:
        mock.post(CHECKOUT_URL, json={"id": "chk_9", "launch_url": "https://pay.wave.test/9"})
        session = gateway.create_checkout(**checkout_args())
    assert session.checkout_url == "https://pay.wave.test/9"


# ---------------------------------------------------------------------- statut
def test_fetch_status_normalises_the_response(gateway):
    with requests_mock.Mocker() as mock:
        mock.get(
            f"{CHECKOUT_URL}/chk_7",
            json={"id": "chk_7", "payment_status": "succeeded", "amount": "25000", "currency": "XOF"},
        )
        event = gateway.fetch_status("chk_7")

    assert event.reference == "chk_7"
    assert event.status == "succeeded"
    assert event.amount == Decimal("25000")
    assert event.currency == "XOF"


def test_fetch_status_propagates_a_gateway_failure(gateway):
    with requests_mock.Mocker() as mock:
        mock.get(f"{CHECKOUT_URL}/chk_7", status_code=502)
        with pytest.raises(PaymentError):
            gateway.fetch_status("chk_7")


def test_fetch_status_without_configuration_is_refused(settings):
    settings.WAVE_API_KEY = ""
    with pytest.raises(PaymentError):
        WaveGateway().fetch_status("chk_7")


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("succeeded", "succeeded"),
        ("SUCCESS", "succeeded"),
        ("completed", "succeeded"),
        ("paid", "succeeded"),
        ("failed", "failed"),
        ("expired", "failed"),
        ("cancelled", "failed"),
        ("processing", "pending"),
        (None, "pending"),
    ],
)
def test_status_normalisation(gateway, raw, expected):
    assert gateway.parse_webhook({"id": "x", "payment_status": raw}).status == expected
