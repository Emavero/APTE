from rest_framework import serializers
from .models import Quote, QuoteItem
from apps.products.serializers import ProductSerializer


class QuoteItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=QuoteItem._meta.get_field("product").related_model.objects.all(),
        source="product",
        write_only=True
    )

    class Meta:
        model = QuoteItem
        fields = ["id", "product", "product_id", "quantity"]


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True)

    class Meta:
        model = Quote
        fields = ["id", "user", "status", "description", "total_estimate", "message", "created_at", "items"]
        read_only_fields = ["user", "total_estimate", "created_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        quote = Quote.objects.create(**validated_data, user=self.context["request"].user)

        total_estimate = 0
        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]

            QuoteItem.objects.create(
                quote=quote,
                product=product,
                quantity=quantity
            )
            total_estimate += product.price * quantity  # si tu as price dans Product

        quote.total_estimate = total_estimate
        quote.save()
        return quote
