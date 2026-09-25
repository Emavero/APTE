"""Tests de l'API commandes : cloisonnement, facture, annulation."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.urls import reverse

from apps.orders.models import OrderStatus
from apps.orders.services import checkout

pytestmark = pytest.mark.django_db

DELIVERY = {"name": "Awa", "phone": "770000001", "address": "Rue 1", "city": "Dakar", "notes": ""}


def payload(product, delivery_payload, **extra):
    return {"items": [{"product_id": product.id, "quantity": 2}], **delivery_payload, **extra}


def make_order(user, product, quantity=1):
    return checkout.place_order(
        user=user,
        items=[{"product_id": product.id, "quantity": quantity}],
        payment_method="cash",
        delivery=DELIVERY,
    )


# ------------------------------------------------------------------- création
def test_anonymous_cannot_place_an_order(api, product, delivery_payload):
    response = api.post(reverse("api:orders:list-create"), payload(product, delivery_payload), format="json")
    assert response.status_code == 401


def test_placing_a_cash_order(auth_api, product, delivery_payload):
    response = auth_api.post(
        reverse("api:orders:list-create"), payload(product, delivery_payload), format="json"
    )
    assert response.status_code == 201, response.data
    body = response.data
    assert body["status"] == OrderStatus.PENDING
    assert Decimal(body["total_price"]) == Decimal("50000")
    assert body["invoice"]["number"].startswith("APTE-")
    assert Decimal(body["invoice"]["total_incl_tax"]) == Decimal("50000")
    assert body["invoice"]["items"][0]["product_name"] == product.name


def test_client_supplied_amounts_are_ignored(auth_api, product, delivery_payload):
    response = auth_api.post(
        reverse("api:orders:list-create"),
        payload(product, delivery_payload, total_price="1", items_total="1", discount_amount="99999"),
        format="json",
    )
    assert response.status_code == 201
    assert Decimal(response.data["total_price"]) == Decimal("50000")
    assert Decimal(response.data["discount_amount"]) == Decimal("0")


def test_order_without_items_is_refused(auth_api, delivery_payload):
    response = auth_api.post(
        reverse("api:orders:list-create"), {"items": [], **delivery_payload}, format="json"
    )
    assert response.status_code == 400


def test_order_without_delivery_details_is_refused(auth_api, product):
    response = auth_api.post(
        reverse("api:orders:list-create"),
        {"items": [{"product_id": product.id, "quantity": 1}]},
        format="json",
    )
    assert response.status_code == 400
    assert "delivery_name" in response.data.get("errors", response.data)


def test_wave_order_requires_a_phone(auth_api, product, delivery_payload):
    response = auth_api.post(
        reverse("api:orders:list-create"),
        payload(product, delivery_payload, payment_method="wave"),
        format="json",
    )
    assert response.status_code == 400


def test_insufficient_stock_returns_a_readable_error(auth_api, other_product, delivery_payload):
    response = auth_api.post(
        reverse("api:orders:list-create"),
        {"items": [{"product_id": other_product.id, "quantity": 99}], **delivery_payload},
        format="json",
    )
    assert response.status_code == 400
    assert response.data["code"] == "insufficient_stock"


# --------------------------------------------------------------- cloisonnement
def test_a_customer_only_sees_their_own_orders(api, user, other_user, product):
    make_order(user, product)
    make_order(other_user, product)

    api.force_authenticate(user=user)
    response = api.get(reverse("api:orders:list-create"))
    assert response.status_code == 200
    assert response.data["count"] == 1


def test_a_customer_cannot_read_someone_elses_order(api, user, other_user, product):
    foreign = make_order(other_user, product)
    api.force_authenticate(user=user)
    assert api.get(reverse("api:orders:detail", args=[foreign.pk])).status_code == 404


def test_a_customer_cannot_read_someone_elses_invoice(api, user, other_user, product):
    foreign = make_order(other_user, product)
    api.force_authenticate(user=user)
    assert api.get(reverse("api:orders:invoice", args=[foreign.pk])).status_code == 404


def test_staff_sees_every_order(api, staff_user, user, product):
    make_order(user, product)
    api.force_authenticate(user=staff_user)
    assert api.get(reverse("api:orders:list-create")).data["count"] == 1


# --------------------------------------------------------------------- facture
def test_invoice_endpoint_returns_the_accounting_breakdown(auth_api, user, product, settings):
    settings.BILLING_TAX_RATE = "0.18"
    order = make_order(user, product, quantity=4)
    response = auth_api.get(reverse("api:orders:invoice", args=[order.pk]))

    assert response.status_code == 200
    body = response.data
    assert Decimal(body["total_incl_tax"]) == Decimal("100000")
    assert Decimal(body["subtotal_excl_tax"]) + Decimal(body["tax_amount"]) == Decimal("100000")
    assert body["seller_snapshot"]["name"]


def test_printable_invoice_is_served_as_html(auth_api, user, product):
    order = make_order(user, product)
    response = auth_api.get(reverse("api:orders:invoice-print", args=[order.pk]))
    assert response.status_code == 200
    assert "text/html" in response["Content-Type"]
    assert order.invoice.number in response.content.decode()


# ------------------------------------------------------------------ annulation
def test_customer_can_cancel_a_pending_order(auth_api, user, product):
    order = make_order(user, product, quantity=3)
    response = auth_api.post(reverse("api:orders:cancel", args=[order.pk]))

    assert response.status_code == 200
    assert response.data["status"] == OrderStatus.CANCELED
    product.refresh_from_db()
    assert product.stock == 10


def test_customer_cannot_cancel_a_paid_order(auth_api, user, product):
    order = make_order(user, product)
    checkout.transition(order, OrderStatus.PAID)
    response = auth_api.post(reverse("api:orders:cancel", args=[order.pk]))
    assert response.status_code == 409


def test_customer_cannot_change_order_status(auth_api, user, product):
    order = make_order(user, product)
    response = auth_api.post(reverse("api:orders:status", args=[order.pk]), {"status": "paid"}, format="json")
    assert response.status_code == 403
    order.refresh_from_db()
    assert order.status == OrderStatus.PENDING


def test_staff_can_advance_the_order_status(api, staff_user, user, product):
    order = make_order(user, product)
    checkout.transition(order, OrderStatus.PAID)
    api.force_authenticate(user=staff_user)

    response = api.post(reverse("api:orders:status", args=[order.pk]), {"status": "shipped"}, format="json")
    assert response.status_code == 200
    assert response.data["status"] == OrderStatus.SHIPPED


def test_staff_cannot_force_an_illegal_transition(api, staff_user, user, product):
    order = make_order(user, product)
    checkout.transition(order, OrderStatus.CANCELED)
    api.force_authenticate(user=staff_user)

    response = api.post(reverse("api:orders:status", args=[order.pk]), {"status": "paid"}, format="json")
    assert response.status_code == 409
