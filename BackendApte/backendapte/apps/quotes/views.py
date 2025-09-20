from rest_framework import generics, permissions
from .models import Quote
from .serializers import QuoteSerializer, AdminQuoteSerializer


class QuoteListCreateView(generics.ListCreateAPIView):
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quote.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class QuoteDetailView(generics.RetrieveAPIView):
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Quote.objects.filter(user=self.request.user)


# Admin
class AdminQuoteListView(generics.ListAPIView):
    queryset = Quote.objects.all().order_by("-created_at")
    serializer_class = AdminQuoteSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminQuoteDetailView(generics.RetrieveUpdateAPIView):
    queryset = Quote.objects.all()
    serializer_class = AdminQuoteSerializer
    permission_classes = [permissions.IsAdminUser]
