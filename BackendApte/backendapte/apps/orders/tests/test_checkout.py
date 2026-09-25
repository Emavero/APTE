"""Tests du tunnel de commande : stock, prix serveur, machine à états."""

from __future__ import annotations

from decimal import Decimal

import pytest

from apps.common.exceptions import ConflictError, DomainError, InsufficientStockError, InvalidTransitionError
from apps.orders.models import OrderStatus
from apps.orders.services import checkout

pytestmark = pytest.mark.django_db

DELIVERY = {"name": "Awa", "phone": "77 123 45 67", "address": "Rue 1", "city": "Dakar", "notes": ""}


def place(user, items, **kwargs):
    kwargs.setdefault("payment_method", "cash")
    kwargs.setdefault("delivery", DELIVERY)
    return checkout.place_order(user=user, items=items, **kwargs)


# --------------------------------------------------------------------- stock
def test_placing_an_order_decrements_stock(user, product):
    place(user, [{"product_id": product.id, "quantity": 3}])
    product.refresh_from_db()
    assert product.stock == 7


def test_order_beyond_available_stock_is_refused(user, other_product):
    with pytest.raises(InsufficientStockError):
        place(user, [{"product_id": other_product.id, "quantity": 5}])
    other_product.refresh_from_db()
    assert other_product.stock == 4


def test_refused_order_leaves_no_trace(user, other_product):
    from apps.orders.models import Order

    with pytest.raises(InsufficientStockError):
        place(user, [{"product_id": other_product.id, "quantity": 99}])
    assert Order.objects.count() == 0


def test_stock_is_exhausted_exactly(user, other_product):
    place(user, [{"product_id": other_product.id, "quantity": 4}])
    other_product.refresh_from_db()
    assert other_product.stock == 0
    with pytest.raises(InsufficientStockError):
        place(user, [{"product_id": other_product.id, "quantity": 1}])


def test_duplicate_lines_are_consolidated(user, product):
    order = place(
        user,
        [
            {"product_id": product.id, "quantity": 2},
            {"product_id": product.id, "quantity": 3},
        ],
    )
    assert order.items.count() == 1
    item = order.items.get()
    assert item.quantity == 5
    assert order.total_price == Decimal("125000")
    product.refresh_from_db()
    assert product.stock == 5


def test_inactive_product_cannot_be_ordered(user, product):
    product.is_active = False
    product.save()
    with pytest.raises(ConflictError):
        place(user, [{"product_id": product.id, "quantity": 1}])


def test_unknown_product_is_refused(user):
    with pytest.raises(DomainError):
        place(user, [{"product_id": 999999, "quantity": 1}])


def test_empty_order_is_refused(user):
    with pytest.raises(DomainError):
        place(user, [])


@pytest.mark.parametrize("quantity", [0, -3, "abc", None])
def test_invalid_quantities_are_refused(user, product, quantity):
    with pytest.raises(Exception):
        place(user, [{"product_id": product.id, "quantity": quantity}])


# ---------------------------------------------------------------- montants
def test_totals_come_from_the_catalogue_not_from_the_client(user, product):
    order = place(
        user,
        [{"product_id": product.id, "quantity": 2, "price": "1", "line_total": "1"}],
    )
    assert order.items_total == Decimal("50000")
    assert order.total_price == Decimal("50000")


def test_every_order_gets_an_invoice(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    assert order.invoice is not None
    assert order.invoice.total_incl_tax == order.total_price


# ------------------------------------------------------------- mode de paiement
def test_wave_order_requires_a_phone_number(user, product):
    with pytest.raises(DomainError):
        place(user, [{"product_id": product.id, "quantity": 1}], payment_method="wave")


def test_wave_phone_is_normalised(user, product):
    order = place(
        user,
        [{"product_id": product.id, "quantity": 1}],
        payment_method="wave",
        phone_number="+221 77 123 45 67",
    )
    assert order.phone_number == "221771234567"


def test_cash_order_stores_no_payment_phone(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}], phone_number="770000000")
    assert order.phone_number == ""


def test_unknown_payment_method_is_refused(user, product):
    with pytest.raises(DomainError):
        place(user, [{"product_id": product.id, "quantity": 1}], payment_method="bitcoin")


# ------------------------------------------------------------ machine à états
def test_cancelling_restores_stock(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 4}])
    product.refresh_from_db()
    assert product.stock == 6

    checkout.cancel_order(order)
    product.refresh_from_db()
    assert product.stock == 10
    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELED
    assert order.canceled_at is not None


def test_cancelling_twice_does_not_restore_stock_twice(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 4}])
    checkout.transition(order, OrderStatus.CANCELED)
    order.refresh_from_db()
    checkout.transition(order, OrderStatus.CANCELED)
    product.refresh_from_db()
    assert product.stock == 10


def test_cancelled_order_cancels_its_invoice(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    checkout.cancel_order(order)
    order.refresh_from_db()
    assert order.invoice.status == "canceled"


def test_paid_order_cannot_be_cancelled_by_the_customer(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    checkout.transition(order, OrderStatus.PAID)
    order.refresh_from_db()
    with pytest.raises(ConflictError):
        checkout.cancel_order(order)


def test_paying_marks_the_invoice_paid(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    checkout.transition(order, OrderStatus.PAID)
    order.refresh_from_db()
    assert order.paid_at is not None
    assert order.invoice.status == "paid"
    assert order.invoice.paid_at is not None


def test_a_cancelled_order_can_never_become_paid(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    checkout.transition(order, OrderStatus.CANCELED)
    order.refresh_from_db()
    with pytest.raises(InvalidTransitionError):
        checkout.transition(order, OrderStatus.PAID)


def test_pending_order_cannot_jump_to_shipped(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    with pytest.raises(InvalidTransitionError):
        checkout.transition(order, OrderStatus.SHIPPED)


def test_transition_to_same_status_is_a_noop(user, product):
    order = place(user, [{"product_id": product.id, "quantity": 1}])
    assert checkout.transition(order, OrderStatus.PENDING).status == OrderStatus.PENDING
