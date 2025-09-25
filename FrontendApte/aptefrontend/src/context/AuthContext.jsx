import { createContext, useState, useEffect } from "react";
import apiClient from "../services/apiClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Charger l'utilisateur connecté si token existant
  useEffect(() => {
    if (token) {
      apiClient
        .get("/users/me/")  // endpoint pour récupérer l'utilisateur
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, [token]);

  // Connexion
  const login = async (email, password) => {
    try {
      const res = await apiClient.post("/users/login/", { email, password });
      localStorage.setItem("token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setToken(res.data.access);

      // récupérer l'utilisateur connecté
      const userRes = await apiClient.get("/users/me/");
      setUser(userRes.data);
    } catch (err) {
      throw err;
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  };

  // Inscription
  const register = async (data) => {
    try {
      await apiClient.post("/users/register/", data);
    } catch (err) {
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
