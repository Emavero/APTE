"""Cas d'usage « passer commande ».

Invariants garantis par ce module :

1. Les prix sont relus **en base** au moment de la commande : un prix envoyé par
   le client n'est jamais pris en compte.
2. Le stock est verrouillé (``select_for_update``) puis décrémenté dans la même
   transaction que la commande : deux acheteurs simultanés ne peuvent pas acheter
   le même dernier article.
3. Une facture est émise pour toute commande créée.
4. L'annulation restitue le stock exactement une fois.
"""

from __future__ import annotations

import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from apps.common.exceptions import ConflictError, DomainError, InsufficientStockError, InvalidTransitionError
from apps.common.validators import normalize_phone, validate_positive_quantity
from apps.products.models import Product

from ..models import Invoice, Order, OrderItem, OrderStatus, PaymentMethod
from . import billing

logger = logging.getLogger(__name__)


def _consolidate(raw_items: list[dict]) -> dict[int, int]:
    """Regroupe les quantités par produit (un client peut envoyer deux fois la même ligne)."""
    quantities: dict[int, int] = {}
    for raw in raw_items:
        product_id = raw.get("product_id") or raw.get("product")
        if product_id is None:
            raise DomainError("Chaque ligne doit référencer un produit.", code="missing_product")
        quantity = validate_positive_quantity(raw.get("quantity", 1))
        quantities[int(product_id)] = quantities.get(int(product_id), 0) + quantity
    if not quantities:
        raise DomainError("La commande doit contenir au moins un article.", code="empty_order")
    return quantities


def _lock_products(quantities: dict[int, int]) -> dict[int, Product]:
    """Verrouille les produits commandés, dans un ordre stable (anti-interblocage)."""
    products = {
        product.pk: product
        for product in Product.objects.select_for_update().filter(pk__in=sorted(quantities)).order_by("pk")
    }
    missing = sorted(set(quantities) - set(products))
    if missing:
        raise DomainError(
            "Certains produits sont introuvables.",
            code="unknown_product",
            details={"product_ids": missing},
        )
    return products


@transaction.atomic
def place_order(
    *,
    user,
    items: list[dict],
    payment_method: str,
    delivery: dict,
    phone_number: str | None = None,
    discount_amount: Decimal = Decimal("0"),
) -> Order:
    """Crée une commande, réserve le stock et émet la facture."""
    quantities = _consolidate(items)
    products = _lock_products(quantities)

    lines: list[billing.LineTotals] = []
    order_items: list[OrderItem] = []

    for product_id, quantity in quantities.items():
        product = products[product_id]

        if not product.is_active:
            raise ConflictError(
                f"« {product.name} » n'est plus disponible à la vente.",
                code="product_unavailable",
            )
        if not product.has_stock_for(quantity):
            raise InsufficientStockError(
                f"Stock insuffisant pour « {product.name} » "
                f"({product.stock} disponible(s), {quantity} demandé(s)).",
                details={"product_id": product_id, "available": product.stock, "requested": quantity},
            )

        line = billing.LineTotals.build(product.price, quantity)
        lines.append(line)
        order_items.append(
            OrderItem(
                product=product,
                product_name=product.name,
                unit_price=line.unit_price,
                quantity=line.quantity,
                line_total=line.line_total,
            )
        )

    totals = billing.compute_order_totals(lines, discount_amount=discount_amount)

    method = payment_method or PaymentMethod.CASH
    if method not in PaymentMethod.values:
        raise DomainError("Mode de paiement inconnu.", code="unknown_payment_method")

    normalized_phone = normalize_phone(phone_number) if method == PaymentMethod.WAVE else ""
    if method == PaymentMethod.WAVE and not normalized_phone:
        raise DomainError("Le numéro Wave est requis pour ce mode de paiement.", code="missing_payment_phone")

    order = Order.objects.create(
        user=user,
        status=OrderStatus.PENDING,
        payment_method=method,
        phone_number=normalized_phone or "",
        delivery_name=delivery["name"],
        delivery_phone=normalize_phone(delivery["phone"]) or "",
        delivery_address=delivery["address"],
        delivery_city=delivery["city"],
        delivery_notes=delivery.get("notes") or "",
        currency=totals.currency,
        items_total=totals.items_total,
        shipping_amount=totals.shipping_amount,
        discount_amount=totals.discount_amount,
        total_price=totals.total,
    )

    for item in order_items:
        item.order = order
    OrderItem.objects.bulk_create(order_items)

    # Décrément atomique via F() : la valeur est calculée par la base, donc
    # jamais écrasée par une lecture obsolète.
    for product_id, quantity in quantities.items():
        updated = Product.objects.filter(pk=product_id, stock__gte=quantity).update(
            stock=F("stock") - quantity
        )
        if not updated:  # pragma: no cover - couvert par le verrou ci-dessus
            raise InsufficientStockError(f"Stock insuffisant pour « {products[product_id].name} ».")

    billing.issue_invoice(order, totals=totals)

    logger.info(
        "Commande #%s créée pour l'utilisateur #%s (%s %s, %s)",
        order.pk,
        user.pk,
        order.total_price,
        order.currency,
        method,
    )
    return order


@transaction.atomic
def transition(order: Order, new_status: str, *, reason: str = "") -> Order:
    """Applique un changement de statut en respectant la machine à états."""
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status == new_status:
        return order
    if not order.can_transition_to(new_status):
        raise InvalidTransitionError(
            f"Impossible de passer de « {order.get_status_display()} » à « {new_status} ».",
            details={"from": order.status, "to": new_status},
        )

    previous_status = order.status
    order.status = new_status
    fields = ["status", "updated_at"]

    if new_status == OrderStatus.PAID and order.paid_at is None:
        order.paid_at = timezone.now()
        fields.append("paid_at")
    if new_status in {OrderStatus.CANCELED, OrderStatus.REFUNDED}:
        order.canceled_at = timezone.now()
        fields.append("canceled_at")

    order.save(update_fields=fields)

    # Le stock n'est restitué que si la commande le retenait encore : c'est ce qui
    # rend l'annulation idempotente.
    if new_status in {OrderStatus.CANCELED, OrderStatus.REFUNDED} and previous_status in (
        OrderStatus.PENDING,
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.PAID,
        OrderStatus.SHIPPED,
        OrderStatus.COMPLETED,
    ):
        restock(order)

    invoice = Invoice.objects.filter(order=order).first()
    if invoice is not None:
        if new_status == OrderStatus.PAID:
            billing.mark_invoice_paid(invoice, paid_at=order.paid_at)
        elif new_status in {OrderStatus.CANCELED, OrderStatus.REFUNDED}:
            billing.mark_invoice_canceled(invoice)

    logger.info(
        "Commande #%s: %s -> %s%s", order.pk, previous_status, new_status, f" ({reason})" if reason else ""
    )
    return order


def restock(order: Order) -> None:
    """Restitue au catalogue les quantités réservées par la commande."""
    for item in order.items.all():
        Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)
    logger.info("Stock restitué pour la commande #%s", order.pk)


def cancel_order(order: Order, *, reason: str = "") -> Order:
    """Annule une commande non encore réglée."""
    if order.is_settled:
        raise ConflictError(
            "Une commande déjà payée ne peut pas être annulée depuis l'espace client. "
            "Contactez le service client.",
            code="order_already_paid",
        )
    return transition(order, OrderStatus.CANCELED, reason=reason or "annulation client")
