from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import UserSerializer, RegisterSerializer, UserUpdateSerializer
from .models import User

# Pagination
class UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==========================
# Inscription
# ==========================
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


# ==========================
# Profil utilisateur connecté
# ==========================
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ==========================
# Mise à jour profil / mot de passe (connecté)
# ==========================
class MeUpdateView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ==========================
# Réinitialisation mot de passe (oubli)
# ==========================
class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("new_password")

        if not email or not new_password:
            return Response(
                {"detail": "Email et nouveau mot de passe requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Mot de passe réinitialisé avec succès."})
        except User.DoesNotExist:
            return Response(
                {"detail": "Aucun utilisateur trouvé avec cet email."},
                status=status.HTTP_404_NOT_FOUND
            )


# ==========================
# Liste des utilisateurs (admin)
# ==========================
class UserList(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = UserPagination

    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['email', 'phone', 'full_name', 'role']
    filterset_fields = ['email', 'role', 'is_active', 'is_staff']
    ordering_fields = ['email', 'full_name', 'role', 'date_joined']
    ordering = ['email']


# ==========================
# Suppression compte utilisateur (connecté)
# ==========================

class DeleteMeView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user