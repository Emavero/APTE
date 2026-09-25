"""Sérialiseurs = frontière d'entrée/sortie de l'API utilisateurs.

Ils valident la forme des données ; les règles métier vivent dans ``services``.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.common.validators import PHONE_MAX_DIGITS, PHONE_MIN_DIGITS, normalize_phone

from . import services

User = get_user_model()


def _normalized_phone_or_error(value: str | None) -> str | None:
    """Réduit un numéro à ses chiffres et vérifie sa longueur utile."""
    digits = normalize_phone(value)
    if digits and not (PHONE_MIN_DIGITS <= len(digits) <= PHONE_MAX_DIGITS):
        raise serializers.ValidationError(
            f"Numéro de téléphone invalide ({PHONE_MIN_DIGITS} à {PHONE_MAX_DIGITS} chiffres attendus)."
        )
    return digits


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "phone", "full_name", "role", "is_staff", "date_joined"]
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_null=True)
    # La longueur porte sur la saisie brute (« +221 77 123 45 67 ») ; c'est le
    # numéro normalisé qui doit tenir dans les 15 chiffres du modèle.
    phone = serializers.CharField(required=False, allow_null=True, max_length=25)
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")
    role = serializers.ChoiceField(choices=User._meta.get_field("role").choices, default="individual")
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet e-mail.")
        return value

    def validate_phone(self, value):
        digits = _normalized_phone_or_error(value)
        if digits and User.objects.filter(phone=digits).exists():
            raise serializers.ValidationError("Un compte existe déjà avec ce numéro.")
        return digits

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError("Vous devez fournir un e-mail ou un numéro de téléphone.")
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        return services.register_user(**validated_data)

    def to_representation(self, instance):
        return UserSerializer(instance).data


class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, max_length=25)
    current_password = serializers.CharField(required=False, write_only=True)
    password = serializers.CharField(required=False, write_only=True, validators=[validate_password])

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Cet e-mail est déjà utilisé.")
        return value

    def validate_phone(self, value):
        digits = _normalized_phone_or_error(value)
        if digits and User.objects.filter(phone=digits).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Ce numéro est déjà utilisé.")
        return digits

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("Aucune donnée à mettre à jour.")
        return attrs

    def update(self, instance, validated_data):
        return services.update_profile(instance, **validated_data)

    def to_representation(self, instance):
        return UserSerializer(instance).data


class PasswordResetSerializer(serializers.Serializer):
    """Un seul point d'entrée pour les deux étapes de la réinitialisation.

    Sans ``token`` : demande d'envoi du lien par e-mail.
    Avec ``token`` : application effective du nouveau mot de passe.
    """

    email = serializers.EmailField(required=False)
    token = serializers.CharField(required=False, allow_blank=True)
    new_password = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        token = (attrs.get("token") or "").strip()
        if token:
            if not attrs.get("new_password"):
                raise serializers.ValidationError({"new_password": "Le nouveau mot de passe est requis."})
        elif not attrs.get("email"):
            raise serializers.ValidationError(
                {"email": "L'adresse e-mail est requise pour recevoir le lien."}
            )
        attrs["token"] = token
        return attrs

    def save(self, **kwargs):
        token = self.validated_data["token"]
        if token:
            services.confirm_password_reset(token=token, new_password=self.validated_data["new_password"])
            return {
                "detail": "Votre mot de passe a été modifié avec succès. "
                "Vous pouvez maintenant vous connecter.",
                "stage": "completed",
            }
        services.request_password_reset(email=self.validated_data["email"])
        return {
            "detail": "Si un compte existe pour cette adresse, un lien de "
            "réinitialisation vient d'être envoyé par e-mail.",
            "stage": "email_sent",
        }


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(write_only=True)

    def save(self, **kwargs):
        services.logout(refresh_token=self.validated_data["refresh"])
        return {"detail": "Déconnexion effectuée."}
