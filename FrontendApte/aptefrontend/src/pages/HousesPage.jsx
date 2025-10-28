// pages/HousesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/layout/Navbar/Navbar';
import Footer from '../components/layout/Footer';
import Houses from './Houses';
import Order from './Order';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { CartContext } from '../context/CartContext';

export default function HousesPage() {
  const [orderPopup, setOrderPopup] = useState(false);
  const { cartItems } = useContext(CartContext);

  const handleOrderPopup = () => {
    setOrderPopup(!orderPopup);
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
      
      <Houses />
      
      <Order 
        isOpen={orderPopup} 
        onClose={handleOrderPopup}
      />
      
      <Footer />
    </div>
  );
}