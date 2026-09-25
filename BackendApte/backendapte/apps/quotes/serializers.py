from __future__ import annotations

from rest_framework import serializers

from apps.common.money import format_money

from .models import Quote, QuoteItem


class QuoteItemSerializer(serializers.ModelSerializer):
    product_price = serializers.DecimalField(
        source="unit_price", max_digits=12, decimal_places=2, read_only=True
    )
    subtotal = serializers.DecimalField(source="line_total", max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = QuoteItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "unit_price",
            "quantity",
            "line_total",
            "subtotal",
        ]
        read_only_fields = fields


class QuoteItemInputSerializer(serializers.Serializer):
    product = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=1000, default=1)


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)
    user_name = serializers.SerializerMethodField()
    total_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Quote
        fields = [
            "id",
            "reference",
            "user",
            "user_name",
            "status",
            "status_display",
            "contact_name",
            "contact_email",
            "contact_phone",
            "description",
            "message",
            "rooms",
            "entries",
            "windows",
            "currency",
            "total_estimate",
            "total_display",
            "created_at",
            "items",
        ]
        read_only_fields = fields

    def get_user_name(self, obj: Quote) -> str:
        # ``display_name`` vit sur le modèle utilisateur : l'ancien code lisait un
        # champ ``username`` qui n'existe pas sur ce projet.
        return getattr(obj.user, "display_name", "") or obj.contact_name

    def get_total_display(self, obj: Quote) -> str:
        return format_money(obj.total_estimate)


class QuoteCreateSerializer(serializers.Serializer):
    """Demande de devis. L'estimation est chiffrée par le serveur."""

    items_write = QuoteItemInputSerializer(many=True, required=False, default=list)
    contact_name = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")
    contact_email = serializers.EmailField(required=False, allow_blank=True, default="")
    contact_phone = serializers.CharField(required=False, allow_blank=True, max_length=25, default="")
    description = serializers.CharField(required=False, allow_blank=True, default="")
    message = serializers.CharField(required=False, allow_blank=True, default="")
    rooms = serializers.IntegerField(required=False, min_value=0, max_value=1000, default=0)
    entries = serializers.IntegerField(required=False, min_value=0, max_value=1000, default=0)
    windows = serializers.IntegerField(required=False, min_value=0, max_value=1000, default=0)

    def validate(self, attrs):
        if not attrs.get("items_write") and not (attrs.get("description") or attrs.get("message")):
            raise serializers.ValidationError("Indiquez au moins un produit ou décrivez votre besoin.")
        return attrs


class QuoteStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Quote._meta.get_field("status").choices)
