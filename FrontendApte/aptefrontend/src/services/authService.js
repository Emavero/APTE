import apiClient, { clearTokens, setTokens } from "./apiClient";

const authService = {
  register: (data) => apiClient.post("users/register/", data),

  login: (data) => apiClient.post("users/login/", data),

  /**
   * Déconnexion : le jeton de rafraîchissement est révoqué côté serveur avant
   * d'être effacé localement. L'effacer seulement en local le laisserait
   * utilisable jusqu'à son expiration.
   */
  logout: async () => {
    const refresh = localStorage.getItem("refresh");
    try {
      if (refresh) await apiClient.post("users/logout/", { refresh });
    } finally {
      clearTokens();
    }
  },

  getMe: () => apiClient.get("users/me/"),

  getListUsers: (params = {}) => apiClient.get("users/", { params }),

  updateProfile: (data) => apiClient.patch("users/me/", data),

  /** Changement de mot de passe : l'ancien est exigé par le serveur. */
  updatePassword: ({ currentPassword, newPassword }) =>
    apiClient.patch("users/me/", {
      current_password: currentPassword,
      password: newPassword,
    }),

  /** Étape 1 : demande d'envoi du lien de réinitialisation par e-mail. */
  requestPasswordReset: (email) => apiClient.post("users/reset-password/", { email }),

  /** Étape 2 : application du nouveau mot de passe via le jeton reçu. */
  confirmPasswordReset: ({ token, newPassword }) =>
    apiClient.post("users/reset-password/", { token, new_password: newPassword }),

  deleteAccount: () => apiClient.delete("users/delete/"),

  setTokens,
};

export default authService;
