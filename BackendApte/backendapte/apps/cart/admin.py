from django.contrib import admin
from .models import Cart, AnonymousCart, CartItem


class CartItemInline(admin.TabularInline):
    """Afficher les articles du panier inline"""
    model = CartItem
    extra = 0
    readonly_fields = ('get_subtotal',)
    fields = ('product', 'quantity', 'get_subtotal')
    
    def get_subtotal(self, obj):
        return f"{obj.get_subtotal()} FCFA"
    get_subtotal.short_description = "Sous-total"


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """Admin pour les paniers authentifiés"""
    list_display = ('user', 'get_items_count', 'get_total', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('get_total', 'created_at', 'updated_at')
    inlines = [CartItemInline]
    
    fieldsets = (
        ('Utilisateur', {
            'fields': ('user',)
        }),
        ('Informations', {
            'fields': ('get_total',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_items_count(self, obj):
        """Nombre total d'articles"""
        return sum(item.quantity for item in obj.items.all())
    get_items_count.short_description = "Articles"

    def get_total(self, obj):
        """Total du panier"""
        return f"{obj.get_total()} FCFA"
    get_total.short_description = "Total"

    def has_add_permission(self, request):
        """Désactiver l'ajout manuel"""
        return False


@admin.register(AnonymousCart)
class AnonymousCartAdmin(admin.ModelAdmin):
    """Admin pour les paniers anonymes"""
    list_display = ('get_session_key', 'get_items_count', 'get_total', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('session_key',)
    readonly_fields = ('session_key', 'get_total', 'created_at', 'updated_at')
    inlines = [CartItemInline]
    
    fieldsets = (
        ('Session', {
            'fields': ('session_key',)
        }),
        ('Informations', {
            'fields': ('get_total',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_session_key(self, obj):
        """Afficher les 20 premiers caractères"""
        return f"{obj.session_key[:20]}..."
    get_session_key.short_description = "Session Key"

    def get_items_count(self, obj):
        """Nombre total d'articles"""
        return sum(item.quantity for item in obj.items.all())
    get_items_count.short_description = "Articles"

    def get_total(self, obj):
        """Total du panier"""
        return f"{obj.get_total()} FCFA"
    get_total.short_description = "Total"

    def has_add_permission(self, request):
        """Désactiver l'ajout manuel"""
        return False


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """Admin pour les articles du panier"""
    list_display = ('get_cart_user', 'product', 'quantity', 'get_subtotal')
    list_filter = ('cart__user', 'product__category', 'cart__created_at')
    search_fields = ('cart__user__username', 'product__name', 'anonymous_cart__session_key')
    readonly_fields = ('get_subtotal', 'get_price')
    
    fieldsets = (
        ('Article', {
            'fields': ('cart', 'anonymous_cart', 'product', 'quantity')
        }),
        ('Informations', {
            'fields': ('get_price', 'get_subtotal'),
            'classes': ('collapse',)
        }),
    )

    def get_cart_user(self, obj):
        """Afficher l'utilisateur ou 'Anonyme'"""
        if obj.cart:
            return obj.cart.user.username
        else:
            return f"Anonyme ({obj.anonymous_cart.session_key[:15]}...)"
    get_cart_user.short_description = "Utilisateur"

    def get_price(self, obj):
        """Prix unitaire"""
        return f"{obj.product.price} FCFA"
    get_price.short_description = "Prix unitaire"

    def get_subtotal(self, obj):
        """Sous-total"""
        return f"{obj.get_subtotal()} FCFA"
    get_subtotal.short_description = "Sous-total"

    def has_add_permission(self, request):
        """Désactiver l'ajout manuel"""
        return False
