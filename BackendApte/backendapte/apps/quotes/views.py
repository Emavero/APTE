# apps/quotes/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Quote
from .serializers import QuoteSerializer
import traceback


class QuoteListCreateView(generics.ListCreateAPIView):
    serializer_class = QuoteSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return Quote.objects.all().order_by("-created_at")
        if user.is_authenticated:
            return Quote.objects.filter(user=user).order_by("-created_at")
        return Quote.objects.none()

    def perform_create(self, serializer):
        # Ne pas passer user ici, il est géré dans le serializer
        serializer.save()

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Erreur lors de la création du devis: {str(e)}")
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class QuoteDetailView(generics.RetrieveAPIView):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]