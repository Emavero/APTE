from django.urls import path
from .views import (
    get_cart,
    add_to_cart,
    remove_from_cart,
    update_cart_item,
    clear_cart
)

urlpatterns = [
    path('', get_cart, name='get-cart'),
    path('add/', add_to_cart, name='add-to-cart'),
    path('remove/<int:item_id>/', remove_from_cart, name='remove-from-cart'),
    path('update/<int:item_id>/', update_cart_item, name='update-cart-item'),
    path('clear/', clear_cart, name='clear-cart'),
]