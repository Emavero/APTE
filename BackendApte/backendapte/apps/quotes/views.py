from rest_framework import generics, permissions
from .models import Quote
from .serializers import QuoteSerializer


class QuoteListCreateView(generics.ListCreateAPIView):
    """
    Liste et création de devis pour l'utilisateur connecté
    """
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quote.objects.filter(user=self.request.user).order_by("-created_at")


class QuoteDetailView(generics.RetrieveAPIView):
    """
    Détail d'un devis pour l'utilisateur connecté
    """
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quote.objects.filter(user=self.request.user)
