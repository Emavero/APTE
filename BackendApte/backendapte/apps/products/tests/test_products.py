"""Tests du catalogue : lecture publique, écriture réservée au personnel."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.urls import reverse

from apps.products.models import Product

pytestmark = pytest.mark.django_db


def test_catalogue_is_public(api, product):
    response = api.get(reverse("api:products:list"))
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert Decimal(response.data["results"][0]["price"]) == Decimal("25000")


def test_unpublished_products_are_hidden_from_visitors(api, product):
    product.is_active = False
    product.save()
    assert api.get(reverse("api:products:list")).data["count"] == 0


def test_staff_sees_unpublished_products(api, staff_user, product):
    product.is_active = False
    product.save()
    api.force_authenticate(user=staff_user)
    assert api.get(reverse("api:products:list")).data["count"] == 1


def test_a_logged_in_customer_cannot_create_a_product(auth_api, category):
    response = auth_api.post(
        reverse("api:products:list"),
        {"name": "Faux produit", "price": "1", "stock": 1, "category_id": category.id},
        format="json",
    )
    assert response.status_code == 403
    assert not Product.objects.filter(name="Faux produit").exists()


def test_a_logged_in_customer_cannot_delete_a_product(auth_api, product):
    assert auth_api.delete(reverse("api:products:detail", args=[product.id])).status_code == 403
    assert Product.objects.filter(pk=product.pk).exists()


def test_a_logged_in_customer_cannot_change_a_price(auth_api, product):
    response = auth_api.patch(
        reverse("api:products:detail", args=[product.id]), {"price": "1"}, format="json"
    )
    assert response.status_code == 403
    product.refresh_from_db()
    assert product.price == Decimal("25000")


def test_staff_can_create_a_product_and_the_slug_is_derived(api, staff_user, category):
    api.force_authenticate(user=staff_user)
    response = api.post(
        reverse("api:products:list"),
        {"name": "Sirène extérieure", "price": "45000", "stock": 5, "category_id": category.id},
        format="json",
    )
    assert response.status_code == 201, response.data
    assert response.data["slug"] == "sirene-exterieure"


def test_search_filters_the_catalogue(api, product, other_product):
    response = api.get(reverse("api:products:list"), {"search": "Caméra"})
    assert response.data["count"] == 1


def test_category_filter(api, product, other_product, category):
    response = api.get(reverse("api:products:list"), {"category": category.id})
    assert response.data["count"] == 2


def test_categories_are_public(api, category):
    response = api.get(reverse("api:products:categories"))
    assert response.status_code == 200
    assert response.data[0]["slug"] == "videosurveillance"
