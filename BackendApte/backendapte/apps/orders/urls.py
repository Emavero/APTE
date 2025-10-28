from django.urls import path
from .views import (
    OrderListCreateView, 
    OrderDetailView,
    wave_callback,
    check_payment_status
)

urlpatterns = [
    path("", OrderListCreateView.as_view(), name="order-list-create"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("wave-callback/", wave_callback, name="wave-callback"),
    path("<int:order_id>/check-payment/", check_payment_status, name="check-payment-status"),
]