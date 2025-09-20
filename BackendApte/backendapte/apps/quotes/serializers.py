from rest_framework import serializers
from .models import Quote
from apps.users.models import User


# Utilisateur normal → devis
class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ["id", "description", "estimated_price", "status", "created_at"]


# Admin → devis avec détails utilisateur
class AdminQuoteSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = ["id", "user", "description", "estimated_price", "status", "created_at"]

    def get_user(self, obj):
        return {
            "id": obj.user.id,
            "email": obj.user.email,
            "phone": obj.user.phone,
            "full_name": obj.user.full_name,
        }
