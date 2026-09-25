"""Frontière d'E/S de l'app commandes.

Les sérialiseurs ne calculent aucun montant : ils exposent ce que le domaine a
déjà calculé et validé. Tous les champs monétaires sont en lecture seule côté
API — un client ne peut pas fixer le prix de sa propre commande.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.common.money import format_money
from apps.common.validators import normalize_phone

from .models import Invoice, Order, OrderItem, Payment, PaymentMethod


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(read_only=True)
    product_image_url = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(source="line_total", max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "product_image_url",
            "unit_price",
            "quantity",
            "line_total",
            "subtotal",
        ]
        read_only_fields = fields

    def get_product_image_url(self, obj: OrderItem) -> str | None:
        image = getattr(obj.product, "image", None)
        if not image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(image.url) if request else image.url


class OrderItemInputSerializer(serializers.Serializer):
    """Une ligne demandée par le client : produit + quantité, rien d'autre."""

    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=1000, default=1)


class InvoiceSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(read_only=True)
    items = OrderItemSerializer(source="order.items", many=True, read_only=True)
    total_display = serializers.SerializerMethodField()
    tax_rate_percent = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "number",
            "order_id",
            "status",
            "issued_at",
            "due_at",
            "paid_at",
            "currency",
            "subtotal_excl_tax",
            "tax_rate",
            "tax_rate_percent",
            "tax_amount",
            "shipping_amount",
            "discount_amount",
            "total_incl_tax",
            "total_display",
            "customer_name",
            "customer_email",
            "customer_phone",
            "billing_address",
            "billing_city",
            "seller_snapshot",
            "items",
        ]
        read_only_fields = fields

    def get_total_display(self, obj: Invoice) -> str:
        return format_money(obj.total_incl_tax)

    def get_tax_rate_percent(self, obj: Invoice) -> str:
        return f"{obj.tax_rate * 100:.2f}".rstrip("0").rstrip(".")


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "provider",
            "provider_reference",
            "status",
            "amount",
            "currency",
            "checkout_url",
            "failure_reason",
            "settled_at",
            "created_at",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """Représentation de lecture d'une commande."""

    user = serializers.StringRelatedField(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    # Conservé pour la compatibilité du frontend existant.
    items_data = OrderItemSerializer(source="items", many=True, read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    latest_payment = serializers.SerializerMethodField()
    payment_url = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    total_display = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "status",
            "status_display",
            "payment_method",
            "phone_number",
            "delivery_name",
            "delivery_phone",
            "delivery_address",
            "delivery_city",
            "delivery_notes",
            "currency",
            "items_total",
            "shipping_amount",
            "discount_amount",
            "total_price",
            "total_display",
            "paid_at",
            "created_at",
            "updated_at",
            "items",
            "items_data",
            "invoice",
            "latest_payment",
            "payment_url",
        ]
        read_only_fields = fields

    def get_total_display(self, obj: Order) -> str:
        return format_money(obj.total_price)

    @extend_schema_field(PaymentSerializer(allow_null=True))
    def get_latest_payment(self, obj: Order):
        payment = next(iter(obj.payments.all()[:1]), None)
        return PaymentSerializer(payment).data if payment else None

    def get_payment_url(self, obj: Order) -> str | None:
        """URL de paiement réellement fournie par le prestataire (jamais devinée)."""
        for payment in obj.payments.all():
            if payment.checkout_url and payment.status == "pending":
                return payment.checkout_url
        return None


class OrderCreateSerializer(serializers.Serializer):
    """Entrée du tunnel de commande. Aucun montant n'est accepté du client."""

    items = OrderItemInputSerializer(many=True, allow_empty=False)
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=25)

    delivery_name = serializers.CharField(max_length=255)
    delivery_phone = serializers.CharField(max_length=25)
    delivery_address = serializers.CharField(max_length=255)
    delivery_city = serializers.CharField(max_length=100)
    delivery_notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_delivery_phone(self, value):
        digits = normalize_phone(value)
        if not digits or len(digits) < 9:
            raise serializers.ValidationError("Numéro de téléphone invalide.")
        return digits

    def validate(self, attrs):
        if attrs.get("payment_method") == PaymentMethod.WAVE:
            digits = normalize_phone(attrs.get("phone_number"))
            if not digits or len(digits) < 9:
                raise serializers.ValidationError(
                    {"phone_number": "Un numéro Wave valide est requis pour ce mode de paiement."}
                )
            attrs["phone_number"] = digits
        else:
            attrs["phone_number"] = ""
        return attrs


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Changement de statut (réservé au personnel)."""

    status = serializers.ChoiceField(choices=Order._meta.get_field("status").choices)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")
