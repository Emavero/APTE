from django.db import models
from django.conf import settings
from apps.products.models import Product

User = settings.AUTH_USER_MODEL


class Order(models.Model):
    """
    Commande d’un utilisateur.
    """
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("paid", "Payée"),
        ("shipped", "Expédiée"),
        ("completed", "Terminée"),
        ("canceled", "Annulée"),
    ]

    user = models.ForeignKey(User, related_name="orders", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Commande #{self.id} - {self.user} - {self.status}"


class OrderItem(models.Model):
    """
    Produits contenus dans une commande.
    """
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="order_items", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # prix unitaire

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
