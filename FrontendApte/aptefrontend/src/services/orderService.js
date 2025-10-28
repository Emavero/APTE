import apiClient from "./apiClient";

const orderService = {
  // Récupérer toutes les commandes
  getOrders: (params = {}) =>
    apiClient.get("orders/", {
      params,
      headers: { "Content-Type": "application/json" },
    }),

  // Récupérer les commandes avec pagination
  getOrdersWithPagination: (page = 1, pageSize = 10) =>
    apiClient.get("orders/", {
      params: { page, page_size: pageSize },
      headers: { "Content-Type": "application/json" },
    }),

  // Récupérer les détails d'une commande
  getOrderDetail: (orderId) =>
    apiClient.get(`orders/${orderId}/`, {
      headers: { "Content-Type": "application/json" },
    }),

  // Créer une commande (avec paiement)
  createOrder: (data) =>
    apiClient.post("orders/", data, {
      headers: { "Content-Type": "application/json" },
    }),
  
  // Mettre à jour une commande complète
  updateOrder: (orderId, data) =>
    apiClient.put(`orders/${orderId}/`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // Mettre à jour uniquement le statut
  updateOrderStatus: (orderId, status) =>
    apiClient.patch(`orders/${orderId}/`, { status }, {
      headers: { "Content-Type": "application/json" },
    }),

  // Annuler une commande
  cancelOrder: (orderId) =>
    apiClient.patch(`orders/${orderId}/`, { status: "canceled" }, {
      headers: { "Content-Type": "application/json" },
    }),

  // Supprimer une commande
  deleteOrder: (orderId) =>
    apiClient.delete(`orders/${orderId}/`, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🆕 Vérifier le statut d'un paiement Wave
  checkPaymentStatus: (orderId) =>
    apiClient.get(`orders/${orderId}/check-payment/`, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🆕 Récupérer les commandes par statut
  getOrdersByStatus: (status) =>
    apiClient.get("orders/", {
      params: { status },
      headers: { "Content-Type": "application/json" },
    }),

  // 🆕 Récupérer les commandes par méthode de paiement
  getOrdersByPaymentMethod: (paymentMethod) =>
    apiClient.get("orders/", {
      params: { payment_method: paymentMethod },
      headers: { "Content-Type": "application/json" },
    }),

};

export default orderService;