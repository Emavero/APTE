"""Erreurs métier et traduction vers les réponses HTTP.

La couche domaine (``services``) lève des exceptions métier qui ne dépendent pas
de HTTP. Le gestionnaire ci-dessous les traduit en réponses DRF, afin que les
vues restent de simples contrôleurs.
"""

from __future__ import annotations

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


class DomainError(Exception):
    """Erreur métier attendue (règle de gestion non respectée)."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_message = "La demande n'a pas pu être traitée."
    code = "domain_error"

    def __init__(self, message: str | None = None, *, code: str | None = None, details=None):
        self.message = message or self.default_message
        if code:
            self.code = code
        self.details = details
        super().__init__(self.message)

    def as_payload(self) -> dict:
        payload = {"detail": self.message, "code": self.code}
        if self.details:
            payload["errors"] = self.details
        return payload


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Ressource introuvable."
    code = "not_found"


class PermissionDeniedError(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "Action non autorisée."
    code = "permission_denied"


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    default_message = "Conflit avec l'état actuel de la ressource."
    code = "conflict"


class InsufficientStockError(DomainError):
    default_message = "Stock insuffisant."
    code = "insufficient_stock"


class PaymentError(DomainError):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_message = "Le service de paiement est indisponible."
    code = "payment_error"


class InvalidTransitionError(ConflictError):
    default_message = "Transition de statut interdite."
    code = "invalid_transition"


def api_exception_handler(exc, context):
    """Gestionnaire d'exceptions DRF : réponses d'erreur homogènes."""
    if isinstance(exc, DomainError):
        return Response(exc.as_payload(), status=exc.status_code)

    if isinstance(exc, DjangoValidationError):
        return Response(
            {"detail": "Données invalides.", "code": "invalid", "errors": exc.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {"detail": "Ressource introuvable.", "code": "not_found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        # Erreur non maîtrisée : journalisée en clair, masquée pour l'appelant.
        logger.exception("Erreur serveur non gérée", exc_info=exc)
        if isinstance(exc, IntegrityError):
            return Response(
                {"detail": "Conflit de données.", "code": "integrity_error"},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {"detail": "Erreur interne du serveur.", "code": "server_error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return response
