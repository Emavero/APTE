import React, { useState } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram, FaMapMarkerAlt, FaPhone, FaEnvelope, FaArrowRight } from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email soumis:", email);
    setEmail("");
  };

  return (
    <>
      <div className="mt-10"></div>

      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          {/* Top Section - Logo & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12 pb-12 border-b border-blue-700/30">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Apte</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Votre partenaire de confiance pour des solutions de sécurité intelligentes et innovantes. Protégez ce qui compte le plus.
              </p>
              {/* Contact Info */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-blue-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-300">123 Rue de la Sécurité, Mbour, Senegal</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhone className="text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">+212 5XX-XXXXXX</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300">contact@apte.sn</span>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-8">
                <h4 className="text-xl md:text-2xl font-bold text-white mb-3">
                  Restez informé de nos actualités
                </h4>
                <p className="text-blue-100 text-sm mb-5">
                  Recevez nos conseils sécurité, offres exclusives et dernières innovations directement dans votre boîte mail.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre adresse email"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-500 bg-white/10 text-white placeholder:text-blue-200 focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                  />
                  <button
                    onClick={handleSubmit}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
                  >
                    S'abonner
                    <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Solutions */}
            <div>
              <h5 className="text-lg font-bold mb-4 text-white">
                Solutions
              </h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Protection intrusions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Vidéosurveillance
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Sécurité incendie
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Témoignages clients
                  </a>
                </li>
              </ul>
            </div>

            {/* Assistance */}
            <div>
              <h5 className="text-lg font-bold mb-4 text-white">
                Assistance
              </h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Centre d'aide
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Guides & Articles
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h5 className="text-lg font-bold mb-4 text-white">
                Entreprise
              </h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    À propos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Page presse
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Événements
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Carrières
                  </a>
                </li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h5 className="text-lg font-bold mb-4 text-white">
                Légal
              </h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Cookies
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Mentions légales
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-blue-700/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              &copy; 2025 Apte. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-700/50 hover:bg-blue-600 flex items-center justify-center text-white transition-all transform hover:scale-110"
              >
                <FaFacebookF />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-700/50 hover:bg-blue-600 flex items-center justify-center text-white transition-all transform hover:scale-110"
              >
                <FaTwitter />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-700/50 hover:bg-blue-600 flex items-center justify-center text-white transition-all transform hover:scale-110"
              >
                <FaLinkedinIn />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-blue-700/50 hover:bg-blue-600 flex items-center justify-center text-white transition-all transform hover:scale-110"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;