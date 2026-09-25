"""Tests de l'arithmétique monétaire : c'est le socle de toute la facturation."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.test import override_settings

from apps.common.money import format_money, money, multiply, split_tax_inclusive, to_decimal, total


def test_to_decimal_never_inherits_float_imprecision():
    # 0.1 + 0.2 en float donne 0.30000000000000004 : le passage par str l'évite.
    assert to_decimal(0.1) + to_decimal(0.2) == Decimal("0.3")


@pytest.mark.parametrize(
    ("value", "expected"),
    [("25000", "25000"), ("25000.49", "25000"), ("25000.5", "25001"), ("0", "0")],
)
def test_money_rounds_to_whole_units_for_xof(value, expected):
    assert money(value) == Decimal(expected)


def test_multiply_quantizes_once():
    # 3 x 8333.33 = 24999.99 -> 25000, et non 3 x 8333 = 24999.
    assert multiply(Decimal("8333.33"), 3) == Decimal("25000")


def test_total_sums_exactly():
    assert total([Decimal("25000"), Decimal("15500"), Decimal("500")]) == Decimal("41000")


def test_split_tax_inclusive_keeps_gross_untouched():
    net, tax = split_tax_inclusive(Decimal("118000"), Decimal("0.18"))
    assert net + tax == Decimal("118000")
    assert net == Decimal("100000")
    assert tax == Decimal("18000")


def test_split_tax_inclusive_balances_on_awkward_amounts():
    for gross in ("25000", "15500", "1", "999999"):
        net, tax = split_tax_inclusive(Decimal(gross), Decimal("0.18"))
        assert net + tax == Decimal(gross), gross


def test_split_tax_inclusive_without_tax():
    assert split_tax_inclusive(Decimal("25000"), Decimal("0")) == (Decimal("25000"), Decimal("0"))


def test_format_money_uses_configured_symbol():
    assert format_money(Decimal("25000")).endswith("FCFA")
    assert "25" in format_money(Decimal("25000"))


@override_settings(BILLING_CURRENCY_DECIMAL_PLACES=2, BILLING_CURRENCY_SYMBOL="EUR")
def test_currency_decimal_places_are_configurable():
    assert money("10.005") == Decimal("10.01")
    assert format_money("10.005").endswith("EUR")


def test_money_rejects_garbage():
    with pytest.raises(ValueError):
        money("pas-un-montant")
