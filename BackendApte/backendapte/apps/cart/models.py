"""Panier d'achat, pour visiteur anonyme comme pour client connecté.

Un seul modèle ``Cart`` porte les deux cas : soit un ``user``, soit une
``session_key``. Deux modèles distincts (l'ancienne structure) obligeaient à
dupliquer toute la logique et laissaient les contraintes d'unicité inopérantes.
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.money import money

User = settings.AUTH_USER_MODEL


class CartQuerySet(models.QuerySet):
    def with_items(self):
        return self.prefetch_related("items", "items__product", "items__product__category")


class Cart(TimeStampedModel):
    """Panier rattaché à un compte *ou* à une session anonyme."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart", null=True, blank=True)
    # NULL (et non chaîne vide) est ici délibéré : c'est ce qui permet à la
    # contrainte d'unicité partielle et au XOR ci-dessous de fonctionner.
    session_key = models.CharField(  # noqa: DJ001
        "clé de session", max_length=64, null=True, blank=True, db_index=True
    )

    objects = CartQuerySet.as_manager()

    class Meta:
        verbose_name = "panier"
        verbose_name_plural = "paniers"
        constraints = [
            # Un panier appartient à un compte ou à une session, jamais aux deux
            # ni à aucun des deux : sans cette garde, des paniers orphelins
            # s'accumulent et deviennent inatteignables.
            models.CheckConstraint(
                condition=(
                    models.Q(user__isnull=False, session_key__isnull=True)
                    | models.Q(user__isnull=True, session_key__isnull=False)
                ),
                name="cart_owned_by_user_xor_session",
            ),
            models.UniqueConstraint(
                fields=["session_key"],
                condition=models.Q(session_key__isnull=False),
                name="unique_cart_per_session",
            ),
        ]

    def __str__(self) -> str:
        if self.user_id:
            return f"Panier de {self.user}"
        return f"Panier anonyme ({(self.session_key or '')[:12]}…)"

    @property
    def is_anonymous(self) -> bool:
        return self.user_id is None

    def total(self) -> Decimal:
        """Total du panier, recalculé depuis les prix catalogue courants."""
        return money(sum((item.subtotal for item in self.items.all()), Decimal("0")))

    def count(self) -> int:
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """Ligne de panier. Le prix n'est pas figé : il suit le catalogue."""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveIntegerField("quantité", default=1, validators=[MinValueValidator(1)])
    added_at = models.DateTimeField("ajouté le", auto_now_add=True)

    class Meta:
        verbose_name = "ligne de panier"
        verbose_name_plural = "lignes de panier"
        ordering = ["added_at"]
        constraints = [
            # Une seule ligne par produit : c'est ce que l'ancien
            # ``unique_together`` incluant des colonnes NULL n'imposait pas
            # (en SQL, NULL != NULL), d'où des doublons dans le panier.
            models.UniqueConstraint(fields=["cart", "product"], name="unique_product_per_cart"),
        ]

    def __str__(self) -> str:
        return f"{self.product.name} x {self.quantity}"

    @property
    def unit_price(self) -> Decimal:
        return money(self.product.price)

    @property
    def subtotal(self) -> Decimal:
        return money(self.unit_price * self.quantity)
