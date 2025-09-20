from django.urls import path
from .views import QuoteListCreateView, QuoteDetailView

urlpatterns = [
    path("", QuoteListCreateView.as_view(), name="quote-list-create"),
    path("<int:pk>/", QuoteDetailView.as_view(), name="quote-detail"),
]
