from django.urls import path

from .views import QuoteDetailView, QuoteListCreateView, QuoteStatusView

app_name = "quotes"

urlpatterns = [
    path("", QuoteListCreateView.as_view(), name="list-create"),
    path("<int:pk>/", QuoteDetailView.as_view(), name="detail"),
    path("<int:pk>/status/", QuoteStatusView.as_view(), name="status"),
]
