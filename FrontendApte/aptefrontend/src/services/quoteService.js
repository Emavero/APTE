import apiClient from "./apiClient";

const quoteService = {
  // 🔹 Récupérer tous les devis
  getQuotes: () =>
    apiClient.get("quotes/", {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Récupérer un devis spécifique
  getQuoteDetail: (quoteId) =>
    apiClient.get(`quotes/${quoteId}/`, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Créer un nouveau devis
  createQuote: (data) =>
    apiClient.post("quotes/", data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Mettre à jour un devis
  updateQuote: (quoteId, data) =>
    apiClient.patch(`quotes/${quoteId}/`, data, {
      headers: { "Content-Type": "application/json" },
    }),

  // 🔹 Supprimer un devis
  deleteQuote: (quoteId) =>
    apiClient.delete(`quotes/${quoteId}/`, {
      headers: { "Content-Type": "application/json" },
    }),
};

export default quoteService;
