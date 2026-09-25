"""Administration des devis."""

from django.contrib import admin

from apps.common.money import format_money

from .models import Quote, QuoteItem


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0
    fields = ("product", "product_name", "unit_price", "quantity", "line_total")
    readonly_fields = ("product_name", "unit_price", "line_total")
    autocomplete_fields = ("product",)


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ("reference", "contact_name", "user", "status", "total_display", "created_at")
    list_filter = ("status", "created_at")
    list_select_related = ("user",)
    search_fields = (
        "reference",
        "contact_name",
        "contact_email",
        "contact_phone",
        "user__email",
        "description",
    )
    date_hierarchy = "created_at"
    readonly_fields = ("reference", "total_estimate", "currency", "created_at", "updated_at")
    inlines = [QuoteItemInline]

    fieldsets = (
        ("Demande", {"fields": ("reference", "status", "user")}),
        ("Contact", {"fields": ("contact_name", "contact_email", "contact_phone")}),
        ("Besoin", {"fields": ("description", "message")}),
        ("Dimensionnement", {"fields": ("rooms", "entries", "windows")}),
        ("Estimation", {"fields": ("currency", "total_estimate")}),
        ("Dates", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Estimation")
    def total_display(self, obj: Quote) -> str:
        return format_money(obj.total_estimate)

    def save_related(self, request, form, formsets, change):
        """Réaligne l'estimation sur les lignes après édition dans l'admin."""
        super().save_related(request, form, formsets, change)
        quote = form.instance
        quote.total_estimate = quote.compute_total()
        quote.save(update_fields=["total_estimate", "updated_at"])
