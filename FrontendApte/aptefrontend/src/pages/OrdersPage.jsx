import { useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaCheck, FaFileInvoice, FaRedo, FaTimes } from "react-icons/fa";

import Navbar from "../components/layout/Navbar/Navbar";
import Footer from "../components/layout/Footer";
import Order from "./Order";
import { CartContext } from "../context/CartContext";
import orderService from "../services/orderService";
import { formatMoney } from "../utils/currency";

/**
 * Espace « Mes commandes ».
 *
 * La route /orders rendait auparavant le composant `Order` sans ses props
 * `isOpen`/`onClose` : la modale retournait null et la page restait blanche.
 * Cette page fournit la liste des commandes, leurs factures, et sert de page de
 * retour après un paiement Wave (/orders/:orderId).
 */

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  awaiting_payment: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const { orderId } = useParams();
  const { cartItems } = useContext(CartContext);

  const [orderPopup, setOrderPopup] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await orderService.getOrders();
      setOrders(data.results ?? data ?? []);
      setError(null);
    } catch {
      setError("Impossible de charger vos commandes pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Retour depuis Wave : le webhook peut arriver après le navigateur, on
  // interroge donc le prestataire pour resynchroniser la commande.
  useEffect(() => {
    if (!orderId) return;
    orderService
      .checkPaymentStatus(orderId)
      .then(() => loadOrders())
      .catch(() => {});
  }, [orderId, loadOrders]);

  const handleCancel = async (id) => {
    setBusyOrderId(id);
    try {
      await orderService.cancelOrder(id);
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.detail || "Annulation impossible.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRetryPayment = async (id) => {
    setBusyOrderId(id);
    try {
      const { data } = await orderService.restartPayment(id);
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.detail || "Paiement indisponible pour le moment.");
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 dark:text-white duration-200 min-h-screen flex flex-col">
      <Navbar handleOrderPopup={() => setOrderPopup(true)} cartItems={cartItems} />

      <main className="container mx-auto px-4 py-10 flex-grow">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Mes commandes
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>
            Chargement...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Vous n'avez encore passé aucune commande.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Commande #{order.id}
                      {order.invoice?.number && (
                        <span className="text-gray-500 dark:text-gray-400 font-normal">
                          {" "}
                          — Facture {order.invoice.number}
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")} ·{" "}
                      {order.payment_method === "wave" ? "Wave" : "Paiement à la livraison"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      STATUS_STYLES[order.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status_display || order.status}
                  </span>
                </header>

                <ul className="space-y-1 mb-4">
                  {(order.items || []).map((item) => (
                    <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{item.product_name}</span> × {item.quantity}
                      <span className="text-gray-500 dark:text-gray-400">
                        {" "}
                        — {formatMoney(item.line_total)}
                      </span>
                    </li>
                  ))}
                </ul>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    Total : <span className="text-blue-600">{formatMoney(order.total_price)}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.invoice?.number && (
                      <a
                        href={orderService.getInvoicePrintUrl(order.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        <FaFileInvoice /> Facture
                      </a>
                    )}

                    {order.payment_url && (
                      <button
                        type="button"
                        onClick={() => handleRetryPayment(order.id)}
                        disabled={busyOrderId === order.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
                      >
                        <FaRedo /> Reprendre le paiement
                      </button>
                    )}

                    {["pending", "awaiting_payment"].includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(order.id)}
                        disabled={busyOrderId === order.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
                      >
                        <FaTimes /> Annuler
                      </button>
                    )}

                    {order.status === "paid" && (
                      <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-semibold">
                        <FaCheck /> Payée
                      </span>
                    )}
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>

      <Order
        isOpen={orderPopup}
        onClose={() => setOrderPopup(false)}
        onOrderPlaced={loadOrders}
      />

      <Footer />
    </div>
  );
}
