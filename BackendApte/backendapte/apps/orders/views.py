from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

from .models import Order
from .serializers import OrderSerializer
from .services.wave_service import WavePaymentService

logger = logging.getLogger(__name__)


class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            'items', 'items__product'
        ).order_by("-created_at")
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Créer une commande et initialiser le paiement si nécessaire"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Créer la commande
        order = serializer.save()
        
        # Si paiement Wave, initialiser le paiement
        if order.payment_method == 'wave':
            try:
                wave_service = WavePaymentService()
                wave_response = wave_service.create_payment(
                    amount=order.total_price,
                    phone_number=order.phone_number,
                    order_id=order.id
                )
                
                # Sauvegarder l'ID de transaction Wave
                order.wave_transaction_id = wave_response.get('transaction_id')
                order.save()
                
                # Retourner les infos de paiement
                response_data = OrderSerializer(order).data
                response_data['wave_payment_url'] = wave_response.get('payment_url')
                response_data['message'] = 'Veuillez confirmer le paiement sur votre téléphone Wave'
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Wave payment error for order {order.id}: {str(e)}")
                # Marquer la commande comme annulée
                order.status = 'canceled'
                order.save()
                
                return Response({
                    'error': f'Erreur lors de l\'initialisation du paiement Wave: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Si paiement cash, retourner directement
        response_data = OrderSerializer(order).data
        response_data['message'] = 'Commande créée avec succès. Paiement à la livraison.'
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            'items', 'items__product'
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # Wave callback n'a pas de token
@csrf_exempt
def wave_callback(request):
    """
    Webhook Wave pour mettre à jour le statut du paiement.
    """
    try:
        # Récupérer les données du webhook
        transaction_id = request.data.get('id')
        payment_status = request.data.get('status')
        
        # Optionnel: Vérifier la signature du webhook
        # signature = request.META.get('HTTP_X_WAVE_SIGNATURE')
        # wave_service = WavePaymentService()
        # if not wave_service.verify_webhook_signature(request.body, signature):
        #     return Response({'error': 'Invalid signature'}, status=403)
        
        logger.info(f"Wave callback received: {transaction_id} - {payment_status}")
        
        # Trouver la commande
        try:
            order = Order.objects.get(wave_transaction_id=transaction_id)
        except Order.DoesNotExist:
            logger.error(f"Order not found for transaction {transaction_id}")
            return Response({'error': 'Commande non trouvée'}, status=404)
        
        # Mettre à jour le statut selon la réponse Wave
        if payment_status in ['success', 'completed', 'paid']:
            order.status = 'paid'
            order.save()
            logger.info(f"Order {order.id} marked as paid")
            return Response({'message': 'Paiement confirmé'}, status=200)
        
        elif payment_status in ['failed', 'canceled', 'expired']:
            order.status = 'canceled'
            order.save()
            logger.info(f"Order {order.id} marked as canceled")
            return Response({'message': 'Paiement échoué'}, status=200)
        
        else:
            logger.warning(f"Unknown payment status: {payment_status}")
            return Response({'message': 'Statut inconnu'}, status=200)
            
    except Exception as e:
        logger.error(f"Wave callback error: {str(e)}")
        return Response({
            'error': f'Erreur lors du traitement: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, order_id):
    """
    Vérifier manuellement le statut d'un paiement Wave.
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        if order.payment_method != 'wave':
            return Response({
                'error': 'Cette commande n\'utilise pas le paiement Wave'
            }, status=400)
        
        if not order.wave_transaction_id:
            return Response({
                'error': 'Aucune transaction Wave associée'
            }, status=400)
        
        # Vérifier le statut auprès de Wave
        wave_service = WavePaymentService()
        wave_status = wave_service.check_payment_status(order.wave_transaction_id)
        
        # Mettre à jour si nécessaire
        if wave_status.get('payment_status') == 'completed' and order.status == 'pending':
            order.status = 'paid'
            order.save()
        
        return Response({
            'order_id': order.id,
            'order_status': order.status,
            'wave_status': wave_status
        })
        
    except Order.DoesNotExist:
        return Response({'error': 'Commande non trouvée'}, status=404)
    except Exception as e:
        logger.error(f"Payment status check error: {str(e)}")
        return Response({
            'error': f'Erreur lors de la vérification: {str(e)}'
        }, status=500)