"""Administration des paniers (consultation uniquement)."""

from django.contrib import admin

from apps.common.money import format_money

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ("product", "quantity", "subtotal_display")
    readonly_fields = ("subtotal_display",)
    autocomplete_fields = ("product",)

    @admin.display(description="Sous-total")
    def subtotal_display(self, obj: CartItem) -> str:
        return format_money(obj.subtotal) if obj.pk else "—"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "items_count", "total_display", "updated_at")
    list_filter = ("created_at", "updated_at")
    list_select_related = ("user",)
    search_fields = ("user__email", "user__phone", "session_key")
    readonly_fields = ("user", "session_key", "total_display", "created_at", "updated_at")
    inlines = [CartItemInline]

    def get_queryset(self, request):
        return super().get_queryset(request).with_items()

    @admin.display(description="Propriétaire")
    def owner(self, obj: Cart) -> str:
        return str(obj.user) if obj.user_id else f"Anonyme ({(obj.session_key or '')[:12]}…)"

    @admin.display(description="Articles")
    def items_count(self, obj: Cart) -> int:
        return obj.count()

    @admin.display(description="Total")
    def total_display(self, obj: Cart) -> str:
        return format_money(obj.total())

    def has_add_permission(self, request):
        return False
