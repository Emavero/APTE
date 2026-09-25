"""Prestataires de paiement."""

from __future__ import annotations

from django.conf import settings
from django.utils.module_loading import import_string

from .base import CheckoutSession, PaymentGateway, WebhookEvent, normalize_status

__all__ = [
    "CheckoutSession",
    "PaymentGateway",
    "WebhookEvent",
    "normalize_status",
    "get_gateway",
]


def get_gateway() -> PaymentGateway:
    """Instancie le prestataire configuré (injection par réglage, testable)."""
    dotted_path = getattr(settings, "PAYMENT_GATEWAY", "apps.orders.services.payments.wave.WaveGateway")
    return import_string(dotted_path)()
