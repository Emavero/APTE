import apiClient from "./apiClient";

const orderService = {
  getOrders: (params = {}) =>
    apiClient.get("orders/", {
      params,
      headers: { "Content-Type": "application/json" },
    }),

  getOrdersWithPagination: (page = 1, pageSize = 10) =>
    apiClient.get("orders/", {
      params: { page, page_size: pageSize },
      headers: { "Content-Type": "application/json" },
    }),

  getOrderDetail: (orderId) =>
    apiClient.get(`orders/${orderId}/`, {
      headers: { "Content-Type": "application/json" },
    }),

  createOrder: (data) =>
    apiClient.post("orders/", data, {
      headers: { "Content-Type": "application/json" },
    }),

  updateOrder: (orderId, data) =>
    apiClient.put(`orders/${orderId}/`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  updateOrderStatus: (orderId, status) =>
    apiClient.patch(`orders/${orderId}/`, { status }, {
      headers: { "Content-Type": "application/json" },
    }),

  cancelOrder: (orderId) =>
    apiClient.patch(`orders/${orderId}/`, { status: "canceled" }, {
      headers: { "Content-Type": "application/json" },
    }),

  deleteOrder: (orderId) =>
    apiClient.delete(`orders/${orderId}/`, {
      headers: { "Content-Type": "application/json" },
    }),
};

export default orderService;