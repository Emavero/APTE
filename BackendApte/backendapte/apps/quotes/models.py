"""Demandes de devis (estimation chiffrée avant commande)."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.common.money import money

User = settings.AUTH_USER_MODEL


class QuoteStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    APPROVED = "approved", "Approuvé"
    REJECTED = "rejected", "Rejeté"
    COMPLETED = "completed", "Complété"


class QuoteQuerySet(models.QuerySet):
    def with_items(self):
        return self.select_related("user").prefetch_related("items", "items__product")

    def for_user(self, user):
        return self.filter(user=user)


class Quote(TimeStampedModel):
    """Estimation demandée par un visiteur ou un client."""

    reference = models.CharField("référence", max_length=32, unique=True, editable=False, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="quotes")
    status = models.CharField(
        "statut", max_length=20, choices=QuoteStatus.choices, default=QuoteStatus.PENDING, db_index=True
    )

    contact_name = models.CharField("nom du contact", max_length=255, blank=True, default="")
    contact_email = models.EmailField("e-mail du contact", blank=True, default="")
    contact_phone = models.CharField("téléphone du contact", max_length=15, blank=True, default="")

    description = models.TextField("systèmes sélectionnés", blank=True, default="")
    message = models.TextField("détails de la demande", blank=True, default="")

    rooms = models.PositiveIntegerField("pièces", default=0)
    entries = models.PositiveIntegerField("entrées", default=0)
    windows = models.PositiveIntegerField("fenêtres", default=0)

    currency = models.CharField("devise", max_length=3, default="XOF")
    total_estimate = models.DecimalField(
        "estimation",
        max_digits=15,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )

    objects = QuoteQuerySet.as_manager()

    class Meta:
        verbose_name = "devis"
        verbose_name_plural = "devis"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.reference or f'Devis #{self.pk}'}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.reference:
            # La référence dérive de la clé primaire : elle n'est connue qu'après
            # la première écriture.
            self.reference = f"DEV-{self.created_at:%Y}-{self.pk:05d}"
            super().save(update_fields=["reference"])

    def compute_total(self) -> Decimal:
        return money(sum((item.line_total for item in self.items.all()), Decimal("0")))


class QuoteItem(models.Model):
    """Ligne de devis : photographie du produit proposé."""

    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.PROTECT, related_name="quote_items")
    product_name = models.CharField("désignation", max_length=255, blank=True, default="")
    unit_price = models.DecimalField("prix unitaire", max_digits=12, decimal_places=2, default=Decimal("0"))
    quantity = models.PositiveIntegerField("quantité", default=1, validators=[MinValueValidator(1)])
    line_total = models.DecimalField("total ligne", max_digits=15, decimal_places=2, default=Decimal("0"))

    class Meta:
        verbose_name = "ligne de devis"
        verbose_name_plural = "lignes de devis"
        constraints = [
            models.UniqueConstraint(fields=["quote", "product"], name="unique_product_per_quote"),
        ]

    def __str__(self) -> str:
        return f"{self.product_name or self.product_id} x {self.quantity}"

    def save(self, *args, **kwargs):
        if self.product_id and not self.product_name:
            self.product_name = self.product.name
        if self.product_id and not self.unit_price:
            self.unit_price = money(self.product.price)
        self.line_total = money(self.unit_price * self.quantity)
        super().save(*args, **kwargs)

    @property
    def subtotal(self) -> Decimal:
        return self.line_total
