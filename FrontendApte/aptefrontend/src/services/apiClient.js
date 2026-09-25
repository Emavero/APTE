import axios from "axios";

/**
 * Client HTTP unique de l'application.
 *
 * Deux responsabilités : porter le jeton d'accès, et renouveler ce jeton quand
 * il expire. Sans ce renouvellement, l'utilisateur était déconnecté dès la fin
 * de vie du jeton d'accès, même avec un jeton de rafraîchissement valide.
 */

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export const API_BASE_URL = `${API_ROOT}/api/`;

export const TOKEN_KEY = "token";
export const REFRESH_KEY = "refresh";

/** Routes publiques : y envoyer un Authorization périmé provoque un 401 inutile. */
const PUBLIC_PATHS = [
  "users/register/",
  "users/login/",
  "users/token/refresh/",
  "users/reset-password/",
];

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Nécessaire pour le panier anonyme, qui repose sur le cookie de session.
  withCredentials: true,
});

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function isPublicPath(url = "") {
  return PUBLIC_PATHS.some((path) => url.includes(path));
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isPublicPath(config.url || "")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Un seul rafraîchissement à la fois : plusieurs requêtes qui échouent en même
// temps doivent attendre le même appel, pas en déclencher un chacune.
let refreshPromise = null;

function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return Promise.reject(new Error("no-refresh-token"));

  refreshPromise =
    refreshPromise ||
    axios
      .post(`${API_BASE_URL}users/token/refresh/`, { refresh })
      .then(({ data }) => {
        setTokens({ access: data.access, refresh: data.refresh });
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });

  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const canRetry =
      response?.status === 401 && config && !config._retried && !isPublicPath(config.url || "");

    if (!canRetry) return Promise.reject(error);

    config._retried = true;
    try {
      const access = await refreshAccessToken();
      config.headers = { ...config.headers, Authorization: `Bearer ${access}` };
      return apiClient(config);
    } catch {
      // Le rafraîchissement a échoué : la session est bel et bien terminée.
      clearTokens();
      return Promise.reject(error);
    }
  },
);

export default apiClient;
