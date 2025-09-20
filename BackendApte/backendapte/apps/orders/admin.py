from django.contrib import admin
from .models import Order, OrderItem
from apps.products.models import Product


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1  # permet d’ajouter au moins une ligne
    autocomplete_fields = ["product"]  # permet de rechercher dans les produits existants


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_price", "created_at", "updated_at")
    inlines = [OrderItemInline]
    list_filter = ("status", "created_at")
    search_fields = ("user__email", "user__phone")
    readonly_fields = ("total_price", "created_at", "updated_at")
