import React, { useState, useEffect } from "react";
import { FaEye, FaShoppingCart } from "react-icons/fa";
import productService from "../services/productService";

const categories = [
  { id: 8, name: "Protection contre les intrusions", icon: "🛡️" },
  { id: 9, name: "Vidéosurveillance", icon: "📹" },
  { id: 10, name: "Sécurité incendie", icon: "🔥" },
  { id: 11, name: "Confort et automatisation", icon: "🤖" },
];

const Products = ({ handleOrderPopup, onProductClick, onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedProduct, setAddedProduct] = useState(null);

  // Récupérer les produits du backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      console.log("Produits reçus:", response.data);
      
      const productsData = response.data.results || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
      setError("Erreur lors du chargement des produits");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les produits par catégorie
  const filteredProducts =
    selectedCategory === "Tous"
      ? products
      : products.filter(
          (p) =>
            p.category?.name === selectedCategory ||
            p.category === selectedCategory
        );

  const handleViewDetails = (product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
      
      // Afficher une notification
      setAddedProduct(product.id);
      setTimeout(() => setAddedProduct(null), 2000);
    } else {
      handleOrderPopup();
    }
  };

  return (
    <section className="mt-12 mb-16 px-3 md:px-6 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Barre de catégories - Scroll horizontal mobile */}
        <div className="flex overflow-x-auto gap-3 md:gap-6 pb-3 mb-6 border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("Tous")}
            className={`flex flex-col items-center flex-shrink-0 px-2 pb-2 transition ${
              selectedCategory === "Tous"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <span className="text-xl md:text-2xl mb-1">🌐</span>
            <span className="text-xs md:text-sm font-medium whitespace-nowrap">
              Tous
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex flex-col items-center flex-shrink-0 px-2 pb-2 transition ${
                selectedCategory === cat.name
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span className="text-xl md:text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* État de chargement */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Chargement des produits...
              </p>
            </div>
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-2 text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Aucun produit trouvé */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Aucun produit disponible pour cette catégorie
            </p>
          </div>
        )}

        {/* Grille de produits */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col group"
              >
                {/* Image produit */}
                <div className="relative aspect-square bg-gray-50 dark:bg-gray-900 overflow-hidden">
                  <img
                    src={product.image_url || "/assets/images/placeholder.jpg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = "/assets/images/placeholder.jpg";
                    }}
                  />
                  {/* Quick view button on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <FaEye /> Voir détails
                    </button>
                  </div>
                </div>

                {/* Infos produit */}
                <div className="p-2 md:p-3 flex flex-col flex-grow">
                  <h3 className="text-xs md:text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-1 md:mb-2 min-h-[2rem] md:min-h-[2.5rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>

                  <div className="mt-auto">
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm md:text-base mb-2">
                      {product.price} FCFA
                    </p>
                    
                     {/* Affichage du stock */}
                     <p className="text-red-600 dark:text-blue-400 font-bold text-sm md:text-base mb-2">
                       {product.stock > 0 ? (
                         <span className="text-green-600"> Disponible : {product.stock}  </span>
                       ) : (
                         <span className="text-red-600"> En rupture  </span>
                       )}
                    </p>
                   
                    <div className="flex gap-1 md:gap-2">
                      <button
                        onClick={() => handleViewDetails(product)}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs md:text-sm font-medium py-1.5 md:py-2 rounded transition-colors flex items-center justify-center gap-1"
                        title="Voir les détails"
                      >
                        <FaEye className="text-xs" />
                        <span className="hidden sm:inline">Détails</span>
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`flex-1 transition-all flex items-center justify-center gap-1 shadow-md hover:shadow-lg transform hover:scale-105 text-white text-xs md:text-sm font-medium py-1.5 md:py-2 rounded ${
                          addedProduct === product.id
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        }`}
                        title="Ajouter au panier"
                      >
                        <FaShoppingCart className="text-xs" />
                        <span className="hidden sm:inline">
                          {addedProduct === product.id ? "Ajouté ✓" : "Ajouter"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default Products;