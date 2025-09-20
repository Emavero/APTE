from django.contrib import admin
from .models import Category, Product

# ===========================
# Admin pour les catégories
# ===========================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}  # slug auto depuis le nom


# ===========================
# Admin pour les produits
# ===========================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "stock", "category", "is_active", "created_at")
    list_filter = ("is_active", "category", "created_at")
    search_fields = ("name", "description")
    ordering = ("-created_at",)
    
    # slug auto depuis le nom
    prepopulated_fields = {"slug": ("name",)}

    # champs visibles lors de l'édition
    fieldsets = (
        (None, {"fields": ("name", "slug", "description", "image", "category")}),
        ("Stock & Prix", {"fields": ("price", "stock")}),
        ("Statut", {"fields": ("is_active",)}),
        ("Dates", {"fields": ("created_at", "updated_at")}),
    )

    readonly_fields = ("created_at", "updated_at")
