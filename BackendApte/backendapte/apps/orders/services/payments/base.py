"""Contrat d'un prestataire de paiement.

Le domaine ne dépend que de cette interface : remplacer Wave par un autre
opérateur (ou par un double de test) ne touche pas au code de commande.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Protocol


@dataclass(frozen=True)
class CheckoutSession:
    """Session de paiement créée chez le prestataire."""

    reference: str
    checkout_url: str
    status: str = "pending"
    raw: dict = field(default_factory=dict)


@dataclass(frozen=True)
class WebhookEvent:
    """Événement de paiement normalisé, issu d'un webhook vérifié."""

    reference: str
    status: str
    amount: Decimal | None = None
    currency: str | None = None
    raw: dict = field(default_factory=dict)


class PaymentGateway(Protocol):
    """Opérations attendues d'un prestataire de paiement."""

    name: str

    def is_configured(self) -> bool: ...

    def create_checkout(
        self,
        *,
        amount: Decimal,
        currency: str,
        reference: str,
        phone_number: str,
        idempotency_key: str,
        success_url: str,
        callback_url: str,
    ) -> CheckoutSession: ...

    def fetch_status(self, reference: str) -> WebhookEvent: ...

    def verify_webhook(self, *, payload: bytes, signature: str | None) -> dict: ...

    def parse_webhook(self, data: dict) -> WebhookEvent: ...


#: Correspondance statut prestataire -> statut interne.
SUCCESS_STATUSES = frozenset({"succeeded", "success", "completed", "complete", "paid"})
FAILURE_STATUSES = frozenset({"failed", "failure", "error", "expired", "canceled", "cancelled"})


def normalize_status(raw_status: str | None) -> str:
    value = (raw_status or "").strip().lower()
    if value in SUCCESS_STATUSES:
        return "succeeded"
    if value in FAILURE_STATUSES:
        return "failed"
    return "pending"
