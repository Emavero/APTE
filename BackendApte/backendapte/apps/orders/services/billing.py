"""Facturation : calcul des totaux et émission des factures.

Ce module est la seule autorité sur les montants. Il ne connaît ni HTTP ni
prestataire de paiement, ce qui permet de tester la comptabilité de bout en bout
sans base de données ni réseau pour la partie calcul.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.common.exceptions import ConflictError
from apps.common.money import currency_code, money, split_tax_inclusive, to_decimal

from ..models import Invoice, InvoiceSequence, InvoiceStatus, Order

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------- totaux
@dataclass(frozen=True)
class LineTotals:
    """Total d'une ligne, calculé une seule fois et réutilisé partout."""

    unit_price: Decimal
    quantity: int
    line_total: Decimal

    @classmethod
    def build(cls, unit_price, quantity: int) -> LineTotals:
        quantity = int(quantity)
        unit_price = money(unit_price)
        # On multiplie sur des Decimal puis on quantifie une seule fois :
        # quantifier le prix unitaire *et* le total ferait un double arrondi.
        return cls(unit_price=unit_price, quantity=quantity, line_total=money(unit_price * quantity))


@dataclass(frozen=True)
class OrderTotals:
    items_total: Decimal
    shipping_amount: Decimal
    discount_amount: Decimal
    total: Decimal
    subtotal_excl_tax: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    currency: str


def tax_rate() -> Decimal:
    return to_decimal(getattr(settings, "BILLING_TAX_RATE", "0"))


def shipping_amount_for(items_total: Decimal) -> Decimal:
    """Frais de port. Gratuits par défaut, comme annoncé dans le panier."""
    if getattr(settings, "BILLING_FREE_SHIPPING", True):
        return money(0)
    return money(getattr(settings, "BILLING_SHIPPING_FLAT_FEE", "0"))


def compute_order_totals(lines: list[LineTotals], *, discount_amount=Decimal("0")) -> OrderTotals:
    """Assemble les totaux d'une commande à partir de ses lignes.

    Les prix catalogue étant TTC, la TVA est **extraite** du total (et non
    ajoutée) : le montant payé par le client est exactement la somme des lignes,
    quel que soit le taux appliqué.
    """
    items_total = money(sum((line.line_total for line in lines), Decimal("0")))
    shipping = shipping_amount_for(items_total)
    discount = money(discount_amount)
    if discount > items_total + shipping:
        raise ConflictError("La remise dépasse le montant de la commande.", code="invalid_discount")

    total = money(items_total + shipping - discount)
    rate = tax_rate()

    if getattr(settings, "BILLING_PRICES_INCLUDE_TAX", True):
        net, tax = split_tax_inclusive(total, rate)
    else:
        net = total
        tax = money(total * rate)
        total = money(net + tax)

    return OrderTotals(
        items_total=items_total,
        shipping_amount=shipping,
        discount_amount=discount,
        total=total,
        subtotal_excl_tax=net,
        tax_rate=rate,
        tax_amount=tax,
        currency=currency_code(),
    )


def apply_totals(order: Order, totals: OrderTotals) -> Order:
    order.items_total = totals.items_total
    order.shipping_amount = totals.shipping_amount
    order.discount_amount = totals.discount_amount
    order.total_price = totals.total
    order.currency = totals.currency
    order.save(
        update_fields=[
            "items_total",
            "shipping_amount",
            "discount_amount",
            "total_price",
            "currency",
            "updated_at",
        ]
    )
    return order


# --------------------------------------------------------------- numérotation
def allocate_invoice_number(*, at=None) -> str:
    """Attribue le prochain numéro de facture de l'année, sans trou ni doublon.

    Doit être appelé dans une transaction : le verrou de ligne n'est relâché
    qu'au commit.
    """
    moment = at or timezone.now()
    year = moment.year
    prefix = getattr(settings, "BILLING_INVOICE_PREFIX", "APTE")

    sequence, _ = InvoiceSequence.objects.get_or_create(year=year)
    sequence = InvoiceSequence.objects.select_for_update().get(pk=sequence.pk)
    sequence.last_value += 1
    sequence.save(update_fields=["last_value"])

    return f"{prefix}-{year}-{sequence.last_value:05d}"


# ------------------------------------------------------------------- émission
def _seller_snapshot() -> dict:
    return dict(getattr(settings, "COMPANY_INFO", {}) or {})


@transaction.atomic
def issue_invoice(order: Order, *, totals: OrderTotals | None = None) -> Invoice:
    """Émet la facture d'une commande (idempotent : une facture par commande)."""
    existing = Invoice.objects.filter(order=order).first()
    if existing is not None:
        return existing

    if totals is None:
        lines = [
            LineTotals(unit_price=item.unit_price, quantity=item.quantity, line_total=item.line_total)
            for item in order.items.all()
        ]
        totals = compute_order_totals(lines, discount_amount=order.discount_amount)

    issued_at = timezone.now()
    due_days = int(getattr(settings, "BILLING_INVOICE_DUE_DAYS", 0) or 0)

    invoice = Invoice.objects.create(
        order=order,
        number=allocate_invoice_number(at=issued_at),
        status=InvoiceStatus.PAID if order.is_settled else InvoiceStatus.ISSUED,
        issued_at=issued_at,
        due_at=issued_at + timedelta(days=due_days) if due_days else None,
        paid_at=order.paid_at,
        currency=totals.currency,
        subtotal_excl_tax=totals.subtotal_excl_tax,
        tax_rate=totals.tax_rate,
        tax_amount=totals.tax_amount,
        shipping_amount=totals.shipping_amount,
        discount_amount=totals.discount_amount,
        total_incl_tax=totals.total,
        customer_name=order.delivery_name or getattr(order.user, "display_name", ""),
        customer_email=order.user.email or "",
        customer_phone=order.delivery_phone or (order.user.phone or ""),
        billing_address=order.delivery_address,
        billing_city=order.delivery_city,
        seller_snapshot=_seller_snapshot(),
    )

    if not invoice.is_balanced:  # pragma: no cover - garde-fou comptable
        raise ConflictError("Incohérence comptable détectée sur la facture.", code="unbalanced_invoice")

    logger.info("Facture %s émise pour la commande #%s", invoice.number, order.pk)
    return invoice


def mark_invoice_paid(invoice: Invoice, *, paid_at=None) -> Invoice:
    if invoice.status == InvoiceStatus.PAID:
        return invoice
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = paid_at or timezone.now()
    invoice.save(update_fields=["status", "paid_at", "updated_at"])
    return invoice


def mark_invoice_canceled(invoice: Invoice) -> Invoice:
    """Annule une facture sans la détruire : une pièce comptable se conserve."""
    if invoice.status == InvoiceStatus.CANCELED:
        return invoice
    invoice.status = InvoiceStatus.CANCELED
    invoice.save(update_fields=["status", "updated_at"])
    return invoice
