"""Tests du panier : unicité des lignes, plafonnement au stock, cloisonnement."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.urls import reverse

from apps.cart.models import Cart, CartItem
from apps.cart.services import merge_anonymous_cart

pytestmark = pytest.mark.django_db


def add(api, product, quantity=1):
    return api.post(reverse("api:cart:add"), {"product_id": product.id, "quantity": quantity}, format="json")


# ------------------------------------------------------------------ anonyme
def test_anonymous_visitor_gets_a_cart(api, product):
    response = add(api, product, 2)
    assert response.status_code == 201
    assert response.data["count"] == 2
    assert Decimal(response.data["total"]) == Decimal("50000")


def test_adding_the_same_product_twice_keeps_a_single_line(api, product):
    add(api, product, 2)
    response = add(api, product, 3)
    assert len(response.data["items"]) == 1
    assert response.data["items"][0]["quantity"] == 5


def test_cart_total_is_computed_server_side(api, product, other_product):
    add(api, product, 2)
    response = add(api, other_product, 1)
    assert Decimal(response.data["total"]) == Decimal("65500")
    assert response.data["total_display"].endswith("FCFA")


def test_quantity_beyond_stock_is_refused(api, other_product):
    response = add(api, other_product, 99)
    assert response.status_code == 409
    assert response.data["code"] == "insufficient_stock"


def test_cumulated_quantity_beyond_stock_is_refused(api, other_product):
    assert add(api, other_product, 3).status_code == 201
    assert add(api, other_product, 3).status_code == 409


@pytest.mark.parametrize("quantity", [0, -1, "beaucoup"])
def test_invalid_quantity_is_refused(api, product, quantity):
    assert add(api, product, quantity).status_code == 400


def test_inactive_product_cannot_be_added(api, product):
    product.is_active = False
    product.save()
    assert add(api, product).status_code == 404


def test_updating_a_line(api, product):
    add(api, product, 2)
    response = api.patch(reverse("api:cart:item", args=[product.id]), {"quantity": 5}, format="json")
    assert response.status_code == 200
    assert response.data["items"][0]["quantity"] == 5


def test_updating_to_zero_removes_the_line(api, product):
    add(api, product, 2)
    response = api.patch(reverse("api:cart:item", args=[product.id]), {"quantity": 0}, format="json")
    assert response.status_code == 200
    assert response.data["items"] == []


def test_removing_a_line(api, product):
    add(api, product, 1)
    response = api.delete(reverse("api:cart:item", args=[product.id]))
    assert response.status_code == 200
    assert response.data["items"] == []


def test_removing_an_absent_line_is_a_404(api, product):
    api.get(reverse("api:cart:detail"))
    assert api.delete(reverse("api:cart:item", args=[product.id])).status_code == 404


def test_clearing_the_cart(api, product, other_product):
    add(api, product, 1)
    add(api, other_product, 1)
    response = api.delete(reverse("api:cart:clear"))
    assert response.status_code == 200
    assert response.data["count"] == 0


# ------------------------------------------------------------- cloisonnement
def test_a_visitor_cannot_touch_another_cart(api, user, other_user, product):
    """Les lignes sont désignées par produit : il n'y a pas d'id à deviner."""
    foreign_cart = Cart.objects.create(user=other_user)
    CartItem.objects.create(cart=foreign_cart, product=product, quantity=3)

    api.force_authenticate(user=user)
    assert api.delete(reverse("api:cart:item", args=[product.id])).status_code == 404
    assert CartItem.objects.filter(cart=foreign_cart).exists()


def test_each_user_has_their_own_cart(api, user, other_user, product):
    api.force_authenticate(user=user)
    add(api, product, 2)

    api.force_authenticate(user=other_user)
    response = api.get(reverse("api:cart:detail"))
    assert response.data["count"] == 0


# ---------------------------------------------------------------- fusion
def test_merging_an_anonymous_cart_into_the_account(user, product, other_product):
    anonymous = Cart.objects.create(session_key="session-abc")
    CartItem.objects.create(cart=anonymous, product=product, quantity=2)
    CartItem.objects.create(cart=anonymous, product=other_product, quantity=1)

    account = Cart.objects.create(user=user)
    CartItem.objects.create(cart=account, product=product, quantity=1)

    merged = merge_anonymous_cart(user=user, session_key="session-abc")

    assert merged.pk == account.pk
    assert merged.items.count() == 2
    assert merged.items.get(product=product).quantity == 3
    assert not Cart.objects.filter(session_key="session-abc").exists()


def test_merging_caps_quantities_at_available_stock(user, other_product):
    anonymous = Cart.objects.create(session_key="session-xyz")
    CartItem.objects.create(cart=anonymous, product=other_product, quantity=3)
    account = Cart.objects.create(user=user)
    CartItem.objects.create(cart=account, product=other_product, quantity=3)

    merged = merge_anonymous_cart(user=user, session_key="session-xyz")
    assert merged.items.get(product=other_product).quantity == other_product.stock


def test_merging_skips_products_gone_out_of_stock(user, product):
    anonymous = Cart.objects.create(session_key="session-oos")
    CartItem.objects.create(cart=anonymous, product=product, quantity=1)
    product.stock = 0
    product.save()

    merged = merge_anonymous_cart(user=user, session_key="session-oos")
    assert merged.items.count() == 0


def test_merge_endpoint_requires_authentication(api):
    assert api.post(reverse("api:cart:merge")).status_code == 401
