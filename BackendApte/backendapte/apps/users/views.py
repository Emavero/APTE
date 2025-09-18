from rest_framework import generics, permissions ,filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import UserSerializer, RegisterSerializer ,UserUpdateSerializer
from .models import User


# Pagination
class UserPagination(PageNumberPagination):
    page_size = 10           # nombre d'éléments par page
    page_size_query_param = 'page_size'  # permettre de modifier via query param
    max_page_size = 100


# Inscription utilisateur
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

# Profil utilisateur
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class MeUpdateView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class DeleteMeView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user



class UserList(generics.ListAPIView):
   
    """
    Classe pour lister les utilisateurs.

    Fonctionnalités :
      - recherche globale par email, phone, full_name, role
      - filtrage précis par email et rôle
      - tri par champs (ordering)
      - pagination
    Accessible uniquement aux admins.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = UserPagination

    # Backends pour recherche, filtrage et tri
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]

    # Recherche globale
    search_fields = ['email', 'phone', 'full_name', 'role']

    # Filtrage précis via query params
    filterset_fields = ['email', 'role', 'is_active', 'is_staff']

    # Champs disponibles pour trier
    ordering_fields = ['email', 'full_name', 'role', 'date_joined']
    ordering = ['email']  # tri par défaut