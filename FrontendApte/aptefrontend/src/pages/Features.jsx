import React from "react";
import { FaShieldAlt, FaVideo, FaFireExtinguisher, FaCogs, FaArrowRight } from "react-icons/fa";
import img1 from "../assets/images/intrusion.png";
import img2 from "../assets/images/alarm.png";
import img3 from "../assets/images/incident.jpg";
import img4 from "../assets/images/confort-autom.png";  
const FeaturesData = [
  {
    id: 1,
    img: img1,
    title: "Protection contre les intrusions",
    description: "Systèmes d'alarme avancés pour détecter toute intrusion",
    icon: <FaShieldAlt className="text-4xl" />,
    aosDelay: "0",
    link: "/intrusion",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: 2,
    img: img2,
    title: "Vidéosurveillance",
    description: "Caméras HD avec surveillance 24/7 et accès à distance",
    icon: <FaVideo className="text-4xl" />,
    aosDelay: "100",
    link: "/#",
    gradient: "from-blue-600 to-blue-700",
  },
  {
    id: 3,
    img: img3,
    title: "Sécurité incendie",
    description: "Détecteurs intelligents et systèmes d'extinction automatiques",
    icon: <FaFireExtinguisher className="text-4xl" />,
    aosDelay: "200",
    link: "/#",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    id: 4,
    img: img4,
    title: "Confort et automatisation",
    description: "Domotique intelligente pour un confort optimal",
    icon: <FaCogs className="text-4xl" />,
    aosDelay: "300",
    link: "/#",
    gradient: "from-blue-700 to-blue-800",
  },
];

const Features = () => {
  return (
    <section className="py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-white to-blue-500 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <p 
            data-aos="fade-up" 
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2"
          >
            Nos Produits
          </p>
          <p
            data-aos="fade-up"
            data-aos-delay="100"
            className="text-base md:text-lg text-gray-600 dark:text-gray-300 mt-4 leading-relaxed"
          >
            Découvrez nos systèmes de sécurité intelligents pour la protection,
            la surveillance et le confort de votre espace.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FeaturesData.map((item) => (
            <div
              key={item.id}
              data-aos="fade-up"
              data-aos-delay={item.aosDelay}
              className="group w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 dark:border-gray-700"
            >
              {/* Image + Icon Overlay */}
              <div className="relative overflow-hidden h-48 md:h-52">
                <img
                  src={item.img}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient} opacity-0 group-hover:opacity-90 transition-opacity duration-500 flex items-center justify-center`}>
                  <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {item.icon}
                  </div>
                </div>
              </div>
          
              {/* Content */}
              <div className="p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
                <a 
                  href={item.link}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-3 transition-all"
                >
                  En savoir plus
                  <FaArrowRight className="text-xs" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div 
          data-aos="fade-up"
          data-aos-delay="400"
          className="mt-12 md:mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <a href=""><button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Demander un devis
            </button>
            </a>
            <button className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium py-3 px-8 rounded-full border-2 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transform hover:scale-105 transition-all duration-300">
              Contactez-nous
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;