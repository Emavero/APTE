from django.db import models
from django.conf import settings
from apps.products.models import Product
import uuid

User = settings.AUTH_USER_MODEL

class Cart(models.Model):
    """Panier pour utilisateurs authentifiés"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Panier de {self.user}"

    def get_total(self):
        return sum(item.get_subtotal() for item in self.items.all())


class AnonymousCart(models.Model):
    """Panier pour utilisateurs non authentifiés (basé sur session)"""
    session_key = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Panier Anonyme"
        verbose_name_plural = "Paniers Anonymes"

    def __str__(self):
        return f"Panier anonyme ({self.session_key[:20]}...)"

    def get_total(self):
        return sum(item.get_subtotal() for item in self.items.all())


class CartItem(models.Model):
    """Articles du panier (authentifiés)"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', null=True, blank=True)
    anonymous_cart = models.ForeignKey(AnonymousCart, on_delete=models.CASCADE, related_name='items', null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product', 'anonymous_cart')

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    def get_subtotal(self):
        return float(self.product.price) * self.quantity