from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    autocomplete_fields = ["product"]
    readonly_fields = ("price", "subtotal_display")

    def subtotal_display(self, obj):
        """Affiche le sous-total calculé pour chaque ligne"""
        return obj.subtotal if obj.id else "-"
    subtotal_display.short_description = "Sous-total"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "payment_method",
        "total_price",
        "delivery_city",
        "created_at",
        "updated_at",
    )
    list_filter = ("status", "payment_method", "created_at")
    search_fields = (
        "user__email",
        "user__phone",
        "delivery_name",
        "delivery_phone",
        "delivery_address",
        "delivery_city",
    )
    readonly_fields = (
        "total_price",
        "created_at",
        "updated_at",
        "wave_transaction_id",
    )
    inlines = [OrderItemInline]
    ordering = ("-created_at",)

    fieldsets = (
        ("Informations générales", {
            "fields": ("user", "status", "payment_method", "total_price")
        }),
        ("Paiement Wave", {
            "fields": ("phone_number", "wave_transaction_id"),
            "classes": ("collapse",),
        }),
        ("Livraison", {
            "fields": (
                "delivery_name",
                "delivery_phone",
                "delivery_address",
                "delivery_city",
                "delivery_notes",
            ),
        }),
        ("Dates", {
            "fields": ("created_at", "updated_at"),
        }),
    )

    # 🚫 Lecture seule pour les commandes payées ou terminées
    def get_readonly_fields(self, request, obj=None):
        """
        Rend tous les champs en lecture seule si la commande est déjà payée, expédiée ou terminée.
        """
        if obj and obj.status in ["paid", "shipped", "completed"]:
            all_fields = [f.name for f in self.model._meta.fields]
            return all_fields
        return self.readonly_fields

    def has_delete_permission(self, request, obj=None):
        """Empêche la suppression d'une commande payée ou terminée"""
        if obj and obj.status in ["paid", "shipped", "completed"]:
            return False
        return super().has_delete_permission(request, obj)

    def has_add_permission(self, request):
        """Empêche d’ajouter manuellement des commandes depuis l’admin"""
        return False  # Toutes les commandes doivent venir du frontend
