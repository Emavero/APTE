"""Arithmétique monétaire.

Toute la logique de facturation de l'application passe par ce module : aucun
montant ne doit être manipulé en ``float`` (erreurs d'arrondi binaires), et tout
montant doit être quantifié dans la devise courante avant d'être persisté ou
renvoyé au client.

Le XOF (Franc CFA) n'a pas de sous-unité : les montants sont donc arrondis à
l'unité. Le nombre de décimales reste configurable pour permettre le support
d'une autre devise sans toucher au code métier.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from django.conf import settings

ZERO = Decimal("0")


def currency_code() -> str:
    return getattr(settings, "BILLING_CURRENCY", "XOF")


def currency_decimal_places() -> int:
    return int(getattr(settings, "BILLING_CURRENCY_DECIMAL_PLACES", 0))


def _exponent() -> Decimal:
    places = currency_decimal_places()
    return Decimal(1) if places == 0 else Decimal(1).scaleb(-places)


def to_decimal(value) -> Decimal:
    """Convertit une valeur arbitraire en ``Decimal`` sans passer par float."""
    if isinstance(value, Decimal):
        return value
    if isinstance(value, float):
        # str() évite d'hériter de l'imprécision binaire du float.
        return Decimal(str(value))
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError(f"Montant invalide: {value!r}") from exc


def money(value) -> Decimal:
    """Quantifie un montant dans la devise de facturation (arrondi commercial)."""
    return to_decimal(value).quantize(_exponent(), rounding=ROUND_HALF_UP)


def multiply(unit_price, quantity) -> Decimal:
    """Prix unitaire x quantité, quantifié une seule fois (pas d'arrondi double)."""
    return money(to_decimal(unit_price) * to_decimal(quantity))


def total(amounts) -> Decimal:
    """Somme quantifiée d'une série de montants déjà quantifiés."""
    result = ZERO
    for amount in amounts:
        result += to_decimal(amount)
    return money(result)


def split_tax_inclusive(gross, tax_rate) -> tuple[Decimal, Decimal]:
    """Éclate un montant TTC en (HT, TVA).

    Les prix catalogue sont affichés TTC : le total payé par le client ne doit
    jamais varier selon le taux de TVA. On extrait donc la taxe du montant brut
    et on déduit la TVA par différence, ce qui garantit l'égalité comptable
    ``HT + TVA == TTC`` sans centime perdu.
    """
    gross = money(gross)
    rate = to_decimal(tax_rate)
    if rate <= ZERO:
        return gross, ZERO
    net = money(gross / (Decimal(1) + rate))
    return net, money(gross - net)


def format_money(value) -> str:
    """Rendu lisible d'un montant, ex. ``25 000 FCFA``."""
    amount = money(value)
    places = currency_decimal_places()
    formatted = f"{amount:,.{places}f}".replace(",", " ")
    symbol = getattr(settings, "BILLING_CURRENCY_SYMBOL", "FCFA")
    return f"{formatted} {symbol}"
