import React, { useState } from "react";
import { IoMdSearch } from "react-icons/io";
import { FaCartShopping } from "react-icons/fa6";
import {
  FaCaretDown,
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Menu = [
  { id: 1, name: "Accueil", link: "/" },
  { id: 2, name: "Produits", link: "/products" },
  //{ id: 3, name: "Assistances", link: "/#" },
  { id: 4, name: "Devis", link: "/quote" },
];

const DropdownLinks = [
  { id: 1, name: "Appartements", link: "/appartements" },
  { id: 2, name: "Maisons et Villas", link: "/houses" },
  { id: 3, name: "Entreprises", link: "/offices" },
];

const Navbar = ({ handleOrderPopup, cartItems = [] }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false);
      localStorage.removeItem('token');
      navigate("/login");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="shadow-md bg-white dark:bg-gray-900 dark:text-white duration-200 relative z-50">
      <div className="bg-blue-600 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a
            href="/"
            className="font-bold text-2xl sm:text-3xl flex gap-2 items-center text-white"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
              A
            </div>
            Apte
          </a>

          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <input
                type="text"
                placeholder="Recherche..."
                className="w-[200px] sm:w-[220px] group-hover:w-[300px] transition-all duration-300 
                           rounded-full border border-white/30 px-3 py-1 
                           focus:outline-none focus:border-white bg-white/10 text-white
                           placeholder:text-white/70"
              />
              <IoMdSearch className="text-white/70 group-hover:text-white absolute top-1/2 -translate-y-1/2 right-3" />
            </div>

            <button
              onClick={() => handleOrderPopup()}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 
                         rounded-full flex items-center gap-2 hover:opacity-90 transition-all shadow-md relative group"
              title="Voir le panier"
            >
              <div className="relative">
                <FaCartShopping className="text-xl" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold 
                                 rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block">
                {cartCount > 0 ? `${cartCount} article${cartCount > 1 ? 's' : ''}` : 'Panier'}
              </span>
            </button>

            <button
              onClick={handleAuthAction}
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full 
                         bg-white/20 hover:bg-white/30 transition-all"
              title={isLoggedIn ? "Déconnexion" : "Connexion"}
            >
              {isLoggedIn ? (
                <FaSignOutAlt className="text-xl text-white" />
              ) : (
                <FaSignInAlt className="text-xl text-white" />
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden text-2xl text-white"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>

      <div className="justify-center hidden sm:flex py-3">
        <ul className="flex items-center gap-4">
          {Menu.map((data) => (
            <li key={data.id}>
              <a
                href={data.link}
                className="inline-block px-4 hover:text-blue-600 transition-colors font-medium"
              >
                {data.name}
              </a>
            </li>
          ))}

          <li className="relative cursor-pointer">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 py-2 font-medium px-4 hover:text-blue-600 transition-colors"
            >
              Solutions
              <FaCaretDown className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 
                            text-black dark:text-white rounded-md shadow-lg w-48 p-2 z-50">
                <ul>
                  {DropdownLinks.map((data) => (
                    <li key={data.id}>
                      <a
                        href={data.link}
                        className="block w-full px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {data.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        </ul>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-t 
                        border-gray-200 dark:border-gray-700 shadow-lg sm:hidden z-40">
          <ul className="flex flex-col items-start p-5 gap-3">
            {Menu.map((data) => (
              <li key={data.id} className="w-full">
                <a
                  href={data.link}
                  className="block w-full py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {data.name}
                </a>
              </li>
            ))}

            <li className="w-full">
              <details className="w-full">
                <summary className="cursor-pointer py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 font-medium">
                  Solutions
                </summary>
                <ul className="pl-4 mt-2 space-y-1">
                  {DropdownLinks.map((data) => (
                    <li key={data.id}>
                      <a
                        href={data.link}
                        className="block py-1 text-gray-600 dark:text-gray-300 hover:text-blue-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {data.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </li>

            <li className="w-full mt-2">
              <button
                onClick={handleAuthAction}
                className={`w-full text-center py-2.5 rounded-full flex items-center justify-center gap-2 font-medium ${
                  isLoggedIn
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white transition-all duration-200 shadow-md`}
              >
                {isLoggedIn ? (
                  <>
                    <FaSignOutAlt className="text-lg" /> Déconnexion
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="text-lg" /> Connexion
                  </>
                )}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Navbar;