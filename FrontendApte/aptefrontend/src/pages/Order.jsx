import React, { useContext, useState } from "react";
import {
  FaTimes,
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaCheck,
  FaMoneyBillWave,
  FaCreditCard,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
} from "react-icons/fa";
import orderService from "../services/orderService";
import { CartContext } from "../context/CartContext";

const Order = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
  
  const [step, setStep] = useState(1); // 1: Panier, 2: Informations livraison, 3: Paiement
  const [paymentMethod, setPaymentMethod] = useState(""); // "cash" ou "wave"
  
  // Informations de livraison
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });
  
  const [wavePhoneNumber, setWavePhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.product.price) * item.quantity;
    }, 0);
  };

  const handleContinueToDelivery = () => {
    if (cartItems.length === 0) {
      setError("Le panier est vide");
      return;
    }
    setStep(2);
    setError(null);
  };

  const handleContinueToPayment = () => {
    // Validation des informations de livraison
    if (!deliveryInfo.fullName.trim()) {
      setError("Veuillez entrer votre nom complet");
      return;
    }
    if (!deliveryInfo.phone.trim()) {
      setError("Veuillez entrer votre numéro de téléphone");
      return;
    }
    if (!deliveryInfo.address.trim()) {
      setError("Veuillez entrer votre adresse de livraison");
      return;
    }
    if (!deliveryInfo.city.trim()) {
      setError("Veuillez entrer votre ville");
      return;
    }

    const cleanPhone = deliveryInfo.phone.replace(/\s/g, '');
    if (cleanPhone.length < 9) {
      setError("Numéro de téléphone invalide");
      return;
    }

    setStep(3);
    setError(null);
  };

  const handleBackToCart = () => {
    setStep(1);
    setError(null);
  };

  const handleBackToDelivery = () => {
    setStep(2);
    setError(null);
  };

  const handleDeliveryInfoChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmOrder = async () => {
    if (!paymentMethod) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    if (paymentMethod === "wave" && !wavePhoneNumber) {
      setError("Veuillez entrer votre numéro Wave");
      return;
    }

    if (paymentMethod === "wave" && wavePhoneNumber) {
      const cleanPhone = wavePhoneNumber.replace(/\s/g, '');
      if (cleanPhone.length < 9) {
        setError("Numéro Wave invalide");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const orderData = {
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        delivery_name: deliveryInfo.fullName,
        delivery_phone: deliveryInfo.phone,
        delivery_address: deliveryInfo.address,
        delivery_city: deliveryInfo.city,
        delivery_notes: deliveryInfo.notes || "",
      };

      // Ajouter phone_number uniquement pour Wave
      if (paymentMethod === "wave") {
        orderData.phone_number = wavePhoneNumber;
      }

      console.log("Données envoyées:", orderData);
      const response = await orderService.createOrder(orderData);
      console.log("Commande créée:", response.data);

      if (paymentMethod === "wave" && response.data.wave_payment_url) {
        setSuccess("Redirection vers Wave pour le paiement...");
        setTimeout(() => {
          window.location.href = response.data.wave_payment_url;
        }, 1500);
      } else {
        setSuccess(response.data.message || "Commande créée avec succès!");
        clearCart();
        
        setTimeout(() => {
          handleClose();
        }, 2500);
      }
    } catch (err) {
      console.error("Erreur lors de la création de la commande:", err);
      
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join(' | ');
          setError(errorMessages);
        } else {
          setError(err.response.data.detail || err.response.data.error || "Erreur lors de la création de la commande");
        }
      } else {
        setError("Erreur lors de la création de la commande");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setPaymentMethod("");
    setWavePhoneNumber("");
    setDeliveryInfo({
      fullName: "",
      phone: "",
      address: "",
      city: "",
      notes: ""
    });
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={step === 2 ? handleBackToCart : handleBackToDelivery}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
              >
                <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <FaShoppingCart className="text-blue-600" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {step === 1 ? "Panier" : step === 2 ? "Livraison" : "Paiement"}
            </h2>
            {step === 1 && cartItems.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                {cartItems.length}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <FaTimes className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Progress indicators */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="text-xs mt-1">Panier</span>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="text-xs mt-1">Livraison</span>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className="text-xs mt-1">Paiement</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-2">
              <FaCheck className="text-green-600" />
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* STEP 1: Panier */}
          {step === 1 && (
            <>
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
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-semibold w-12 text-center text-gray-900 dark:text-white">
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
                    onClick={handleContinueToDelivery}
                    className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    Continuer
                    <FaArrowLeft className="rotate-180" />
                  </button>
                </>
              )}
            </>
          )}

          {/* STEP 2: Informations de livraison */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations de livraison
              </h3>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaUser className="text-blue-600" />
                  Nom complet
                </label>
                <input
                  type="text"
                  value={deliveryInfo.fullName}
                  onChange={(e) => handleDeliveryInfoChange('fullName', e.target.value)}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaPhone className="text-blue-600" />
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={deliveryInfo.phone}
                  onChange={(e) => handleDeliveryInfoChange('phone', e.target.value)}
                  placeholder="77 123 45 67"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  Adresse de livraison
                </label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => handleDeliveryInfoChange('address', e.target.value)}
                  placeholder="123 Rue de la République"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  Ville
                </label>
                <input
                  type="text"
                  value={deliveryInfo.city}
                  onChange={(e) => handleDeliveryInfoChange('city', e.target.value)}
                  placeholder="Dakar"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Instructions de livraison (optionnel)
                </label>
                <textarea
                  value={deliveryInfo.notes}
                  onChange={(e) => handleDeliveryInfoChange('notes', e.target.value)}
                  placeholder="Sonnez à l'interphone, 2ème étage..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <button
                onClick={handleContinueToPayment}
                className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2 mt-6"
              >
                Continuer vers le paiement
                <FaArrowLeft className="rotate-180" />
              </button>
            </div>
          )}

          {/* STEP 3: Choix du mode de paiement */}
          {step === 3 && (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Choisissez votre mode de paiement
                </h3>

                <div className="space-y-3">
                  {/* Paiement à la livraison */}
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "cash"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentMethod === "cash"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        <FaMoneyBillWave className="text-xl" />
                      </div>
                      <div className="flex-grow text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Paiement à la livraison
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Payez en espèces lors de la réception
                        </p>
                      </div>
                      {paymentMethod === "cash" && (
                        <FaCheck className="text-blue-600 text-xl" />
                      )}
                    </div>
                  </button>

                  {/* Paiement Wave */}
                  <button
                    onClick={() => setPaymentMethod("wave")}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "wave"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentMethod === "wave"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}>
                        <FaCreditCard className="text-xl" />
                      </div>
                      <div className="flex-grow text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Paiement Wave
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Paiement sécurisé via Wave
                        </p>
                      </div>
                      {paymentMethod === "wave" && (
                        <FaCheck className="text-blue-600 text-xl" />
                      )}
                    </div>
                  </button>

                  {/* Champ numéro Wave */}
                  {paymentMethod === "wave" && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Numéro de téléphone Wave
                      </label>
                      <input
                        type="tel"
                        value={wavePhoneNumber}
                        onChange={(e) => setWavePhoneNumber(e.target.value)}
                        placeholder="77 123 45 67"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Vous recevrez une notification Wave pour confirmer le paiement
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Livraison à:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {deliveryInfo.fullName} - {deliveryInfo.phone}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {deliveryInfo.address}, {deliveryInfo.city}
                  </p>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total à payer:</span>
                  <span className="text-blue-600">{total.toFixed(2)} FCFA</span>
                </div>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={loading || !paymentMethod}
                className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                  loading || !paymentMethod
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
                    Confirmer la commande
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