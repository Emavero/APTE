from django.urls import path
from .views import (
    QuoteListCreateView, QuoteDetailView,
    AdminQuoteListView, AdminQuoteDetailView
)

urlpatterns = [
    # Utilisateur
    path("", QuoteListCreateView.as_view(), name="quote-list-create"),
    path("<int:pk>/", QuoteDetailView.as_view(), name="quote-detail"),

    # Admin
    path("admin/quotes/", AdminQuoteListView.as_view(), name="admin-quote-list"),
    path("admin/quotes/<int:pk>/", AdminQuoteDetailView.as_view(), name="admin-quote-detail"),
]
