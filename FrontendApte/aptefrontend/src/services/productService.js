import apiClient from "./apiClient";

const productService = {
  getProducts: (params = {}) => apiClient.get("products/", { params }),

  searchProducts: (query) => apiClient.get("products/", { params: { search: query } }),

  getProductsByCategory: (categoryId) =>
    apiClient.get("products/", { params: { category: categoryId } }),

  getProductsWithPagination: (page = 1, pageSize = 12) =>
    apiClient.get("products/", { params: { page, page_size: pageSize } }),

  getProductDetail: (productId) => apiClient.get(`products/${productId}/`),

  getCategories: () => apiClient.get("products/categories/"),

  // Les envois multipart laissent axios fixer la frontière du Content-Type.
  createProduct: (data) => apiClient.post("products/", data),

  updateProduct: (productId, data) => apiClient.patch(`products/${productId}/`, data),

  deleteProduct: (productId) => apiClient.delete(`products/${productId}/`),
};

export default productService;
