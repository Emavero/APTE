import apiClient from "./apiClient";

/**
 * Les lignes de panier sont adressées par produit et non par identifiant de
 * ligne : le client connaît le produit qu'il manipule, et cela rend impossible
 * de viser la ligne d'un autre panier.
 */
const cartService = {
  getCart: () => apiClient.get("cart/"),

  addToCart: (productId, quantity = 1) =>
    apiClient.post("cart/add/", { product_id: productId, quantity }),

  updateCartItem: (productId, quantity) =>
    apiClient.patch(`cart/items/${productId}/`, { quantity }),

  removeFromCart: (productId) => apiClient.delete(`cart/items/${productId}/`),

  clearCart: () => apiClient.delete("cart/clear/"),

  /** Reprend le panier anonyme dans le compte, à appeler après connexion. */
  mergeCart: () => apiClient.post("cart/merge/"),
};

export default cartService;
