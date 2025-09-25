import { createContext, useContext, useState } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const register = async (formData) => {
    const response = await authService.register(formData);
    return response;
  };

  const login = async (formData) => {
    const response = await authService.login(formData);
    // Sauvegarde le token JWT
    localStorage.setItem("token", response.data.access);
    localStorage.setItem("refresh", response.data.refresh);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
