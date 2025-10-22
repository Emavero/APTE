from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Cart, AnonymousCart, CartItem
from .serializers import CartSerializer, AnonymousCartSerializer, CartItemSerializer
from apps.products.models import Product

def get_or_create_anonymous_cart(session_key):
    """Obtenir ou créer un panier anonyme"""
    cart, created = AnonymousCart.objects.get_or_create(session_key=session_key)
    return cart

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart(request):
    """Récupérer le panier de l'utilisateur (authentifié ou anonyme)"""
    if request.user.is_authenticated:
        # Utilisateur connecté
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
    else:
        # Utilisateur anonyme
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        
        cart = get_or_create_anonymous_cart(session_key)
        serializer = AnonymousCartSerializer(cart)
    
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_cart(request):
    """Ajouter un produit au panier"""
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Produit non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        if request.user.is_authenticated:
            # Panier authentifié
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            serializer = CartSerializer(cart)
        else:
            # Panier anonyme
            session_key = request.session.session_key
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            
            cart = get_or_create_anonymous_cart(session_key)
            
            cart_item, created = CartItem.objects.get_or_create(
                anonymous_cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            serializer = AnonymousCartSerializer(cart)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_from_cart(request, item_id):
    """Supprimer un article du panier"""
    try:
        item = CartItem.objects.get(id=item_id)
        
        if request.user.is_authenticated:
            if item.cart.user != request.user:
                return Response(
                    {'error': 'Non autorisé'},
                    status=status.HTTP_403_FORBIDDEN
                )
            item.delete()
            cart = item.cart
            serializer = CartSerializer(cart)
        else:
            session_key = request.session.session_key
            if item.anonymous_cart.session_key != session_key:
                return Response(
                    {'error': 'Non autorisé'},
                    status=status.HTTP_403_FORBIDDEN
                )
            item.delete()
            cart = item.anonymous_cart
            serializer = AnonymousCartSerializer(cart)
        
        return Response(serializer.data)
    except CartItem.DoesNotExist:
        return Response(
            {'error': 'Article non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_cart_item(request, item_id):
    """Mettre à jour la quantité"""
    quantity = request.data.get('quantity', 1)
    
    if quantity <= 0:
        return Response(
            {'error': 'La quantité doit être positive'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        item = CartItem.objects.get(id=item_id)
        
        if request.user.is_authenticated:
            if item.cart.user != request.user:
                return Response(
                    {'error': 'Non autorisé'},
                    status=status.HTTP_403_FORBIDDEN
                )
            item.quantity = quantity
            item.save()
            serializer = CartSerializer(item.cart)
        else:
            session_key = request.session.session_key
            if item.anonymous_cart.session_key != session_key:
                return Response(
                    {'error': 'Non autorisé'},
                    status=status.HTTP_403_FORBIDDEN
                )
            item.quantity = quantity
            item.save()
            serializer = AnonymousCartSerializer(item.anonymous_cart)
        
        return Response(serializer.data)
    except CartItem.DoesNotExist:
        return Response(
            {'error': 'Article non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['DELETE'])
@permission_classes([AllowAny])
def clear_cart(request):
    """Vider le panier"""
    try:
        if request.user.is_authenticated:
            cart = Cart.objects.get(user=request.user)
            cart.items.all().delete()
            serializer = CartSerializer(cart)
        else:
            session_key = request.session.session_key
            cart = AnonymousCart.objects.get(session_key=session_key)
            cart.items.all().delete()
            serializer = AnonymousCartSerializer(cart)
        
        return Response(serializer.data)
    except (Cart.DoesNotExist, AnonymousCart.DoesNotExist):
        return Response(
            {'error': 'Panier non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )