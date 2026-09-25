"""Tests des devis : estimation serveur, cloisonnement, sérialisation."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.urls import reverse

from apps.quotes.models import Quote
from apps.quotes.services import create_quote

pytestmark = pytest.mark.django_db


def test_an_anonymous_visitor_can_request_a_quote(api, product, other_product):
    response = api.post(
        reverse("api:quotes:list-create"),
        {
            "description": "Alarme + vidéosurveillance",
            "message": "Maison de 4 pièces",
            "rooms": 4,
            "entries": 2,
            "windows": 6,
            "contact_name": "Fatou Sow",
            "contact_phone": "77 111 22 33",
            "items_write": [
                {"product": product.id, "quantity": 2},
                {"product": other_product.id, "quantity": 1},
            ],
        },
        format="json",
    )
    assert response.status_code == 201, response.data
    assert Decimal(response.data["total_estimate"]) == Decimal("65500")
    assert response.data["reference"].startswith("DEV-")
    assert len(response.data["items"]) == 2


def test_estimate_is_computed_from_the_catalogue(api, product):
    response = api.post(
        reverse("api:quotes:list-create"),
        {
            "description": "Devis",
            "total_estimate": "1",
            "items_write": [{"product": product.id, "quantity": 3}],
        },
        format="json",
    )
    assert Decimal(response.data["total_estimate"]) == Decimal("75000")


def test_quote_lines_snapshot_the_product(api, product):
    quote = create_quote(items=[{"product": product.id, "quantity": 2}], description="x")
    item = quote.items.get()
    assert item.product_name == product.name
    assert item.unit_price == Decimal("25000")
    assert item.line_total == Decimal("50000")


def test_a_quote_with_unknown_product_is_refused(api):
    response = api.post(
        reverse("api:quotes:list-create"),
        {"description": "x", "items_write": [{"product": 999999, "quantity": 1}]},
        format="json",
    )
    assert response.status_code == 400
    assert response.data["code"] == "unknown_product"


def test_an_empty_quote_is_refused(api):
    assert api.post(reverse("api:quotes:list-create"), {}, format="json").status_code == 400


def test_a_quote_without_items_but_with_a_message_is_accepted(api):
    response = api.post(reverse("api:quotes:list-create"), {"message": "Rappelez-moi"}, format="json")
    assert response.status_code == 201
    assert Decimal(response.data["total_estimate"]) == Decimal("0")


def test_duplicate_lines_are_consolidated(api, product):
    response = api.post(
        reverse("api:quotes:list-create"),
        {
            "description": "x",
            "items_write": [
                {"product": product.id, "quantity": 1},
                {"product": product.id, "quantity": 2},
            ],
        },
        format="json",
    )
    assert response.status_code == 201
    assert len(response.data["items"]) == 1
    assert response.data["items"][0]["quantity"] == 3


def test_an_authenticated_quote_serialises_the_user_name(auth_api, user, product):
    """L'ancien sérialiseur lisait ``user.username``, champ absent du modèle."""
    response = auth_api.post(
        reverse("api:quotes:list-create"),
        {"description": "x", "items_write": [{"product": product.id, "quantity": 1}]},
        format="json",
    )
    assert response.status_code == 201, response.data
    assert response.data["user_name"] == user.full_name

    listing = auth_api.get(reverse("api:quotes:list-create"))
    assert listing.status_code == 200
    assert listing.data["results"][0]["user_name"] == user.full_name


def test_an_anonymous_visitor_cannot_list_quotes(api, product):
    api.post(
        reverse("api:quotes:list-create"),
        {"description": "x", "items_write": [{"product": product.id, "quantity": 1}]},
        format="json",
    )
    assert api.get(reverse("api:quotes:list-create")).data["count"] == 0


def test_a_customer_only_sees_their_own_quotes(api, user, other_user, product):
    create_quote(user=other_user, items=[{"product": product.id, "quantity": 1}], description="x")
    create_quote(user=user, items=[{"product": product.id, "quantity": 1}], description="y")

    api.force_authenticate(user=user)
    assert api.get(reverse("api:quotes:list-create")).data["count"] == 1


def test_staff_sees_every_quote(api, staff_user, user, product):
    create_quote(user=user, items=[{"product": product.id, "quantity": 1}], description="x")
    api.force_authenticate(user=staff_user)
    assert api.get(reverse("api:quotes:list-create")).data["count"] == 1


def test_only_staff_can_change_a_quote_status(api, user, staff_user, product):
    quote = create_quote(user=user, items=[{"product": product.id, "quantity": 1}], description="x")

    api.force_authenticate(user=user)
    assert (
        api.post(
            reverse("api:quotes:status", args=[quote.pk]), {"status": "approved"}, format="json"
        ).status_code
        == 403
    )

    api.force_authenticate(user=staff_user)
    response = api.post(reverse("api:quotes:status", args=[quote.pk]), {"status": "approved"}, format="json")
    assert response.status_code == 200
    assert Quote.objects.get(pk=quote.pk).status == "approved"
