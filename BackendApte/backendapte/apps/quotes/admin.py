# apps/quotes/admin.py
from django.contrib import admin
from .models import Quote, QuoteItem


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 1
    readonly_fields = ['subtotal']


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_estimate', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'description']
    readonly_fields = ['total_estimate', 'created_at', 'updated_at']
    inlines = [QuoteItemInline]

    fieldsets = (
        ('Utilisateur', {'fields': ('user',)}),
        ('Informations', {'fields': ('description', 'message')}),
        ('Paramètres', {'fields': ('rooms', 'entries', 'windows')}),
        ('Totaux', {'fields': ('total_estimate',)}),
        ('Statut', {'fields': ('status',)}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(QuoteItem)
class QuoteItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'quote', 'product', 'quantity', 'subtotal']
    readonly_fields = ['subtotal']