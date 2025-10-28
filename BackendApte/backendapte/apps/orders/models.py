from django.db import models
from django.conf import settings
from apps.products.models import Product

User = settings.AUTH_USER_MODEL


class Order(models.Model):
    """
    Commande d'un utilisateur.
    """
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("paid", "Payée"),
        ("shipped", "Expédiée"),
        ("completed", "Terminée"),
        ("canceled", "Annulée"),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ("cash", "Espèces à la livraison"),
        ("wave", "Wave"),
    ]

    user = models.ForeignKey(User, related_name="orders", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="cash")
    phone_number = models.CharField(max_length=20, null=True, blank=True, help_text="Numéro Wave pour le paiement")
    wave_transaction_id = models.CharField(max_length=255, null=True, blank=True, help_text="ID de transaction Wave")

    # 🆕 Champs de livraison à ajouter
    delivery_name = models.CharField(max_length=255, blank=True, null=True)
    delivery_phone = models.CharField(max_length=20, blank=True, null=True)      
    delivery_address = models.CharField(max_length=255, blank=True, null=True)
    delivery_city = models.CharField(max_length=100, blank=True, null=True)
    delivery_notes = models.TextField(blank=True, null=True)


    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Commande #{self.id} - {self.user} - {self.status}"


class OrderItem(models.Model):
    """
    Produits contenus dans une commande.
    """
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="order_items", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
    
    @property
    def subtotal(self):
        return self.price * self.quantity