import apiClient from "./apiClient";

const quoteService = {
  getQuotes: (params = {}) => apiClient.get("quotes/", { params }),

  getQuoteDetail: (quoteId) => apiClient.get(`quotes/${quoteId}/`),

  /** L'estimation est chiffrée côté serveur depuis les prix catalogue. */
  createQuote: (data) => apiClient.post("quotes/", data),

  /** Traitement commercial du devis : réservé au personnel. */
  updateQuoteStatus: (quoteId, status) => apiClient.post(`quotes/${quoteId}/status/`, { status }),
};

export default quoteService;
