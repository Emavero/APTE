import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/layout/Navbar/Navbar';
import Products from './Products';
import Footer from '../components/layout/Footer';
import ProductDetails from './ProductDetails';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Order from './Order';
import { CartContext } from '../context/CartContext';

export default function ProductsPage() {
  const [orderPopup, setOrderPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { cartItems, addToCart } = useContext(CartContext);

  const handleOrderPopup = () => {
    setOrderPopup(!orderPopup);
  };

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity);
    setOrderPopup(true);
  };

  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in-sine",
      delay: 100,
    });
    AOS.refresh();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 dark:text-white duration-200">
      <Navbar 
        handleOrderPopup={handleOrderPopup} 
        cartItems={cartItems}
      />
      
      <Products 
        handleOrderPopup={handleOrderPopup}
        onProductClick={setSelectedProduct}
        onAddToCart={handleAddToCart}
      />

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          handleOrderPopup={handleOrderPopup}
          onAddToCart={handleAddToCart}
        />
      )}

      <Order 
        isOpen={orderPopup} 
        onClose={handleOrderPopup}
      />

      <Footer />
    </div>
  );
}