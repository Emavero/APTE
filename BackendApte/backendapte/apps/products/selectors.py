"""Lectures du catalogue : un seul endroit pour les requêtes réutilisées."""

from __future__ import annotations

from .models import Product


def active_products():
    """Produits publiés, catégorie préchargée (évite les requêtes N+1)."""
    return Product.objects.active().with_category()


def all_products_for_staff():
    return Product.objects.with_category()


def get_product(product_id: int) -> Product | None:
    return Product.objects.with_category().filter(pk=product_id).first()
