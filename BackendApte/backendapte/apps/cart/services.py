"""Cas d'usage du panier.

Le panier se manipule par produit (et non par identifiant de ligne) : le client
connaît le produit qu'il ajoute, pas la clé technique de la ligne, et cela
supprime toute possibilité de toucher la ligne d'un autre panier.
"""

from __future__ import annotations

import logging

from django.db import transaction

from apps.common.exceptions import ConflictError, NotFoundError
from apps.common.validators import validate_positive_quantity
from apps.products.models import Product

from .models import Cart, CartItem

logger = logging.getLogger(__name__)

MAX_QUANTITY_PER_LINE = 1000


def get_or_create_cart(request) -> Cart:
    """Résout le panier de la requête : compte connecté ou session anonyme."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    if not request.session.session_key:
        request.session.create()
    cart, _ = Cart.objects.get_or_create(session_key=request.session.session_key)
    return cart


def _resolve_quantity(raw_quantity, product: Product) -> int:
    quantity = validate_positive_quantity(raw_quantity)
    if quantity > MAX_QUANTITY_PER_LINE:
        raise ConflictError(
            f"Quantité maximale par article : {MAX_QUANTITY_PER_LINE}.", code="quantity_too_high"
        )
    if not product.has_stock_for(quantity):
        raise ConflictError(
            f"Stock insuffisant pour « {product.name} » ({product.stock} disponible(s)).",
            code="insufficient_stock",
        )
    return quantity


@transaction.atomic
def add_item(cart: Cart, *, product_id: int, quantity=1) -> Cart:
    """Ajoute un produit (ou cumule la quantité si la ligne existe déjà)."""
    product = Product.objects.active().filter(pk=product_id).first()
    if product is None:
        raise NotFoundError("Produit introuvable ou indisponible.", code="product_not_found")

    quantity = validate_positive_quantity(quantity)
    item = CartItem.objects.select_for_update().filter(cart=cart, product=product).first()
    target = (item.quantity if item else 0) + quantity
    target = _resolve_quantity(target, product)

    if item is None:
        CartItem.objects.create(cart=cart, product=product, quantity=target)
    else:
        item.quantity = target
        item.save(update_fields=["quantity"])

    cart.save(update_fields=["updated_at"])
    return cart


@transaction.atomic
def set_quantity(cart: Cart, *, product_id: int, quantity: int) -> Cart:
    """Fixe la quantité d'une ligne ; 0 retire la ligne."""
    quantity = int(quantity)
    if quantity <= 0:
        return remove_item(cart, product_id=product_id)

    item = (
        CartItem.objects.select_for_update()
        .select_related("product")
        .filter(cart=cart, product_id=product_id)
        .first()
    )
    if item is None:
        raise NotFoundError("Cet article n'est pas dans votre panier.", code="item_not_found")

    item.quantity = _resolve_quantity(quantity, item.product)
    item.save(update_fields=["quantity"])
    cart.save(update_fields=["updated_at"])
    return cart


@transaction.atomic
def remove_item(cart: Cart, *, product_id: int) -> Cart:
    deleted, _ = CartItem.objects.filter(cart=cart, product_id=product_id).delete()
    if not deleted:
        raise NotFoundError("Cet article n'est pas dans votre panier.", code="item_not_found")
    cart.save(update_fields=["updated_at"])
    return cart


@transaction.atomic
def clear(cart: Cart) -> Cart:
    cart.items.all().delete()
    cart.save(update_fields=["updated_at"])
    return cart


@transaction.atomic
def merge_anonymous_cart(*, user, session_key: str | None) -> Cart:
    """Fusionne le panier de session dans celui du compte à la connexion.

    Les quantités s'additionnent puis sont plafonnées au stock disponible, et le
    panier anonyme est supprimé pour ne pas ressurgir à la session suivante.
    """
    target, _ = Cart.objects.get_or_create(user=user)
    if not session_key:
        return target

    source = Cart.objects.filter(session_key=session_key).prefetch_related("items__product").first()
    if source is None or source.pk == target.pk:
        return target

    for item in source.items.all():
        if item.product.stock < 1 or not item.product.is_active:
            # Un article devenu indisponible entre-temps n'est pas reporté.
            continue
        existing = CartItem.objects.filter(cart=target, product=item.product).first()
        wanted = (existing.quantity if existing else 0) + item.quantity
        capped = min(wanted, item.product.stock)
        if existing is None:
            CartItem.objects.create(cart=target, product=item.product, quantity=capped)
        else:
            existing.quantity = capped
            existing.save(update_fields=["quantity"])

    source.delete()
    logger.info("Panier anonyme fusionné dans le panier de l'utilisateur #%s", user.pk)
    return target
