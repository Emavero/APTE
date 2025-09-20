from django.contrib import admin
from .models import Order, OrderItem


# Inline pour afficher les produits dans une commande
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "price")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_price", "created_at", "updated_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__email", "user__phone")
    ordering = ("-created_at",)
    inlines = [OrderItemInline]  # Affiche les produits liés dans la page de détail

    readonly_fields = ("total_price", "created_at", "updated_at")
