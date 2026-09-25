import React, { useCallback, useEffect, useState } from "react";
import {
  FaTimes,
  FaShoppingCart,
  FaStar,
  FaCheck,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaHeadset,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import productService from "../services/productService";

const ProductDetails = ({ product, onClose, onAddToCart }) => {
  const [selectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [productDetails, setProductDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductDetails = useCallback(
    async (productId) => {
      try {
        setLoading(true);
        const response = await productService.getProductDetail(productId);
        setProductDetails(response.data);
        setError(null);
      } catch {
        // Repli sur les données déjà connues du produit plutôt qu'un écran vide.
        setProductDetails(product);
        setError("Erreur lors du chargement des détails complets");
      } finally {
        setLoading(false);
      }
    },
    [product],
  );

  useEffect(() => {
    if (product?.id) {
      fetchProductDetails(product.id);
    }
  }, [product?.id, fetchProductDetails]);

  if (!productDetails) return null;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const discount = productDetails.old_price
    ? Math.round(((productDetails.old_price - productDetails.price) / productDetails.old_price) * 100)
    : 0;

  const images = productDetails.image_url
    ? [productDetails.image_url]
    : ["/assets/images/placeholder.jpg"];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Détails du produit
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <FaTimes className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 m-6">
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && productDetails && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Images Section */}
              <div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden mb-4 aspect-square flex items-center justify-center">
                  <img
                    src={images[selectedImage] || "/assets/images/placeholder.jpg"}
                    alt={productDetails.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      e.target.src = "/assets/images/placeholder.jpg";
                    }}
                  />
                </div>
              </div>

              {/* Info Section */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {productDetails.name}
                </h1>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  {productDetails.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-sm ${
                            i < Math.floor(productDetails.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {productDetails.rating} ({productDetails.reviews || 0} avis)
                      </span>
                    </div>
                  )}

                  {productDetails.is_active && (
                    <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                      {/* Affichage du stock  */}
                     <p className="text-red-600 dark:text-blue-400 font-bold text-sm md:text-base mb-2">
                       {product.stock > 0 ? (
                         <span className="text-green-600"> Disponible : {product.stock}  </span>
                       ) : (
                         <span className="text-red-600"> En rupture  </span>
                       )}
                    </p>
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl md:text-4xl font-bold text-blue-600">
                      {productDetails.price} FCFA
                    </span>
                    {productDetails.old_price && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          {productDetails.old_price} FCFA
                        </span>
                        <span className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full text-sm font-semibold">
                          -{discount}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {productDetails.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {productDetails.description}
                    </p>
                  </div>
                )}

                {/* Quantity & Actions */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quantité:
                    </span>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaMinus className="text-sm text-gray-600 dark:text-gray-400" />
                      </button>
                      <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FaPlus className="text-sm text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart(productDetails, quantity);
                        onClose();
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg"
                  >
                    <FaShoppingCart />
                    Ajouter au panier
                  </button>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaShieldAlt className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Garantie</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">2 ans</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaTruck className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Livraison</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Rapide</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaUndo className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Retour</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">30 jours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaHeadset className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Support</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;