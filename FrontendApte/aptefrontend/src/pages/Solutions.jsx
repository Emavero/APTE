import React from "react";
import { FaCog, FaBuilding, FaQuoteLeft, FaBox, FaArrowRight } from "react-icons/fa";
import imgAss from "../assets/images/ass.png";
import imgSitoff from "../assets/images/siteoff.png"
import imgSit from "../assets/images/smiling.jpg"
import imgProduits from  "../assets/images/produits.png"


const solutionsData = [
  {
    id: 1,
    img: imgAss,
    title: "Assemblez votre système",
    description: "Créez un système sur mesure adapté à vos besoins spécifiques",
    icon: <FaCog className="text-3xl" />,
    link: "#",
    aosDelay: "0",
  },
  {
    id: 2,
    img: imgSitoff,
    title: "Solutions par type de site",
    description: "Des solutions adaptées à chaque environnement",
    icon: <FaBuilding className="text-3xl" />,
    link: "#",
    aosDelay: "100",
  },
  {
    id: 3,
    img: imgSit,
    title: "Témoignages clients",
    description: "Découvrez les retours d'expérience de nos clients satisfaits",
    icon: <FaQuoteLeft className="text-3xl" />,
    link: "#",
    aosDelay: "200",
  },
  {
    id: 4,
    img: imgProduits,
    title: "Produits Apte Ready",
    description: "Kits prêts à l'emploi pour une installation rapide",
    icon: <FaBox className="text-3xl" />,
    link: "#",
    aosDelay: "300",
  },
];

const Solutions = () => {
  return (
    <section className="py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <p 
            data-aos="fade-up" 
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2"
          >
            Nos Solutions
          </p>
          
          <p
            data-aos="fade-up"
            data-aos-delay="100"
            className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
          >
            Découvrez nos solutions complètes pour divers types de sites, ainsi
            que les témoignages de nos clients et partenaires. Composez votre
            propre kit de dispositifs pour la sécurité et le confort.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {solutionsData.map((solution) => (
            <div
              key={solution.id}
              data-aos="fade-up"
              data-aos-delay={solution.aosDelay}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
              {/* Image Container */}
              <div className="relative h-48 md:h-52 overflow-hidden">
                <img
                  src={solution.img}
                  alt={solution.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600 via-blue-600/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {solution.icon}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {solution.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {solution.description}
                </p>
                <a 
                  href={solution.link}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all"
                >
                  Découvrir
                  <FaArrowRight className="text-xs" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div 
          data-aos="fade-up"
          data-aos-delay="400"
          className="mt-12 md:mt-16 text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 shadow-xl"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Besoin d'une solution personnalisée ?
          </h3>
          <p className="text-blue-100 text-base md:text-lg mb-6 max-w-2xl mx-auto">
            Nos experts sont là pour vous accompagner dans le choix de la solution idéale pour votre projet
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 font-medium py-3 px-8 rounded-full hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Contactez un expert
            </button>
            <a href="/products"><button className="bg-transparent text-white font-medium py-3 px-8 rounded-full border-2 border-white hover:bg-white/10 transform hover:scale-105 transition-all duration-300">
              Voir tous nos produits
            </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Solutions;