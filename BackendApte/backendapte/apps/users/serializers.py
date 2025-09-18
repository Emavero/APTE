from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


# ============================
# Lecture d'un utilisateur
# ============================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "phone", "full_name", "role", "date_joined"]
        ref_name = "User"



# ============================
# Inscription utilisateur
# ============================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]  # vérifie la complexité du mot de passe
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["email", "phone", "full_name", "role", "password", "password2"]
        ref_name = "User"
    
    def validate(self, attrs):
        # Vérifie qu'au moins un moyen de contact est fourni
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError("Vous devez fournir un email ou un numéro de téléphone.")

        # Vérifie que les deux mots de passe correspondent
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")  # inutile pour la DB

        user = User.objects.create_user(
            email=validated_data.get("email"),
            phone=validated_data.get("phone"),
            password=validated_data.get("password"),
            full_name=validated_data.get("full_name"),
            role=validated_data.get("role", "individual"),
        )
        return user


# ============================
# Mise à jour du profil utilisateur
# ============================
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "phone"]  # champs modifiables par l’utilisateur
        ref_name = "User"
