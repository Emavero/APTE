from django.db import models
from django.conf import settings
from apps.products.models import Product

User = settings.AUTH_USER_MODEL


class Quote(models.Model):
    """
    Demande de devis par un utilisateur.
    """
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("sent", "Envoyé"),
        ("accepted", "Accepté"),
        ("rejected", "Rejeté"),
    ]

    user = models.ForeignKey(User, related_name="quotes", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    description = models.TextField(default="")

    total_estimate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Devis #{self.id} - {self.user} - {self.status}"


class QuoteItem(models.Model):
    """
    Produits demandés dans un devis.
    """
    quote = models.ForeignKey(Quote, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="quote_items", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
