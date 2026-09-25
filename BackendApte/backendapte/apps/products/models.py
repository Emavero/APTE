"""Catalogue produits."""

from __future__ import annotations

from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel


class Category(models.Model):
    name = models.CharField("nom", max_length=100, unique=True)
    slug = models.SlugField("identifiant", unique=True, blank=True)

    class Meta:
        verbose_name = "catégorie"
        verbose_name_plural = "catégories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:50]
        super().save(*args, **kwargs)


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def in_stock(self):
        return self.filter(stock__gt=0)

    def with_category(self):
        return self.select_related("category")


class Product(TimeStampedModel):
    """Article du catalogue. ``price`` est un prix de vente TTC en devise locale."""

    name = models.CharField("nom", max_length=255)
    slug = models.SlugField("identifiant", unique=True, blank=True, max_length=255)
    description = models.TextField("description", blank=True, default="")

    price = models.DecimalField(
        "prix",
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    stock = models.PositiveIntegerField("stock", default=0)

    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.PROTECT, verbose_name="catégorie"
    )
    image = models.ImageField("image", upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField("actif", default=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        verbose_name = "produit"
        verbose_name_plural = "produits"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active", "-created_at"]),
            models.Index(fields=["category", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:255]
        super().save(*args, **kwargs)

    @property
    def is_available(self) -> bool:
        return self.is_active and self.stock > 0

    def has_stock_for(self, quantity: int) -> bool:
        return self.stock >= int(quantity)
