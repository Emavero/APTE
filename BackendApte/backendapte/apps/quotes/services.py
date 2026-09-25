"""Cas d'usage des devis."""

from __future__ import annotations

import logging

from django.db import transaction

from apps.common.exceptions import DomainError
from apps.common.money import money
from apps.common.validators import normalize_phone, validate_positive_quantity
from apps.products.models import Product

from .models import Quote, QuoteItem, QuoteStatus

logger = logging.getLogger(__name__)


@transaction.atomic
def create_quote(*, user=None, items: list[dict] | None = None, **fields) -> Quote:
    """Enregistre une demande de devis et chiffre l'estimation côté serveur."""
    items = items or []

    quantities: dict[int, int] = {}
    for raw in items:
        product = raw.get("product") or raw.get("product_id")
        product_id = getattr(product, "pk", product)
        if product_id is None:
            continue
        quantities[int(product_id)] = quantities.get(int(product_id), 0) + validate_positive_quantity(
            raw.get("quantity", 1)
        )

    products = {p.pk: p for p in Product.objects.filter(pk__in=quantities)}
    missing = sorted(set(quantities) - set(products))
    if missing:
        raise DomainError(
            "Certains produits sont introuvables.",
            code="unknown_product",
            details={"product_ids": missing},
        )

    if phone := fields.pop("contact_phone", None):
        fields["contact_phone"] = normalize_phone(phone) or ""

    quote = Quote.objects.create(user=user if (user and user.is_authenticated) else None, **fields)

    quote_items = [
        QuoteItem(
            quote=quote,
            product=products[product_id],
            product_name=products[product_id].name,
            unit_price=money(products[product_id].price),
            quantity=quantity,
            line_total=money(products[product_id].price * quantity),
        )
        for product_id, quantity in quantities.items()
    ]
    QuoteItem.objects.bulk_create(quote_items)

    quote.total_estimate = money(sum((item.line_total for item in quote_items), money(0)))
    quote.save(update_fields=["total_estimate", "updated_at"])

    logger.info(
        "Devis %s créé (%s lignes, estimation %s)",
        quote.reference,
        len(quote_items),
        quote.total_estimate,
    )
    return quote


@transaction.atomic
def set_status(quote: Quote, status: str) -> Quote:
    if status not in QuoteStatus.values:
        raise DomainError("Statut de devis inconnu.", code="unknown_status")
    quote.status = status
    quote.save(update_fields=["status", "updated_at"])
    return quote
