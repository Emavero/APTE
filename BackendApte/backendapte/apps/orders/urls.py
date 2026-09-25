from django.urls import path

from .views import (
    InvoiceDetailView,
    InvoicePrintView,
    OrderCancelView,
    OrderDetailView,
    OrderListCreateView,
    OrderStatusUpdateView,
    PaymentRestartView,
    PaymentStatusView,
    wave_callback,
)

app_name = "orders"

urlpatterns = [
    path("", OrderListCreateView.as_view(), name="list-create"),
    path("wave-callback/", wave_callback, name="wave-callback"),
    path("<int:pk>/", OrderDetailView.as_view(), name="detail"),
    path("<int:pk>/cancel/", OrderCancelView.as_view(), name="cancel"),
    path("<int:pk>/status/", OrderStatusUpdateView.as_view(), name="status"),
    path("<int:pk>/pay/", PaymentRestartView.as_view(), name="pay"),
    path("<int:pk>/check-payment/", PaymentStatusView.as_view(), name="check-payment"),
    path("<int:pk>/invoice/", InvoiceDetailView.as_view(), name="invoice"),
    path("<int:pk>/invoice/print/", InvoicePrintView.as_view(), name="invoice-print"),
]
