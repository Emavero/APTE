from django.contrib import admin
from .models import Category, Product
from django.utils.html import format_html

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "product_count")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    
    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Nombre de produits"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "stock", "category", "image_preview", "is_active", "created_at")
    list_filter = ("is_active", "category", "created_at")
    search_fields = ("name", "description")
    ordering = ("-created_at",)
    prepopulated_fields = {"slug": ("name",)}
    
    fieldsets = (
        (None, {"fields": ("name", "slug", "description", "image", "category")}),
        ("Stock & Prix", {"fields": ("price", "stock")}),
        ("Statut", {"fields": ("is_active",)}),
        ("Dates", {"fields": ("created_at", "updated_at")}),
    )

    readonly_fields = ("created_at", "updated_at", "image_preview")
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: cover; border-radius: 5px;" />',
                obj.image.url
            )
        return "Aucune image"
    image_preview.short_description = "Aperçu"