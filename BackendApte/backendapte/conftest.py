"""Fixtures partagées par la suite de tests."""

from __future__ import annotations

from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.products.models import Category, Product

User = get_user_model()


@pytest.fixture
def api() -> APIClient:
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="client@apte.test", phone="770000001", password="Motdepasse!2024", full_name="Awa Diop"
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="autre@apte.test", phone="770000002", password="Motdepasse!2024")


@pytest.fixture
def staff_user(db):
    return User.objects.create_superuser(
        email="admin@apte.test", phone="770000003", password="Motdepasse!2024"
    )


@pytest.fixture
def auth_api(api, user) -> APIClient:
    api.force_authenticate(user=user)
    return api


@pytest.fixture
def category(db):
    return Category.objects.create(name="Vidéosurveillance", slug="videosurveillance")


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name="Caméra WiFi intérieure",
        slug="camera-wifi",
        price=Decimal("25000"),
        stock=10,
        category=category,
    )


@pytest.fixture
def other_product(db, category):
    return Product.objects.create(
        name="Détecteur de mouvement",
        slug="detecteur-mouvement",
        price=Decimal("15500"),
        stock=4,
        category=category,
    )


@pytest.fixture
def delivery_payload() -> dict:
    return {
        "delivery_name": "Awa Diop",
        "delivery_phone": "77 123 45 67",
        "delivery_address": "12 rue de Thiong",
        "delivery_city": "Dakar",
        "delivery_notes": "Sonner au 2e étage",
    }
