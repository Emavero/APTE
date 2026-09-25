"""Administration des commandes, factures et paiements.

Les pièces comptables (facture, paiement, ligne de commande) sont en lecture
seule : elles se corrigent par un avoir, jamais par une réécriture.
"""

from __future__ import annotations

from django.contrib import admin, messages
from django.utils.html import format_html

from apps.common.money import format_money

from .models import Invoice, InvoiceSequence, Order, OrderItem, OrderStatus, Payment
from .services import checkout


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = ("product", "product_name", "unit_price", "quantity", "line_total")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    can_delete = False
    fields = ("provider", "provider_reference", "status", "amount", "settled_at", "failure_reason")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "payment_method",
        "total_display",
        "invoice_number",
        "delivery_city",
        "created_at",
    )
    list_filter = ("status", "payment_method", "created_at")
    list_select_related = ("user", "invoice")
    search_fields = (
        "id",
        "user__email",
        "user__phone",
        "delivery_name",
        "delivery_phone",
        "delivery_city",
        "invoice__number",
    )
    date_hierarchy = "created_at"
    inlines = [OrderItemInline, PaymentInline]
    actions = ["mark_shipped", "mark_completed", "cancel_orders"]

    readonly_fields = (
        "user",
        "payment_method",
        "phone_number",
        "currency",
        "items_total",
        "shipping_amount",
        "discount_amount",
        "total_price",
        "paid_at",
        "canceled_at",
        "created_at",
        "updated_at",
        "invoice_link",
    )

    fieldsets = (
        ("Commande", {"fields": ("user", "status", "payment_method", "invoice_link")}),
        (
            "Montants",
            {
                "fields": (
                    "currency",
                    "items_total",
                    "shipping_amount",
                    "discount_amount",
                    "total_price",
                )
            },
        ),
        (
            "Livraison",
            {
                "fields": (
                    "delivery_name",
                    "delivery_phone",
                    "delivery_address",
                    "delivery_city",
                    "delivery_notes",
                )
            },
        ),
        ("Paiement", {"fields": ("phone_number", "paid_at"), "classes": ("collapse",)}),
        ("Dates", {"fields": ("created_at", "updated_at", "canceled_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Total")
    def total_display(self, obj: Order) -> str:
        return format_money(obj.total_price)

    @admin.display(description="Facture")
    def invoice_number(self, obj: Order) -> str:
        invoice = getattr(obj, "invoice", None)
        return invoice.number if invoice else "—"

    @admin.display(description="Facture")
    def invoice_link(self, obj: Order):
        invoice = getattr(obj, "invoice", None)
        if not invoice or not obj.pk:
            return "—"
        return format_html(
            '<a href="/api/orders/{}/invoice/print/" target="_blank">{}</a>', obj.pk, invoice.number
        )

    def get_readonly_fields(self, request, obj=None):
        # Une commande close n'est plus modifiable, statut compris.
        if obj and obj.status in {OrderStatus.CANCELED, OrderStatus.REFUNDED, OrderStatus.COMPLETED}:
            return tuple(f.name for f in self.model._meta.fields) + ("invoice_link",)
        return self.readonly_fields

    def has_add_permission(self, request):
        """Les commandes naissent du tunnel d'achat, pas de l'admin."""
        return False

    def has_delete_permission(self, request, obj=None):
        if obj and obj.status != OrderStatus.PENDING:
            return False
        return super().has_delete_permission(request, obj)

    def save_model(self, request, obj, form, change):
        """Passe par le domaine pour tout changement de statut (stock, facture)."""
        if change and "status" in form.changed_data:
            original = Order.objects.get(pk=obj.pk)
            obj.status = original.status  # évite d'écrire le statut deux fois
            super().save_model(request, obj, form, change)
            checkout.transition(original, form.cleaned_data["status"], reason="admin")
            return
        super().save_model(request, obj, form, change)

    def _bulk_transition(self, request, queryset, new_status: str) -> None:
        applied, refused = 0, 0
        for order in queryset:
            try:
                checkout.transition(order, new_status, reason="action admin")
                applied += 1
            except Exception:  # noqa: BLE001 - transition refusée par le domaine
                refused += 1
        if applied:
            self.message_user(request, f"{applied} commande(s) mise(s) à jour.", messages.SUCCESS)
        if refused:
            self.message_user(
                request, f"{refused} commande(s) ignorée(s) (transition interdite).", messages.WARNING
            )

    @admin.action(description="Marquer comme expédiée")
    def mark_shipped(self, request, queryset):
        self._bulk_transition(request, queryset, OrderStatus.SHIPPED)

    @admin.action(description="Marquer comme terminée")
    def mark_completed(self, request, queryset):
        self._bulk_transition(request, queryset, OrderStatus.COMPLETED)

    @admin.action(description="Annuler (et restituer le stock)")
    def cancel_orders(self, request, queryset):
        self._bulk_transition(request, queryset, OrderStatus.CANCELED)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "order_link", "status", "issued_at", "total_display", "balanced")
    list_filter = ("status", "issued_at")
    list_select_related = ("order",)
    search_fields = ("number", "customer_name", "customer_email", "order__id")
    date_hierarchy = "issued_at"
    readonly_fields = tuple(f.name for f in Invoice._meta.fields) + ("balanced",)

    @admin.display(description="Commande")
    def order_link(self, obj: Invoice):
        return format_html('<a href="/admin/orders/order/{}/change/">#{}</a>', obj.order_id, obj.order_id)

    @admin.display(description="Total TTC")
    def total_display(self, obj: Invoice) -> str:
        return format_money(obj.total_incl_tax)

    @admin.display(description="Équilibrée", boolean=True)
    def balanced(self, obj: Invoice) -> bool:
        return obj.is_balanced

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        """Une facture émise se conserve : on l'annule, on ne la supprime pas."""
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("provider_reference", "order", "provider", "status", "amount", "settled_at")
    list_filter = ("provider", "status", "created_at")
    list_select_related = ("order",)
    search_fields = ("provider_reference", "idempotency_key", "order__id")
    readonly_fields = tuple(f.name for f in Payment._meta.fields)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(InvoiceSequence)
class InvoiceSequenceAdmin(admin.ModelAdmin):
    list_display = ("year", "last_value")
    readonly_fields = ("year", "last_value")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
