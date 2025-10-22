import React, { createContext, useState, useEffect } from 'react';
import cartService from '../services/cartService';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
    
    if (isAuth) {
      // Utilisateur connecté : charger du backend
      loadCartFromBackend();
    } else {
      // Utilisateur non connecté : charger du localStorage
      loadCartFromLocalStorage();
    }
  }, []);

  // Charger du backend (utilisateurs connectés)
  const loadCartFromBackend = async () => {
    try {
      const response = await cartService.getCart();
      const items = response.data.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        id: item.id
      }));
      setCartItems(items);
      console.log('Panier chargé du backend:', items);
    } catch (error) {
      console.error('Erreur chargement panier backend:', error);
      // Fallback sur localStorage
      loadCartFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Charger du localStorage (utilisateurs non connectés)
  const loadCartFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCartItems(parsed);
        console.log('Panier chargé du localStorage:', parsed);
      }
    } catch (error) {
      console.error('Erreur chargement localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans localStorage pour utilisateurs non connectés
  useEffect(() => {
    if (!isAuthenticated && cartItems.length >= 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      console.log('Panier sauvegardé localStorage:', cartItems);
    }
  }, [cartItems, isAuthenticated]);

  const addToCart = async (product, quantity = 1) => {
    try {
      if (isAuthenticated) {
        // Envoyer au backend
        const response = await cartService.addToCart(product.id, quantity);
        const items = response.data.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          id: item.id
        }));
        setCartItems(items);
        console.log('Produit ajouté au backend:', product.name);
      } else {
        // Ajouter au localStorage
        setCartItems(prev => {
          const exists = prev.find(item => item.product.id === product.id);
          let updated;
          
          if (exists) {
            updated = prev.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            updated = [...prev, { product, quantity }];
          }
          
          console.log('Produit ajouté au localStorage:', product.name);
          return updated;
        });
      }
    } catch (error) {
      console.error('Erreur ajout panier:', error);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      if (isAuthenticated) {
        // Supprimer du backend
        const item = cartItems.find(i => i.product.id === productId);
        if (item?.id) {
          const response = await cartService.removeFromCart(item.id);
          const items = response.data.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            id: item.id
          }));
          setCartItems(items);
          console.log('Produit supprimé du backend');
        }
      } else {
        // Supprimer du localStorage
        setCartItems(prev => prev.filter(item => item.product.id !== productId));
        console.log('Produit supprimé du localStorage');
      }
    } catch (error) {
      console.error('Erreur suppression panier:', error);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      if (isAuthenticated) {
        // Mettre à jour au backend
        const item = cartItems.find(i => i.product.id === productId);
        if (item?.id) {
          const response = await cartService.updateCartItem(item.id, quantity);
          const items = response.data.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            id: item.id
          }));
          setCartItems(items);
        }
      } else {
        // Mettre à jour dans localStorage
        setCartItems(prev =>
          prev.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Erreur mise à jour quantité:', error);
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        await cartService.clearCart();
      }
      setCartItems([]);
      localStorage.removeItem('cart');
      console.log('Panier vidé');
    } catch (error) {
      console.error('Erreur vidage panier:', error);
    }
  };

  // Synchroniser quand l'utilisateur se connecte
  const syncCartOnLogin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsAuthenticated(true);
      
      // Récupérer le panier du backend
      const response = await cartService.getCart();
      const backendItems = response.data.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        id: item.id
      }));

      // Récupérer le panier local
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');

      // Fusionner les deux
      let merged = [...backendItems];
      for (const localItem of localCart) {
        const exists = merged.find(b => b.product.id === localItem.product.id);
        if (exists) {
          exists.quantity += localItem.quantity;
        } else {
          merged.push(localItem);
        }
      }

      // Envoyer les modifications au backend
      for (const item of merged) {
        if (!item.id) {
          await cartService.addToCart(item.product.id, item.quantity);
        }
      }

      // Recharger le panier du backend
      const finalResponse = await cartService.getCart();
      const finalItems = finalResponse.data.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        id: item.id
      }));
      setCartItems(finalItems);
      
      // Effacer localStorage
      localStorage.removeItem('cart');
      console.log('Panier synchronisé à la connexion');
    } catch (error) {
      console.error('Erreur synchronisation panier:', error);
    }
  };

  const syncCartOnLogout = () => {
    setIsAuthenticated(false);
    // Garder les articles pour localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    console.log('Panier transféré à localStorage');
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      setCartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      isAuthenticated,
      setIsAuthenticated,
      syncCartOnLogin,
      syncCartOnLogout,
      loading,
    }}>
      {children}
    </CartContext.Provider>
  );
}