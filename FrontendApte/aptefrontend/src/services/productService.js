import apiClient from "./apiClient";

const productService = {
  getProducts: (params = {}) =>
    apiClient.get("products/", {
      params,
      headers: { "Content-Type": "application/json" },
    }),

  searchProducts: (query) =>
    apiClient.get("products/", {
      params: { search: query },
      headers: { "Content-Type": "application/json" },
    }),

  getProductsByCategory: (categoryId) =>
    apiClient.get("products/", {
      params: { category: categoryId },
      headers: { "Content-Type": "application/json" },
    }),

  getProductsWithPagination: (page = 1, pageSize = 12) =>
    apiClient.get("products/", {
      params: { page, page_size: pageSize },
      headers: { "Content-Type": "application/json" },
    }),

  getProductDetail: (productId) =>
    apiClient.get(`products/${productId}/`, {
      headers: { "Content-Type": "application/json" },
    }),

  createProduct: (data) =>
    apiClient.post("products/", data), // pas de Content-Type

  updateProduct: (productId, data) =>
    apiClient.patch(`products/${productId}/`, data), // pas de Content-Type

  deleteProduct: (productId) =>
    apiClient.delete(`products/${productId}/`)
};

export default productService;