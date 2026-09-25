"""Adaptateur du prestataire Wave (https://developer.wave.com/)."""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from decimal import Decimal

import requests
from django.conf import settings

from apps.common.exceptions import PaymentError, PermissionDeniedError
from apps.common.money import money, to_decimal
from apps.common.validators import normalize_phone

from .base import CheckoutSession, WebhookEvent, normalize_status

logger = logging.getLogger(__name__)


class WaveGateway:
    """Client HTTP Wave + vérification des webhooks."""

    name = "wave"

    def __init__(self, *, session: requests.Session | None = None):
        self.base_url = str(getattr(settings, "WAVE_API_URL", "")).rstrip("/")
        self.api_key = getattr(settings, "WAVE_API_KEY", "")
        self.webhook_secret = getattr(settings, "WAVE_WEBHOOK_SECRET", "")
        self.timeout = int(getattr(settings, "WAVE_TIMEOUT_SECONDS", 15))
        self._session = session or requests.Session()

    # ----------------------------------------------------------------- config
    def is_configured(self) -> bool:
        return bool(self.api_key and self.base_url)

    def _headers(self, *, idempotency_key: str | None = None) -> dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if idempotency_key:
            # Un rejeu réseau ne doit pas créer une seconde session de paiement.
            headers["Idempotency-Key"] = idempotency_key
        return headers

    # --------------------------------------------------------------- checkout
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
    ) -> CheckoutSession:
        if not self.is_configured():
            raise PaymentError(
                "Le paiement mobile n'est pas configuré sur ce serveur.",
                code="gateway_not_configured",
            )

        payload = {
            # Wave attend le montant en chaîne pour éviter toute dérive flottante.
            "amount": str(money(amount)),
            "currency": currency,
            "client_reference": reference,
            "error_url": success_url,
            "success_url": success_url,
            "checkout_intent": "web_payment",
        }
        phone = normalize_phone(phone_number)
        if phone:
            payload["restrict_payer_mobile"] = phone

        try:
            response = self._session.post(
                f"{self.base_url}/checkout/sessions",
                data=json.dumps(payload),
                headers=self._headers(idempotency_key=idempotency_key),
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()
        except requests.exceptions.RequestException as exc:
            # Le détail technique reste dans les journaux : il n'a rien à faire
            # dans une réponse HTTP destinée au client final.
            logger.warning("Échec de création de la session Wave (%s): %s", reference, exc)
            raise PaymentError(
                "Le service de paiement est momentanément indisponible. Réessayez dans quelques instants."
            ) from exc
        except ValueError as exc:
            logger.warning("Réponse Wave illisible pour %s", reference)
            raise PaymentError("Réponse invalide du service de paiement.") from exc

        reference_id = body.get("id")
        checkout_url = body.get("wave_launch_url") or body.get("launch_url") or ""
        if not reference_id or not checkout_url:
            logger.warning("Réponse Wave incomplète pour %s: %s", reference, sorted(body))
            raise PaymentError("Réponse incomplète du service de paiement.")

        return CheckoutSession(
            reference=str(reference_id),
            checkout_url=checkout_url,
            status=normalize_status(body.get("payment_status") or body.get("status")),
            raw=body,
        )

    # ----------------------------------------------------------------- statut
    def fetch_status(self, reference: str) -> WebhookEvent:
        if not self.is_configured():
            raise PaymentError(
                "Le paiement mobile n'est pas configuré sur ce serveur.",
                code="gateway_not_configured",
            )
        try:
            response = self._session.get(
                f"{self.base_url}/checkout/sessions/{reference}",
                headers=self._headers(),
                timeout=self.timeout,
            )
            response.raise_for_status()
            body = response.json()
        except requests.exceptions.RequestException as exc:
            logger.warning("Échec de vérification du paiement Wave %s: %s", reference, exc)
            raise PaymentError("Impossible de vérifier le paiement pour le moment.") from exc
        except ValueError as exc:
            raise PaymentError("Réponse invalide du service de paiement.") from exc
        return self.parse_webhook(body)

    # ---------------------------------------------------------------- webhook
    def verify_webhook(self, *, payload: bytes, signature: str | None) -> dict:
        """Vérifie la signature HMAC puis décode le corps du webhook.

        Sans cette vérification, n'importe qui pourrait appeler le callback et
        faire passer une commande en « payée » sans avoir rien réglé.
        """
        require_signature = bool(getattr(settings, "WAVE_REQUIRE_SIGNED_WEBHOOK", True))

        if not self.webhook_secret:
            if require_signature:
                logger.error("Webhook Wave reçu alors que WAVE_WEBHOOK_SECRET n'est pas défini.")
                raise PermissionDeniedError(
                    "Webhook refusé : vérification de signature indisponible.",
                    code="webhook_unverifiable",
                )
            logger.warning("Vérification de signature du webhook Wave désactivée.")
        else:
            if not signature or not self._signature_matches(payload, signature):
                logger.warning("Signature de webhook Wave invalide.")
                raise PermissionDeniedError(
                    "Signature du webhook invalide.", code="invalid_webhook_signature"
                )

        try:
            data = json.loads(payload.decode("utf-8") or "{}")
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise PaymentError("Corps de webhook illisible.", code="invalid_webhook_body") from exc
        if not isinstance(data, dict):
            raise PaymentError("Corps de webhook inattendu.", code="invalid_webhook_body")
        return data

    def _signature_matches(self, payload: bytes, signature: str) -> bool:
        expected = hmac.new(self.webhook_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
        # compare_digest : comparaison à temps constant (pas de fuite par timing).
        for candidate in self._candidate_signatures(signature):
            if hmac.compare_digest(expected, candidate):
                return True
        return False

    @staticmethod
    def _candidate_signatures(signature: str):
        """Accepte ``<hex>`` comme ``t=...,v1=<hex>`` selon l'en-tête envoyé."""
        raw = signature.strip()
        yield raw
        for part in raw.split(","):
            key, _, value = part.strip().partition("=")
            if value and key.lower() in {"v1", "sha256", "signature"}:
                yield value.strip()

    def parse_webhook(self, data: dict) -> WebhookEvent:
        body = data.get("data") if isinstance(data.get("data"), dict) else data
        amount = body.get("amount")
        return WebhookEvent(
            reference=str(body.get("id") or body.get("checkout_session_id") or ""),
            status=normalize_status(body.get("payment_status") or body.get("status")),
            amount=to_decimal(amount) if amount is not None else None,
            currency=body.get("currency"),
            raw=data,
        )
