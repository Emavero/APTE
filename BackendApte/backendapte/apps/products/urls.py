from django.urls import path

from .views import CategoryListCreateView, ProductDetailView, ProductListCreateView

app_name = "products"

urlpatterns = [
    path("", ProductListCreateView.as_view(), name="list"),
    path("categories/", CategoryListCreateView.as_view(), name="categories"),
    path("<int:pk>/", ProductDetailView.as_view(), name="detail"),
]
