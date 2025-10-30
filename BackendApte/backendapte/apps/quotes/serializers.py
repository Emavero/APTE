# apps/quotes/serializers.py
from rest_framework import serializers
from .models import Quote, QuoteItem
from apps.products.models import Product


class QuoteItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.DecimalField(source="product.price", read_only=True, max_digits=10, decimal_places=2)

    class Meta:
        model = QuoteItem
        fields = ["id", "product", "product_name", "product_price", "quantity", "subtotal"]
        read_only_fields = ["subtotal", "product_name", "product_price"]


class QuoteItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = ["product", "quantity"]


class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True)
    items_write = QuoteItemWriteSerializer(many=True, write_only=True, required=False)
    user_name = serializers.CharField(source="user.username", read_only=True, required=False)

    class Meta:
        model = Quote
        fields = [
            "id",
            "user",
            "user_name",
            "status",
            "description",
            "message",
            "rooms",
            "entries",
            "windows",
            "total_estimate",
            "created_at",
            "items",
            "items_write",
        ]
        read_only_fields = ["status", "total_estimate", "created_at", "user"]

    def create(self, validated_data):
        items_data = validated_data.pop("items_write", [])
        
        # Récupérer l'utilisateur depuis le contexte
        user = self.context["request"].user if self.context["request"].user.is_authenticated else None
        
        # Créer le devis avec l'utilisateur
        quote = Quote.objects.create(user=user, **validated_data)

        total = 0
        for item_data in items_data:
            product = item_data.get("product")
            quantity = item_data.get("quantity", 1)
            
            if product:
                subtotal = product.price * quantity
                QuoteItem.objects.create(
                    quote=quote, 
                    product=product, 
                    quantity=quantity,
                    subtotal=subtotal
                )
                total += subtotal

        quote.total_estimate = total
        quote.save()
        return quote