"""Contrôleurs des devis. La demande est ouverte, la consultation cloisonnée."""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.common.exceptions import NotFoundError

from . import services
from .models import Quote
from .serializers import QuoteCreateSerializer, QuoteSerializer, QuoteStatusSerializer


def visible_quotes(user):
    queryset = Quote.objects.with_items()
    if user.is_authenticated:
        return queryset if user.is_staff else queryset.for_user(user)
    # Un visiteur anonyme peut déposer un devis mais pas consulter ceux des autres.
    return queryset.none()


class QuoteListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return visible_quotes(self.request.user)

    def get_serializer_class(self):
        return QuoteCreateSerializer if self.request.method == "POST" else QuoteSerializer

    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "checkout"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    @extend_schema(request=QuoteCreateSerializer, responses={201: QuoteSerializer})
    def create(self, request, *args, **kwargs):
        serializer = QuoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        items = data.pop("items_write", [])

        quote = services.create_quote(
            user=request.user if request.user.is_authenticated else None,
            items=[{"product": item["product"], "quantity": item["quantity"]} for item in items],
            **data,
        )
        quote = Quote.objects.with_items().get(pk=quote.pk)
        return Response(QuoteSerializer(quote).data, status=status.HTTP_201_CREATED)


class QuoteDetailView(generics.RetrieveAPIView):
    serializer_class = QuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return visible_quotes(self.request.user)


class QuoteStatusView(APIView):
    """Traitement commercial du devis (réservé au personnel)."""

    permission_classes = [permissions.IsAdminUser]

    @extend_schema(request=QuoteStatusSerializer, responses={200: QuoteSerializer})
    def post(self, request, pk: int):
        quote = Quote.objects.with_items().filter(pk=pk).first()
        if quote is None:
            raise NotFoundError("Devis introuvable.")
        serializer = QuoteStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quote = services.set_status(quote, serializer.validated_data["status"])
        return Response(QuoteSerializer(quote).data)
