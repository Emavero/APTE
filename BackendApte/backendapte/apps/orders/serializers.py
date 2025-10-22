from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_id", "quantity", "price"]
        read_only_fields = ["price"]

    def validate_product_id(self, value):
        """Vérifier que le produit existe"""
        from apps.products.models import Product
        try:
            Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Le produit n'existe pas.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, write_only=True)
    items_data = OrderItemSerializer(source='items', many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "user", "status", "total_price", 
            "created_at", "updated_at", "items", "items_data"
        ]
        read_only_fields = ["user", "total_price", "created_at", "updated_at"]

    def create(self, validated_data):
        """Créer la commande avec les articles"""
        items_data = validated_data.pop("items", [])
        
        if not items_data:
            raise serializers.ValidationError("Au moins un article est requis.")
        
        # Créer la commande
        order = Order.objects.create(
            user=self.context["request"].user,
            **validated_data
        )

        total_price = 0
        
        # Créer les articles
        for item_data in items_data:
            from apps.products.models import Product
            
            try:
                product = Product.objects.get(id=item_data['product_id'])
            except Product.DoesNotExist:
                order.delete()
                raise serializers.ValidationError(f"Produit {item_data['product_id']} introuvable.")

            quantity = item_data.get('quantity', 1)
            
            # Vérifier le stock
            if product.stock < quantity:
                order.delete()
                raise serializers.ValidationError(
                    f"Stock insuffisant pour {product.name}. "
                    f"Disponible: {product.stock}, Demandé: {quantity}"
                )
            
            price = product.price
            
            # Créer l'article
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
            
            total_price += float(price) * quantity

        # Mettre à jour le total
        order.total_price = total_price
        order.save()
        
        return order