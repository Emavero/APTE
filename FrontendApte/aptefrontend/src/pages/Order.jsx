import React, { useContext, useState } from "react";
import {
  FaTimes,
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaCheck,
} from "react-icons/fa";
import orderService from "../services/orderService";
import { CartContext } from "../context/CartContext";

const Order = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.product.price) * item.quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError("Le panier est vide");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      console.log("Données envoyées:", orderData);
      const response = await orderService.createOrder(orderData);
      console.log("Commande créée:", response.data);

      setSuccess("Commande créée avec succès!");
      clearCart();

      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error("Erreur lors de la création de la commande:", err);
      setError(
        err.response?.data?.detail ||
          "Erreur lors de la création de la commande"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <FaShoppingCart className="text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Panier
            </h2>
            {cartItems.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                {cartItems.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <FaTimes className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-2">
              <FaCheck className="text-green-600" />
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <FaShoppingCart className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Le panier est vide
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      <img
                        src={item.product.image_url || "/assets/images/placeholder.jpg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/assets/images/placeholder.jpg";
                        }}
                      />
                    </div>

                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 font-bold mb-2">
                        {parseFloat(item.product.price).toFixed(2)} FCFA
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-xs transition-colors"
                        >
                          <FaMinus />
                        </button>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-semibold w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-xs transition-colors"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {(parseFloat(item.product.price) * item.quantity).toFixed(2)} FCFA
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Supprimer du panier"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Sous-total:</span>
                  <span>{total.toFixed(2)} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Livraison:</span>
                  <span className="text-green-600">Gratuite</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span>Total:</span>
                  <span className="text-blue-600">{total.toFixed(2)} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg transform hover:scale-105"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Commander maintenant
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Order;
