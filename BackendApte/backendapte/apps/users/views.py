"""Contrôleurs HTTP de l'app utilisateurs : validation, délégation, réponse."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import filters, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.pagination import DefaultPagination

from . import services
from .serializers import (
    LogoutSerializer,
    PasswordResetSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class ThrottledTokenObtainPairView(TokenObtainPairView):
    """Connexion : limitée en débit pour freiner le bourrage d'identifiants."""

    throttle_scope = "auth"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = "auth"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class MeView(generics.RetrieveUpdateAPIView):
    """Profil de l'utilisateur connecté (lecture et mise à jour)."""

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        return UserSerializer if self.request.method in permissions.SAFE_METHODS else ProfileUpdateSerializer


class PasswordResetView(APIView):
    """Demande (sans jeton) puis confirmation (avec jeton) du nouveau mot de passe."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "password_reset"
    serializer_class = PasswordResetSerializer

    @extend_schema(request=PasswordResetSerializer, responses={200: None})
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.save(), status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Révoque le jeton de rafraîchissement fourni."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(request=LogoutSerializer, responses={200: None})
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.save(), status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """Annuaire des comptes, réservé au personnel."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = DefaultPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["email", "phone", "full_name"]
    ordering_fields = ["email", "full_name", "role", "date_joined"]
    ordering = ["email"]


class DeleteMeView(APIView):
    """Désactive le compte courant (les pièces comptables sont conservées)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=None, responses={204: None})
    def delete(self, request):
        services.deactivate_account(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
