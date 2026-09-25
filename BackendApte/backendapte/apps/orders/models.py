"""Entités de commande, de facturation et de paiement.

Règles structurantes :

* Une ligne de commande **photographie** le produit au moment de l'achat
  (désignation + prix unitaire). Une hausse de tarif ne doit jamais réécrire une
  commande passée, ni une facture émise.
* Tous les montants sont des ``Decimal`` quantifiés via ``apps.common.money``.
* La facture est immuable une fois émise : elle porte sa propre numérotation
  séquentielle et ses propres totaux HT / TVA / TTC.
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel
from apps.common.money import money

User = settings.AUTH_USER_MODEL


class OrderStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    AWAITING_PAYMENT = "awaiting_payment", "Paiement en cours"
    PAID = "paid", "Payée"
    SHIPPED = "shipped", "Expédiée"
    COMPLETED = "completed", "Terminée"
    CANCELED = "canceled", "Annulée"
    REFUNDED = "refunded", "Remboursée"


class PaymentMethod(models.TextChoices):
    CASH = "cash", "Espèces à la livraison"
    WAVE = "wave", "Wave"


#: Transitions autorisées. Toute autre transition est refusée par le domaine :
#: c'est ce qui empêche, par exemple, de « repayer » une commande annulée.
ORDER_TRANSITIONS: dict[str, tuple[str, ...]] = {
    OrderStatus.PENDING: (OrderStatus.AWAITING_PAYMENT, OrderStatus.PAID, OrderStatus.CANCELED),
    OrderStatus.AWAITING_PAYMENT: (OrderStatus.PAID, OrderStatus.CANCELED),
    OrderStatus.PAID: (OrderStatus.SHIPPED, OrderStatus.COMPLETED, OrderStatus.REFUNDED),
    OrderStatus.SHIPPED: (OrderStatus.COMPLETED, OrderStatus.REFUNDED),
    OrderStatus.COMPLETED: (OrderStatus.REFUNDED,),
    OrderStatus.CANCELED: (),
    OrderStatus.REFUNDED: (),
}

#: États pour lesquels le stock a été retiré et doit être rendu en cas d'annulation.
STOCK_RESERVED_STATUSES = frozenset(
    {
        OrderStatus.PENDING,
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.PAID,
        OrderStatus.SHIPPED,
        OrderStatus.COMPLETED,
    }
)


class OrderQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(user=user)

    def with_details(self):
        return self.select_related("invoice", "user").prefetch_related("items", "items__product", "payments")

    def paid(self):
        return self.filter(status=OrderStatus.PAID)


class Order(TimeStampedModel):
    """Commande client : totaux calculés côté serveur, jamais reçus du client."""

    user = models.ForeignKey(User, related_name="orders", on_delete=models.PROTECT, verbose_name="client")
    status = models.CharField(
        "statut", max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True
    )
    payment_method = models.CharField(
        "mode de paiement", max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH
    )
    phone_number = models.CharField(
        "numéro de paiement", max_length=15, blank=True, default="", help_text="Numéro Wave"
    )

    # Adresse de livraison : figée à la commande (le client peut changer de profil).
    delivery_name = models.CharField("nom du destinataire", max_length=255)
    delivery_phone = models.CharField("téléphone de livraison", max_length=15)
    delivery_address = models.CharField("adresse", max_length=255)
    delivery_city = models.CharField("ville", max_length=100)
    delivery_notes = models.TextField("instructions", blank=True, default="")

    currency = models.CharField("devise", max_length=3, default="XOF")
    items_total = models.DecimalField(
        "total des articles", max_digits=14, decimal_places=2, default=Decimal("0")
    )
    shipping_amount = models.DecimalField(
        "frais de livraison", max_digits=14, decimal_places=2, default=Decimal("0")
    )
    discount_amount = models.DecimalField("remise", max_digits=14, decimal_places=2, default=Decimal("0"))
    total_price = models.DecimalField(
        "total à payer",
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
        validators=[MinValueValidator(Decimal("0"))],
    )

    paid_at = models.DateTimeField("payée le", null=True, blank=True)
    canceled_at = models.DateTimeField("annulée le", null=True, blank=True)

    objects = OrderQuerySet.as_manager()

    class Meta:
        verbose_name = "commande"
        verbose_name_plural = "commandes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Commande #{self.pk} — {self.user} — {self.get_status_display()}"

    # ------------------------------------------------------------------ calculs
    def compute_items_total(self) -> Decimal:
        """Recalcule le total des lignes depuis la base (source de vérité)."""
        return money(sum((item.line_total for item in self.items.all()), Decimal("0")))

    def compute_total(self) -> Decimal:
        return money(self.items_total + self.shipping_amount - self.discount_amount)

    # ------------------------------------------------------------------ états
    def can_transition_to(self, new_status: str) -> bool:
        if new_status == self.status:
            return True
        return new_status in ORDER_TRANSITIONS.get(self.status, ())

    @property
    def is_editable(self) -> bool:
        return self.status in {OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT}

    @property
    def holds_stock(self) -> bool:
        return self.status in STOCK_RESERVED_STATUSES

    @property
    def is_settled(self) -> bool:
        return self.status in {OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.COMPLETED}


class OrderItem(models.Model):
    """Ligne de commande : photographie du produit acheté."""

    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", related_name="order_items", on_delete=models.PROTECT)
    product_name = models.CharField("désignation", max_length=255)
    unit_price = models.DecimalField("prix unitaire", max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField("quantité", default=1, validators=[MinValueValidator(1)])
    line_total = models.DecimalField("total ligne", max_digits=14, decimal_places=2)

    class Meta:
        verbose_name = "ligne de commande"
        verbose_name_plural = "lignes de commande"
        constraints = [
            models.UniqueConstraint(fields=["order", "product"], name="unique_product_per_order"),
        ]

    def __str__(self) -> str:
        return f"{self.product_name} x {self.quantity}"

    @property
    def subtotal(self) -> Decimal:
        """Alias de lecture conservé pour l'API publique."""
        return self.line_total


class InvoiceStatus(models.TextChoices):
    ISSUED = "issued", "Émise"
    PAID = "paid", "Payée"
    CANCELED = "canceled", "Annulée"


class InvoiceSequence(models.Model):
    """Compteur de numérotation séquentielle, une ligne par année.

    Le numéro de facture doit être **continu et sans trou** : il est alloué par
    ``SELECT ... FOR UPDATE`` sur cette ligne, ce qui sérialise les demandes
    concurrentes au lieu de laisser deux commandes tirer le même numéro.
    """

    year = models.PositiveIntegerField("année", unique=True)
    last_value = models.PositiveIntegerField("dernier numéro attribué", default=0)

    class Meta:
        verbose_name = "séquence de facturation"
        verbose_name_plural = "séquences de facturation"

    def __str__(self) -> str:
        return f"{self.year}: {self.last_value}"


class Invoice(TimeStampedModel):
    """Facture d'une commande : pièce comptable immuable après émission."""

    order = models.OneToOneField(Order, related_name="invoice", on_delete=models.PROTECT)
    number = models.CharField("numéro", max_length=32, unique=True, editable=False)
    status = models.CharField(
        "statut", max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.ISSUED
    )

    issued_at = models.DateTimeField("émise le", default=timezone.now)
    due_at = models.DateTimeField("échéance", null=True, blank=True)
    paid_at = models.DateTimeField("réglée le", null=True, blank=True)

    currency = models.CharField("devise", max_length=3, default="XOF")
    subtotal_excl_tax = models.DecimalField("total HT", max_digits=14, decimal_places=2)
    tax_rate = models.DecimalField("taux de TVA", max_digits=5, decimal_places=4, default=Decimal("0"))
    tax_amount = models.DecimalField("montant TVA", max_digits=14, decimal_places=2)
    shipping_amount = models.DecimalField(
        "frais de livraison", max_digits=14, decimal_places=2, default=Decimal("0")
    )
    discount_amount = models.DecimalField("remise", max_digits=14, decimal_places=2, default=Decimal("0"))
    total_incl_tax = models.DecimalField("total TTC", max_digits=14, decimal_places=2)

    # Le client peut modifier son profil : la facture conserve son état d'origine.
    customer_name = models.CharField("client", max_length=255)
    customer_email = models.EmailField("e-mail", blank=True, default="")
    customer_phone = models.CharField("téléphone", max_length=15, blank=True, default="")
    billing_address = models.CharField("adresse de facturation", max_length=255, blank=True, default="")
    billing_city = models.CharField("ville", max_length=100, blank=True, default="")

    seller_snapshot = models.JSONField("émetteur", default=dict, blank=True)

    class Meta:
        verbose_name = "facture"
        verbose_name_plural = "factures"
        ordering = ["-issued_at", "-id"]
        indexes = [models.Index(fields=["status", "-issued_at"])]

    def __str__(self) -> str:
        return self.number

    @property
    def is_balanced(self) -> bool:
        """Contrôle comptable : HT + TVA + port − remise == TTC."""
        expected = money(
            self.subtotal_excl_tax + self.tax_amount + self.shipping_amount - self.discount_amount
        )
        return expected == money(self.total_incl_tax)


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    SUCCEEDED = "succeeded", "Réussi"
    FAILED = "failed", "Échoué"
    CANCELED = "canceled", "Annulé"
    REFUNDED = "refunded", "Remboursé"


class Payment(TimeStampedModel):
    """Trace d'une tentative de paiement (piste d'audit du encaissement)."""

    order = models.ForeignKey(Order, related_name="payments", on_delete=models.PROTECT)
    provider = models.CharField("prestataire", max_length=32, default=PaymentMethod.WAVE)
    provider_reference = models.CharField(
        "référence prestataire", max_length=255, blank=True, default="", db_index=True
    )
    idempotency_key = models.CharField("clé d'idempotence", max_length=64, unique=True)
    status = models.CharField(
        "statut", max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    amount = models.DecimalField("montant", max_digits=14, decimal_places=2)
    currency = models.CharField("devise", max_length=3, default="XOF")
    checkout_url = models.URLField("URL de paiement", blank=True, default="")
    failure_reason = models.CharField("motif d'échec", max_length=255, blank=True, default="")
    # Charge utile brute du prestataire : indispensable pour un rapprochement
    # comptable ou une réclamation ultérieure.
    provider_payload = models.JSONField("réponse prestataire", default=dict, blank=True)
    settled_at = models.DateTimeField("réglé le", null=True, blank=True)

    class Meta:
        verbose_name = "paiement"
        verbose_name_plural = "paiements"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_reference"],
                condition=~models.Q(provider_reference=""),
                name="unique_provider_reference",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.provider} {self.provider_reference or self.idempotency_key} ({self.status})"
