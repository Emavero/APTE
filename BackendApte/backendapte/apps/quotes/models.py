# apps/quotes/models.py
from django.db import models
from django.contrib.auth import get_user_model
from apps.products.models import Product

User = get_user_model()


class Quote(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('completed', 'Complété'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotes')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    description = models.TextField(help_text="Systèmes sélectionnés")
    message = models.TextField(default="", help_text="Détails: fonctionnalités, paramètres")  # ✅ Ajout du default
    
    rooms = models.PositiveIntegerField(default=0, help_text="Nombre de pièces")
    entries = models.PositiveIntegerField(default=0, help_text="Nombre d'entrées")
    windows = models.PositiveIntegerField(default=0, help_text="Nombre de fenêtres")
    
    total_estimate = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Devis'
        verbose_name_plural = 'Devis'

    def __str__(self):
        return f"Devis #{self.id} - {self.user if self.user else 'Anonyme'}"

    def calculate_total(self):
        """Calculer le total des items"""
        total = self.items.aggregate(
            total=models.Sum(models.F('product__price') * models.F('quantity'), output_field=models.DecimalField())
        )['total'] or 0
        return total


class QuoteItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        verbose_name = 'Élément de Devis'
        verbose_name_plural = 'Éléments de Devis'

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    def save(self, *args, **kwargs):
        """Calculer automatiquement le sous-total"""
        self.subtotal = self.product.price * self.quantity
        super().save(*args, **kwargs)