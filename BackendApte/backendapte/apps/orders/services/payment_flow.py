"""Orchestration des encaissements.

Le webhook est la seule source de vérité pour marquer une commande payée, et il
n'est pris en compte que si :

* sa signature HMAC est valide (voir l'adaptateur du prestataire) ;
* sa référence correspond à un paiement que **nous** avons initié ;
* son montant correspond au total facturé.

Ces trois contrôles sont ce qui empêche un tiers de faire passer une commande en
« payée » sans règlement.
"""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.common.exceptions import ConflictError, DomainError, NotFoundError, PaymentError
from apps.common.money import money

from ..models import Order, OrderStatus, Payment, PaymentMethod, PaymentStatus
from . import billing, checkout
from .payments import get_gateway

logger = logging.getLogger(__name__)

#: Tolérance de rapprochement : aucune. Un écart signale une fraude ou un bug.
AMOUNT_TOLERANCE = Decimal("0")


def _callback_url() -> str:
    return f"{str(settings.BACKEND_URL).rstrip('/')}/api/orders/wave-callback/"


def _success_url(order: Order) -> str:
    return f"{str(settings.FRONTEND_URL).rstrip('/')}/orders/{order.pk}"


def start_payment(order: Order, *, gateway=None) -> Payment:
    """Ouvre une session de paiement pour une commande en attente.

    L'appel réseau au prestataire est délibérément *hors* transaction : si on
    l'enveloppait dans un ``atomic``, un échec ferait disparaître la trace du
    paiement échoué avec le rollback, et l'on perdrait la piste d'audit.
    """
    gateway = gateway or get_gateway()
    payment = _open_payment_record(order, gateway)
    if payment.checkout_url:
        # Session déjà ouverte et réutilisable.
        return payment

    try:
        session = gateway.create_checkout(
            amount=order.total_price,
            currency=order.currency,
            reference=f"ORDER-{order.pk}",
            phone_number=order.phone_number,
            idempotency_key=payment.idempotency_key,
            success_url=_success_url(order),
            callback_url=_callback_url(),
        )
    except PaymentError:
        _mark_payment_failed(payment, "Création de la session de paiement impossible")
        raise

    return _attach_checkout_session(order, payment, session)


@transaction.atomic
def _open_payment_record(order: Order, gateway) -> Payment:
    """Valide l'état de la commande et réserve une ligne de paiement."""
    if order.payment_method != PaymentMethod.WAVE:
        raise DomainError("Cette commande n'utilise pas le paiement mobile.", code="not_a_mobile_payment")
    if order.is_settled:
        raise ConflictError("Cette commande est déjà réglée.", code="order_already_paid")
    if order.status in {OrderStatus.CANCELED, OrderStatus.REFUNDED}:
        raise ConflictError("Cette commande est annulée.", code="order_canceled")

    # Une session encore ouverte est réutilisée : cliquer deux fois sur « payer »
    # ne doit pas créer deux encaissements.
    pending = (
        order.payments.filter(status=PaymentStatus.PENDING, amount=order.total_price)
        .exclude(checkout_url="")
        .first()
    )
    if pending is not None:
        return pending

    return Payment.objects.create(
        order=order,
        provider=gateway.name,
        idempotency_key=uuid.uuid4().hex,
        status=PaymentStatus.PENDING,
        amount=order.total_price,
        currency=order.currency,
    )


@transaction.atomic
def _mark_payment_failed(payment: Payment, reason: str) -> Payment:
    payment.status = PaymentStatus.FAILED
    payment.failure_reason = reason[:255]
    payment.save(update_fields=["status", "failure_reason", "updated_at"])
    return payment


@transaction.atomic
def _attach_checkout_session(order: Order, payment: Payment, session) -> Payment:
    payment.provider_reference = session.reference
    payment.checkout_url = session.checkout_url
    payment.provider_payload = session.raw
    payment.save(update_fields=["provider_reference", "checkout_url", "provider_payload", "updated_at"])

    order.refresh_from_db()
    if order.status == OrderStatus.PENDING:
        checkout.transition(order, OrderStatus.AWAITING_PAYMENT, reason="session de paiement ouverte")

    logger.info("Session de paiement %s ouverte pour la commande #%s", session.reference, order.pk)
    return payment


@transaction.atomic
def apply_payment_event(event, *, gateway=None) -> Payment:
    """Applique un événement de paiement vérifié (webhook ou relance manuelle)."""
    if not event.reference:
        raise DomainError("Événement de paiement sans référence.", code="missing_reference")

    payment = (
        Payment.objects.select_for_update()
        .select_related("order")
        .filter(provider_reference=event.reference)
        .first()
    )
    if payment is None:
        # Référence inconnue : soit un webhook d'un autre marchand, soit une
        # tentative d'injection. Dans les deux cas, rien à faire.
        raise NotFoundError("Aucun paiement ne correspond à cette référence.", code="unknown_payment")

    order = Order.objects.select_for_update().get(pk=payment.order_id)

    if payment.status == PaymentStatus.SUCCEEDED and event.status == "succeeded":
        # Wave réémet ses webhooks jusqu'à obtenir un 2xx : le rejeu est normal.
        logger.info("Webhook déjà traité pour le paiement %s", payment.provider_reference)
        return payment

    if event.status == "succeeded":
        _assert_amount_matches(payment, event)
        payment.status = PaymentStatus.SUCCEEDED
        payment.settled_at = timezone.now()
        payment.failure_reason = ""
        payment.provider_payload = event.raw or payment.provider_payload
        payment.save(
            update_fields=["status", "settled_at", "failure_reason", "provider_payload", "updated_at"]
        )
        if not order.is_settled:
            checkout.transition(order, OrderStatus.PAID, reason=f"paiement {payment.provider_reference}")
        else:
            invoice = getattr(order, "invoice", None)
            if invoice is not None:
                billing.mark_invoice_paid(invoice, paid_at=payment.settled_at)
        return payment

    if event.status == "failed":
        payment.status = PaymentStatus.FAILED
        payment.failure_reason = str((event.raw or {}).get("last_payment_error") or "Paiement refusé")[:255]
        payment.provider_payload = event.raw or payment.provider_payload
        payment.save(update_fields=["status", "failure_reason", "provider_payload", "updated_at"])
        # La commande est annulée et le stock rendu : sans cela, un panier
        # abandonné immobiliserait le stock indéfiniment.
        if order.status in {OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT}:
            checkout.transition(order, OrderStatus.CANCELED, reason="paiement échoué")
        return payment

    logger.info(
        "Événement de paiement ignoré (statut « %s ») pour %s", event.status, payment.provider_reference
    )
    return payment


def _assert_amount_matches(payment: Payment, event) -> None:
    """Refuse un encaissement dont le montant diffère du montant facturé."""
    if event.amount is None:
        return
    expected = money(payment.amount)
    received = money(event.amount)
    if abs(received - expected) > AMOUNT_TOLERANCE:
        logger.error(
            "Montant de paiement incohérent pour %s: attendu %s, reçu %s",
            payment.provider_reference,
            expected,
            received,
        )
        raise ConflictError("Le montant réglé ne correspond pas au montant facturé.", code="amount_mismatch")
    if event.currency and event.currency.upper() != payment.currency.upper():
        raise ConflictError("Devise de paiement inattendue.", code="currency_mismatch")


def handle_webhook(*, payload: bytes, signature: str | None, gateway=None) -> Payment:
    """Point d'entrée du webhook : vérifie, normalise, applique."""
    gateway = gateway or get_gateway()
    data = gateway.verify_webhook(payload=payload, signature=signature)
    event = gateway.parse_webhook(data)
    return apply_payment_event(event, gateway=gateway)


def refresh_payment_status(order: Order, *, gateway=None) -> Payment | None:
    """Interroge le prestataire (filet de sécurité si un webhook a été perdu)."""
    payment = order.payments.exclude(provider_reference="").order_by("-created_at").first()
    if payment is None:
        raise NotFoundError("Aucun paiement n'a été initié pour cette commande.", code="no_payment")

    gateway = gateway or get_gateway()
    event = gateway.fetch_status(payment.provider_reference)
    if event.status == "pending":
        return payment
    return apply_payment_event(event, gateway=gateway)
