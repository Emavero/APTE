"""Contrôleurs HTTP de l'app commandes : aucune règle métier ici."""

from __future__ import annotations

import logging

from django.shortcuts import render
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.common.exceptions import NotFoundError

from . import selectors
from .models import Order, PaymentMethod
from .serializers import (
    InvoiceSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    PaymentSerializer,
)
from .services import checkout, payment_flow

logger = logging.getLogger(__name__)


class OrderListCreateView(generics.ListCreateAPIView):
    """Liste les commandes de l'utilisateur et ouvre un nouveau tunnel d'achat."""

    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["status", "payment_method"]
    ordering_fields = ["created_at", "total_price"]
    ordering = ["-created_at"]

    queryset = Order.objects.none()  # remplacé par get_queryset (requis pour le schéma)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()
        return selectors.orders_for(self.request.user)

    def get_serializer_class(self):
        return OrderCreateSerializer if self.request.method == "POST" else OrderSerializer

    def get_throttles(self):
        if self.request.method == "POST":
            self.throttle_scope = "checkout"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    @extend_schema(request=OrderCreateSerializer, responses={201: OrderSerializer})
    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order = checkout.place_order(
            user=request.user,
            items=data["items"],
            payment_method=data["payment_method"],
            phone_number=data.get("phone_number"),
            delivery={
                "name": data["delivery_name"],
                "phone": data["delivery_phone"],
                "address": data["delivery_address"],
                "city": data["delivery_city"],
                "notes": data.get("delivery_notes", ""),
            },
        )

        message = "Commande enregistrée. Paiement à la livraison."
        if order.payment_method == PaymentMethod.WAVE:
            # Une erreur du prestataire ne doit pas perdre la commande : elle est
            # déjà enregistrée et facturée, le client peut relancer le paiement.
            try:
                payment_flow.start_payment(order)
                message = "Finalisez le paiement sur Wave pour confirmer la commande."
            except Exception as exc:  # noqa: BLE001 - converti en message client
                logger.warning("Paiement indisponible pour la commande #%s: %s", order.pk, exc)
                message = (
                    "Commande enregistrée, mais le paiement Wave est momentanément "
                    "indisponible. Relancez le paiement depuis vos commandes."
                )

        order = selectors.get_order(request.user, order.pk)
        payload = OrderSerializer(order, context=self.get_serializer_context()).data
        payload["message"] = message
        return Response(payload, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return selectors.orders_for(self.request.user)


class OrderCancelView(APIView):
    """Annulation par le client d'une commande non réglée."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=None, responses={200: OrderSerializer})
    def post(self, request, pk: int):
        order = selectors.get_order(request.user, pk)
        if order is None:
            raise NotFoundError("Commande introuvable.")
        order = checkout.cancel_order(order)
        return Response(OrderSerializer(selectors.get_order(request.user, order.pk)).data)


class OrderStatusUpdateView(APIView):
    """Changement de statut réservé au personnel (préparation, expédition…)."""

    permission_classes = [permissions.IsAdminUser]

    @extend_schema(request=OrderStatusUpdateSerializer, responses={200: OrderSerializer})
    def post(self, request, pk: int):
        order = selectors.get_order(request.user, pk)
        if order is None:
            raise NotFoundError("Commande introuvable.")
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = checkout.transition(
            order,
            serializer.validated_data["status"],
            reason=serializer.validated_data.get("reason", ""),
        )
        return Response(OrderSerializer(selectors.get_order(request.user, order.pk)).data)


class PaymentRestartView(APIView):
    """Réouvre une session de paiement (webhook perdu, abandon, expiration)."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "checkout"
    throttle_classes = [ScopedRateThrottle]

    @extend_schema(request=None, responses={200: PaymentSerializer})
    def post(self, request, pk: int):
        order = selectors.get_order(request.user, pk)
        if order is None:
            raise NotFoundError("Commande introuvable.")
        payment = payment_flow.start_payment(order)
        return Response(PaymentSerializer(payment).data)


class PaymentStatusView(APIView):
    """Vérifie le paiement auprès du prestataire et resynchronise la commande."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=None, responses={200: OpenApiResponse(description="Statut du paiement")})
    def get(self, request, pk: int):
        order = selectors.get_order(request.user, pk)
        if order is None:
            raise NotFoundError("Commande introuvable.")
        payment = payment_flow.refresh_payment_status(order)
        order.refresh_from_db()
        return Response(
            {
                "order_id": order.pk,
                "order_status": order.status,
                "payment": PaymentSerializer(payment).data if payment else None,
            }
        )


class InvoiceDetailView(generics.RetrieveAPIView):
    """Facture d'une commande, au format JSON."""

    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "pk"

    def get_object(self):
        invoice = selectors.invoice_for(self.request.user, self.kwargs["pk"])
        if invoice is None:
            raise NotFoundError("Aucune facture pour cette commande.")
        return invoice


class InvoicePrintView(APIView):
    """Facture imprimable (HTML prêt à imprimer / exporter en PDF)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: OpenApiResponse(description="Facture HTML")})
    def get(self, request, pk: int):
        invoice = selectors.invoice_for(request.user, pk)
        if invoice is None:
            raise NotFoundError("Aucune facture pour cette commande.")
        return render(
            request,
            "orders/invoice.html",
            {"invoice": invoice, "order": invoice.order, "items": invoice.order.items.all()},
        )


@extend_schema(
    request=None,
    responses={
        200: OpenApiResponse(description="Événement pris en compte"),
        403: OpenApiResponse(description="Signature du webhook invalide"),
    },
)
@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
@throttle_classes([ScopedRateThrottle])
def wave_callback(request):
    """Webhook du prestataire de paiement.

    Non authentifié par jeton (le prestataire n'en a pas) mais **signé** : la
    signature HMAC est vérifiée avant toute écriture. Voir ``payment_flow``.
    """
    signature = request.META.get("HTTP_WAVE_SIGNATURE") or request.META.get("HTTP_X_WAVE_SIGNATURE")
    payment = payment_flow.handle_webhook(payload=request.body, signature=signature)
    return Response({"received": True, "payment_status": payment.status}, status=status.HTTP_200_OK)


wave_callback.throttle_scope = "webhook"
