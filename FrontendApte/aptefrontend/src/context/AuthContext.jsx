import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";
import { clearTokens, getAccessToken, setTokens } from "../services/apiClient";

export const AuthContext = createContext(null);

/**
 * État d'authentification de l'application.
 *
 * Ce fournisseur est monté une seule fois, dans main.jsx. Il l'était auparavant
 * deux fois (main.jsx et App.jsx), ce qui créait deux états indépendants : la
 * connexion mettait à jour l'un pendant que les composants lisaient l'autre.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!getAccessToken()) {
      setLoading(false);
      return undefined;
    }

    authService
      .getMe()
      .then(({ data }) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback((formData) => authService.register(formData), []);

  const login = useCallback(async (formData) => {
    const { data } = await authService.login(formData);
    setTokens({ access: data.access, refresh: data.refresh });

    const { data: profile } = await authService.getMe();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authService.getMe();
    setUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isStaff: Boolean(user?.is_staff),
      register,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, register, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  }
  return context;
};
