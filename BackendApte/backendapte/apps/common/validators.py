"""Validateurs partagés."""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

PHONE_MIN_DIGITS = 9
PHONE_MAX_DIGITS = 15
_NON_DIGITS = re.compile(r"\D")


def normalize_phone(value: str | None) -> str | None:
    """Réduit un numéro à ses chiffres (``+221 77 123 45 67`` -> ``221771234567``)."""
    if not value:
        return None
    digits = _NON_DIGITS.sub("", str(value))
    return digits or None


def validate_phone(value: str) -> str:
    digits = normalize_phone(value)
    if not digits or not (PHONE_MIN_DIGITS <= len(digits) <= PHONE_MAX_DIGITS):
        raise ValidationError(
            _("Numéro de téléphone invalide (%(min)d à %(max)d chiffres attendus)."),
            code="invalid_phone",
            params={"min": PHONE_MIN_DIGITS, "max": PHONE_MAX_DIGITS},
        )
    return digits


def validate_positive_quantity(value) -> int:
    try:
        quantity = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(_("Quantité invalide."), code="invalid_quantity") from exc
    if quantity < 1:
        raise ValidationError(_("La quantité doit être au moins égale à 1."), code="invalid_quantity")
    return quantity
