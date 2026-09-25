"""Administration du catalogue."""

from django.contrib import admin
from django.utils.html import format_html

from apps.common.money import format_money

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "product_count")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Produits")
    def product_count(self, obj: Category) -> int:
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price_display", "stock", "category", "image_preview", "is_active", "created_at")
    list_filter = ("is_active", "category", "created_at")
    list_select_related = ("category",)
    list_editable = ("stock", "is_active")
    # Requis par les champs autocomplete des autres apps (panier, devis, commandes).
    search_fields = ("name", "description", "slug")
    ordering = ("-created_at",)
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at", "image_preview")

    fieldsets = (
        (None, {"fields": ("name", "slug", "description", "category")}),
        ("Visuel", {"fields": ("image", "image_preview")}),
        ("Stock & prix", {"fields": ("price", "stock")}),
        ("Publication", {"fields": ("is_active",)}),
        ("Dates", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Prix", ordering="price")
    def price_display(self, obj: Product) -> str:
        return format_money(obj.price)

    @admin.display(description="Aperçu")
    def image_preview(self, obj: Product):
        if not obj.image:
            return "Aucune image"
        return format_html(
            '<img src="{}" width="100" height="100" '
            'style="object-fit: cover; border-radius: 5px;" alt="{}" />',
            obj.image.url,
            obj.name,
        )
