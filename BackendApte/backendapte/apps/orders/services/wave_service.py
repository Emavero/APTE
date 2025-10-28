# apps/orders/services/wave_service.py
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class WavePaymentService:
    """
    Service pour gérer les paiements via l'API Wave.
    Documentation: https://developer.wave.com/
    """
    BASE_URL = getattr(settings, 'WAVE_API_URL', 'https://api.wave.com/v1')
    
    def __init__(self):
        self.api_key = getattr(settings, 'WAVE_API_KEY', '')
        self.secret_key = getattr(settings, 'WAVE_SECRET_KEY', '')
        
        if not self.api_key or not self.secret_key:
            logger.warning("Wave API credentials not configured")
    
    def create_payment(self, amount, phone_number, order_id):
        """
        Crée une demande de paiement Wave.
        
        Args:
            amount: Montant à payer
            phone_number: Numéro de téléphone Wave
            order_id: ID de la commande
            
        Returns:
            dict: Réponse de l'API Wave avec transaction_id et payment_url
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Nettoyer le numéro de téléphone
        clean_phone = ''.join(filter(str.isdigit, phone_number))
        
        data = {
            "amount": float(amount),
            "currency": "XOF",  # Franc CFA
            "phone": clean_phone,
            "description": f"Paiement commande #{order_id}",
            "callback_url": f"{settings.BACKEND_URL}/api/orders/wave-callback/",
            "return_url": f"{settings.FRONTEND_URL}/orders/{order_id}",
            "merchant_reference": f"ORDER-{order_id}"
        }
        
        try:
            logger.info(f"Initiating Wave payment for order #{order_id}")
            response = requests.post(
                f"{self.BASE_URL}/checkout/sessions",
                json=data,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Wave payment created successfully: {result.get('id')}")
            return {
                'transaction_id': result.get('id'),
                'payment_url': result.get('wave_launch_url'),
                'status': 'pending'
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Wave API error: {str(e)}")
            raise Exception(f"Erreur lors de la création du paiement Wave: {str(e)}")
    
    def check_payment_status(self, transaction_id):
        """
        Vérifie le statut d'un paiement Wave.
        
        Args:
            transaction_id: ID de la transaction Wave
            
        Returns:
            dict: Statut du paiement
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            response = requests.get(
                f"{self.BASE_URL}/checkout/sessions/{transaction_id}",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                'status': result.get('status'),
                'payment_status': result.get('payment_status'),
                'amount': result.get('amount')
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Wave API status check error: {str(e)}")
            raise Exception(f"Erreur lors de la vérification du statut: {str(e)}")
    
    def verify_webhook_signature(self, payload, signature):
        """
        Vérifie la signature du webhook Wave.
        
        Args:
            payload: Contenu du webhook
            signature: Signature reçue
            
        Returns:
            bool: True si la signature est valide
        """
        import hmac
        import hashlib
        
        expected_signature = hmac.new(
            self.secret_key.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)