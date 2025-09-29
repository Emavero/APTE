from django.db import models

class Category(models.Model):
    """
    Catégories de produits (ex: Caméras).
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Modèle représentant un produit e-commerce.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, null=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)

    category = models.ForeignKey(Category, related_name="products", on_delete=models.CASCADE)

    image = models.ImageField(upload_to="products/", blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
