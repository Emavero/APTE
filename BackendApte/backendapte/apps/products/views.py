"""Contrôleurs du catalogue. Lecture publique, écriture réservée au personnel."""

from __future__ import annotations

from rest_framework import filters, generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.common.pagination import ProductPagination
from apps.common.permissions import IsAdminOrReadOnly

from . import selectors
from .models import Category
from .serializers import CategorySerializer, ProductSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = ProductPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Le personnel doit aussi voir les produits dépubliés pour les rééditer.
        user = self.request.user
        queryset = (
            selectors.all_products_for_staff()
            if user.is_authenticated and user.is_staff
            else selectors.active_products()
        )
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)
        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return selectors.all_products_for_staff()
        return selectors.active_products()


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
