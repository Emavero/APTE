import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import cartService from "../services/cartService";
import { cartTotal } from "../utils/currency";
import { useAuth } from "./AuthContext";

export const CartContext = createContext(null);

/**
 * Panier de l'application.
 *
 * Le backend gère aussi bien le panier anonyme (via la session) que celui d'un
 * compte : il est donc la seule source de vérité dans les deux cas. L'ancienne
 * version tenait un panier localStorage en parallèle, ce qui produisait des
 * totaux divergents entre le panier affiché et la commande enregistrée.
 * localStorage ne sert plus que de repli hors ligne, en lecture seule.
 */

const OFFLINE_CACHE_KEY = "cart";

function readOfflineCache() {
  try {
    const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function writeOfflineCache(items) {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(items));
  } catch {
    // Quota dépassé ou stockage désactivé : le panier serveur reste la référence.
  }
}

function normalizeItems(cart) {
  return (cart?.items ?? []).map((item) => ({
    id: item.id,
    product: item.product,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));
}

export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wasAuthenticated = useRef(false);

  const applyCart = useCallback((cart) => {
    const items = normalizeItems(cart);
    setCartItems(items);
    writeOfflineCache(items);
    return items;
  }, []);

  const loadCart = useCallback(async () => {
    try {
      const { data } = await cartService.getCart();
      applyCart(data);
      setError(null);
    } catch {
      // Serveur injoignable : on affiche le dernier panier connu plutôt qu'un
      // panier vide, qui laisserait croire à une perte de données.
      setCartItems(readOfflineCache());
      setError("Panier indisponible pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [applyCart]);

  // La fusion du panier anonyme n'a lieu qu'à la transition vers l'état connecté.
  useEffect(() => {
    if (authLoading) return;

    const justLoggedIn = isAuthenticated && !wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;

    if (justLoggedIn) {
      cartService
        .mergeCart()
        .then(({ data }) => applyCart(data))
        .catch(() => loadCart())
        .finally(() => setLoading(false));
      return;
    }

    loadCart();
  }, [authLoading, isAuthenticated, applyCart, loadCart]);

  const withCart = useCallback(
    async (operation) => {
      try {
        const { data } = await operation();
        setError(null);
        return applyCart(data);
      } catch (err) {
        setError(err?.response?.data?.detail || "Action impossible sur le panier.");
        throw err;
      }
    },
    [applyCart],
  );

  const addToCart = useCallback(
    (product, quantity = 1) => withCart(() => cartService.addToCart(product.id, quantity)),
    [withCart],
  );

  const updateQuantity = useCallback(
    (productId, quantity) =>
      quantity <= 0
        ? withCart(() => cartService.removeFromCart(productId))
        : withCart(() => cartService.updateCartItem(productId, quantity)),
    [withCart],
  );

  const removeFromCart = useCallback(
    (productId) => withCart(() => cartService.removeFromCart(productId)),
    [withCart],
  );

  const clearCart = useCallback(() => withCart(() => cartService.clearCart()), [withCart]);

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      reloadCart: loadCart,
      cartCount: cartItems.reduce((count, item) => count + item.quantity, 0),
      cartTotal: cartTotal(cartItems),
    }),
    [cartItems, loading, error, addToCart, removeFromCart, updateQuantity, clearCart, loadCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error("useCart doit être utilisé à l'intérieur de <CartProvider>.");
  }
  return context;
};
