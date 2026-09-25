"""Lectures de l'app commandes."""

from __future__ import annotations

from .models import Invoice, Order


def orders_for(user):
    """Commandes visibles par l'utilisateur (tout pour le personnel)."""
    queryset = Order.objects.with_details()
    return queryset if user.is_staff else queryset.for_user(user)


def get_order(user, order_id: int) -> Order | None:
    return orders_for(user).filter(pk=order_id).first()


def invoice_for(user, order_id: int) -> Invoice | None:
    return (
        Invoice.objects.select_related("order", "order__user")
        .prefetch_related("order__items")
        .filter(order_id=order_id, **({} if user.is_staff else {"order__user": user}))
        .first()
    )
