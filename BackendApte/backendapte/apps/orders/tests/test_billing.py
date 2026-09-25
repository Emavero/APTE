"""Tests de facturation : totaux, TVA, numérotation, immuabilité."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.test import override_settings

from apps.common.exceptions import ConflictError
from apps.orders.models import Invoice, InvoiceStatus
from apps.orders.services import billing

pytestmark = pytest.mark.django_db


def lines(*pairs):
    return [billing.LineTotals.build(price, qty) for price, qty in pairs]


# ------------------------------------------------------------------- totaux
def test_line_total_is_computed_from_decimals():
    line = billing.LineTotals.build(Decimal("25000"), 3)
    assert line.line_total == Decimal("75000")


@override_settings(BILLING_TAX_RATE="0.18", BILLING_PRICES_INCLUDE_TAX=True)
def test_totals_extract_tax_without_changing_what_the_customer_pays():
    totals = billing.compute_order_totals(lines((Decimal("25000"), 2), (Decimal("15500"), 1)))
    assert totals.items_total == Decimal("65500")
    # Le client paie exactement la somme des lignes, TVA comprise.
    assert totals.total == Decimal("65500")
    assert totals.subtotal_excl_tax + totals.tax_amount == totals.total


@override_settings(BILLING_TAX_RATE="0.18", BILLING_PRICES_INCLUDE_TAX=False)
def test_totals_add_tax_when_prices_are_excluding_tax():
    totals = billing.compute_order_totals(lines((Decimal("10000"), 1)))
    assert totals.subtotal_excl_tax == Decimal("10000")
    assert totals.tax_amount == Decimal("1800")
    assert totals.total == Decimal("11800")


@override_settings(BILLING_TAX_RATE="0")
def test_totals_without_tax():
    totals = billing.compute_order_totals(lines((Decimal("25000"), 1)))
    assert totals.tax_amount == Decimal("0")
    assert totals.total == totals.subtotal_excl_tax == Decimal("25000")


@override_settings(BILLING_FREE_SHIPPING=False, BILLING_SHIPPING_FLAT_FEE="2000")
def test_shipping_fee_is_added_when_configured():
    totals = billing.compute_order_totals(lines((Decimal("25000"), 1)))
    assert totals.shipping_amount == Decimal("2000")
    assert totals.total == Decimal("27000")


def test_free_shipping_by_default_matches_the_cart_promise():
    totals = billing.compute_order_totals(lines((Decimal("25000"), 1)))
    assert totals.shipping_amount == Decimal("0")


def test_discount_larger_than_order_is_refused():
    with pytest.raises(ConflictError):
        billing.compute_order_totals(lines((Decimal("1000"), 1)), discount_amount=Decimal("5000"))


# ------------------------------------------------------------- numérotation
def test_invoice_numbers_are_sequential_and_gapless(user, product, delivery_payload):
    from apps.orders.services import checkout

    numbers = []
    for _ in range(3):
        order = checkout.place_order(
            user=user,
            items=[{"product_id": product.id, "quantity": 1}],
            payment_method="cash",
            delivery={"name": "Awa", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""},
        )
        numbers.append(order.invoice.number)

    suffixes = [int(number.rsplit("-", 1)[1]) for number in numbers]
    assert suffixes == [1, 2, 3]
    assert len(set(numbers)) == 3
    assert all(number.startswith("APTE-") for number in numbers)


@override_settings(BILLING_INVOICE_PREFIX="TEST")
def test_invoice_prefix_is_configurable():
    number = billing.allocate_invoice_number()
    assert number.startswith("TEST-")


# ----------------------------------------------------------------- émission
def test_issue_invoice_is_idempotent(user, product):
    from apps.orders.services import checkout

    order = checkout.place_order(
        user=user,
        items=[{"product_id": product.id, "quantity": 2}],
        payment_method="cash",
        delivery={"name": "Awa", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""},
    )
    first = order.invoice
    second = billing.issue_invoice(order)
    assert first.pk == second.pk
    assert Invoice.objects.filter(order=order).count() == 1


@override_settings(BILLING_TAX_RATE="0.18")
def test_issued_invoice_is_accounting_balanced(user, product, other_product):
    from apps.orders.services import checkout

    order = checkout.place_order(
        user=user,
        items=[
            {"product_id": product.id, "quantity": 2},
            {"product_id": other_product.id, "quantity": 3},
        ],
        payment_method="cash",
        delivery={"name": "Awa", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""},
    )
    invoice = order.invoice
    assert invoice.is_balanced
    assert invoice.total_incl_tax == order.total_price
    assert invoice.status == InvoiceStatus.ISSUED


def test_invoice_snapshots_the_customer_so_a_profile_change_cannot_rewrite_it(user, product):
    from apps.orders.services import checkout

    order = checkout.place_order(
        user=user,
        items=[{"product_id": product.id, "quantity": 1}],
        payment_method="cash",
        delivery={"name": "Awa Diop", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""},
    )
    invoice = order.invoice
    assert invoice.customer_name == "Awa Diop"

    user.full_name = "Nom Modifié"
    user.email = "nouveau@apte.test"
    user.save()

    invoice.refresh_from_db()
    assert invoice.customer_name == "Awa Diop"
    assert invoice.customer_email == "client@apte.test"


def test_order_line_snapshots_price_so_a_tariff_change_cannot_rewrite_it(user, product):
    from apps.orders.services import checkout

    order = checkout.place_order(
        user=user,
        items=[{"product_id": product.id, "quantity": 2}],
        payment_method="cash",
        delivery={"name": "Awa", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""},
    )
    assert order.total_price == Decimal("50000")

    product.price = Decimal("99000")
    product.save()

    order.refresh_from_db()
    item = order.items.get()
    assert item.unit_price == Decimal("25000")
    assert item.line_total == Decimal("50000")
    assert order.total_price == Decimal("50000")
    assert order.invoice.total_incl_tax == Decimal("50000")
