"""Contrôleurs du panier.

Le panier est accessible sans compte (session anonyme) : l'appartenance est
déduite de la requête, jamais d'un identifiant fourni par le client. C'est ce qui
supprime les contrôles d'autorisation ad hoc de l'ancienne implémentation.
"""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Cart
from .serializers import AddItemSerializer, CartSerializer, UpdateItemSerializer


class CartBaseView(APIView):
    permission_classes = [permissions.AllowAny]

    def current_cart(self, request) -> Cart:
        return services.get_or_create_cart(request)

    def cart_response(self, cart: Cart, *, http_status=status.HTTP_200_OK) -> Response:
        cart = Cart.objects.with_items().get(pk=cart.pk)
        return Response(CartSerializer(cart, context={"request": self.request}).data, status=http_status)


class CartView(CartBaseView):
    """Consultation et vidage du panier courant."""

    @extend_schema(responses={200: CartSerializer})
    def get(self, request):
        return self.cart_response(self.current_cart(request))

    @extend_schema(request=None, responses={200: CartSerializer})
    def delete(self, request):
        return self.cart_response(services.clear(self.current_cart(request)))


class CartAddView(CartBaseView):
    @extend_schema(request=AddItemSerializer, responses={201: CartSerializer})
    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.add_item(
            self.current_cart(request),
            product_id=serializer.validated_data["product_id"],
            quantity=serializer.validated_data["quantity"],
        )
        return self.cart_response(cart, http_status=status.HTTP_201_CREATED)


class CartItemView(CartBaseView):
    """Modification / retrait d'une ligne, désignée par son produit."""

    @extend_schema(request=UpdateItemSerializer, responses={200: CartSerializer})
    def patch(self, request, product_id: int):
        serializer = UpdateItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = services.set_quantity(
            self.current_cart(request),
            product_id=product_id,
            quantity=serializer.validated_data["quantity"],
        )
        return self.cart_response(cart)

    @extend_schema(request=None, responses={200: CartSerializer})
    def delete(self, request, product_id: int):
        cart = services.remove_item(self.current_cart(request), product_id=product_id)
        return self.cart_response(cart)


class CartMergeView(CartBaseView):
    """Reprend le panier anonyme dans le compte, à appeler après connexion."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=None, responses={200: CartSerializer})
    def post(self, request):
        cart = services.merge_anonymous_cart(user=request.user, session_key=request.session.session_key)
        return self.cart_response(cart)
