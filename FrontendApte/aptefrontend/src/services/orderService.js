import apiClient from "./apiClient";

const orderService = {
  getOrders: (params = {}) => apiClient.get("orders/", { params }),

  getOrdersWithPagination: (page = 1, pageSize = 10) =>
    apiClient.get("orders/", { params: { page, page_size: pageSize } }),

  getOrderDetail: (orderId) => apiClient.get(`orders/${orderId}/`),

  /** Crée la commande. Les montants sont calculés et facturés côté serveur. */
  createOrder: (data) => apiClient.post("orders/", data),

  cancelOrder: (orderId) => apiClient.post(`orders/${orderId}/cancel/`),

  /** Changement de statut : réservé au personnel. */
  updateOrderStatus: (orderId, status, reason = "") =>
    apiClient.post(`orders/${orderId}/status/`, { status, reason }),

  /** Réouvre une session de paiement (abandon, expiration, webhook perdu). */
  restartPayment: (orderId) => apiClient.post(`orders/${orderId}/pay/`),

  checkPaymentStatus: (orderId) => apiClient.get(`orders/${orderId}/check-payment/`),

  getInvoice: (orderId) => apiClient.get(`orders/${orderId}/invoice/`),

  /** URL absolue de la facture imprimable (à ouvrir dans un onglet). */
  getInvoicePrintUrl: (orderId) =>
    new URL(`orders/${orderId}/invoice/print/`, apiClient.defaults.baseURL).toString(),

  getOrdersByStatus: (status) => apiClient.get("orders/", { params: { status } }),

  getOrdersByPaymentMethod: (paymentMethod) =>
    apiClient.get("orders/", { params: { payment_method: paymentMethod } }),
};

export default orderService;
