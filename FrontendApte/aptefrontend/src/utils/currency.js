/**
 * Formatage monétaire de l'application.
 *
 * Le franc CFA n'a pas de sous-unité : afficher « 25000.00 FCFA » est incorrect.
 * Les montants sont donc arrondis à l'unité et groupés par milliers, ce qui
 * correspond aussi à la façon dont le backend calcule et facture.
 */

export const CURRENCY_SYMBOL = "FCFA";
const CURRENCY_DECIMALS = 0;

const formatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: CURRENCY_DECIMALS,
  maximumFractionDigits: CURRENCY_DECIMALS,
});

/** Convertit une valeur d'API (nombre ou chaîne décimale) en nombre sûr. */
export function toAmount(value) {
  const amount = typeof value === "number" ? value : Number.parseFloat(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

/** « 25 000 FCFA » */
export function formatMoney(value) {
  return `${formatter.format(toAmount(value))} ${CURRENCY_SYMBOL}`;
}

/** Montant sans symbole, pour les cas où l'unité est déjà affichée. */
export function formatAmount(value) {
  return formatter.format(toAmount(value));
}

/** Total d'une liste de lignes de panier, calculé en unités entières. */
export function cartTotal(items = []) {
  return items.reduce(
    (total, item) => total + toAmount(item?.product?.price) * (Number(item?.quantity) || 0),
    0,
  );
}
