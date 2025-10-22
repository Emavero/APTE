import apiClient from "./apiClient";

const cartService = {
  // Récupérer le panier (authentifié ou anonyme)
  getCart: () =>
    apiClient.get("cart/", {
      headers: { "Content-Type": "application/json" },
    }),

  // Ajouter un produit au panier
  addToCart: (productId, quantity = 1) =>
    apiClient.post("cart/add/", { product_id: productId, quantity }, {
      headers: { "Content-Type": "application/json" },
    }),

  // Supprimer un article du panier
  removeFromCart: (itemId) =>
    apiClient.delete(`cart/remove/${itemId}/`, {
      headers: { "Content-Type": "application/json" },
    }),

  // Mettre à jour la quantité
  updateCartItem: (itemId, quantity) =>
    apiClient.patch(`cart/update/${itemId}/`, { quantity }, {
      headers: { "Content-Type": "application/json" },
    }),

  // Vider le panier
  clearCart: () =>
    apiClient.delete("cart/clear/", {
      headers: { "Content-Type": "application/json" },
    }),
};

export default cartService;