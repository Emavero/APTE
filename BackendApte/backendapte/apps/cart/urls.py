from django.urls import path

from .views import CartAddView, CartItemView, CartMergeView, CartView

app_name = "cart"

urlpatterns = [
    path("", CartView.as_view(), name="detail"),
    path("add/", CartAddView.as_view(), name="add"),
    path("clear/", CartView.as_view(), name="clear"),
    path("merge/", CartMergeView.as_view(), name="merge"),
    path("items/<int:product_id>/", CartItemView.as_view(), name="item"),
]
