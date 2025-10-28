from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_id", "quantity", "price", "subtotal"]
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
    wave_payment_url = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "user", "status", "payment_method", "phone_number",
            "delivery_name", "delivery_phone", "delivery_address", "delivery_city", "delivery_notes",  # 🆕 ajout
            "total_price", "created_at", "updated_at",
            "items", "items_data", "wave_transaction_id", "wave_payment_url"
        ]
        read_only_fields = ["user", "total_price", "created_at", "updated_at", "wave_transaction_id"]

    
    def get_wave_payment_url(self, obj):
        """Retourne l'URL de paiement Wave si disponible"""
        if obj.payment_method == 'wave' and obj.wave_transaction_id:
            # Vous pouvez stocker l'URL dans un champ séparé ou la reconstruire
            return f"https://checkout.wave.com/checkout/{obj.wave_transaction_id}"
        return None

    def validate(self, data):
        """Validation globale"""
        payment_method = data.get('payment_method')
        phone_number = data.get('phone_number')
        
        # Vérifier que le numéro est fourni pour Wave
        if payment_method == 'wave' and not phone_number:
            raise serializers.ValidationError({
                'phone_number': 'Le numéro de téléphone est requis pour le paiement Wave.'
            })
        
        # Vérifier le format du numéro (basique)
        if payment_method == 'wave' and phone_number:
            clean_phone = ''.join(filter(str.isdigit, phone_number))
            if len(clean_phone) < 9:
                raise serializers.ValidationError({
                    'phone_number': 'Numéro de téléphone invalide.'
                })
        
        return data

    def create(self, validated_data):
     items_data = validated_data.pop("items", [])
     payment_method = validated_data.pop('payment_method', 'cash')  # ✅ on le pop ici
     phone_number = validated_data.pop('phone_number', None)

     if not items_data:
        raise serializers.ValidationError("Au moins un article est requis.")

     order = Order.objects.create(
        user=self.context["request"].user,
        payment_method=payment_method,
        phone_number=phone_number if payment_method == 'wave' else None,
        **validated_data
     )

     total_price = 0
     for item_data in items_data:
        from apps.products.models import Product
        product = Product.objects.get(id=item_data['product_id'])
        quantity = item_data.get('quantity', 1)
        if product.stock < quantity:
            order.delete()
            raise serializers.ValidationError(f"Stock insuffisant pour {product.name}")
        price = product.price
        OrderItem.objects.create(order=order, product=product, quantity=quantity, price=price)
        total_price += float(price) * quantity

     order.total_price = total_price
     order.save()
     return order
