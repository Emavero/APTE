from django.contrib import admin
from .models import Quote, QuoteItem


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 1


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_estimate", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__email", "user__phone")
    ordering = ("-created_at",)
    inlines = [QuoteItemInline]

    readonly_fields = ("created_at",)
