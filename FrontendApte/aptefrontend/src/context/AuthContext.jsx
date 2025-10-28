import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import apiClient from "../services/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🟢 Charger l'utilisateur au démarrage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiClient
        .get("users/me/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("refresh");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // 🟢 Inscription
  const register = async (formData) => {
    const response = await authService.register(formData);
    return response;
  };

  // 🟢 Connexion
  const login = async (formData) => {
    const response = await authService.login(formData);

    // Sauvegarde des tokens
    localStorage.setItem("token", response.data.access);
    localStorage.setItem("refresh", response.data.refresh);

    // ✅ Si ton backend ne renvoie pas `user`, on va chercher les infos
    try {
      const userResponse = await apiClient.get("users/me/", {
        headers: { Authorization: `Bearer ${response.data.access}` },
      });
      setUser(userResponse.data);
    } catch (error) {
      console.error("Impossible de récupérer l'utilisateur :", error);
      setUser({ email: formData.email }); // fallback minimal
    }

    return true;
  };

  // 🟢 Déconnexion
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Erreur pendant la déconnexion :", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
