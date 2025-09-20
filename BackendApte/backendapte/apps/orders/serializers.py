from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=OrderItem._meta.get_field("product").related_model.objects.all(),
        source="product",
        write_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_id", "quantity", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)  # liste d’items dans la commande

    class Meta:
        model = Order
        fields = ["id", "user", "status", "total_price", "created_at", "updated_at", "items"]
        read_only_fields = ["user", "total_price", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data, user=self.context["request"].user)

        total_price = 0
        for item_data in items_data:
            product = item_data["product"]
            quantity = item_data["quantity"]
            price = product.price  # récup prix unitaire

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
            total_price += price * quantity

        order.total_price = total_price
        order.save()
        return order
