import React, { useState } from 'react';
import { FaShieldAlt, FaVideo, FaFire, FaDoorOpen, FaWifi, FaBell, FaCheck, FaChevronDown, FaChevronUp, FaHome, FaCar, FaTree, FaLock } from 'react-icons/fa';

const Houses = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Protection périmétrique",
      description: "Sécurisez l'ensemble de votre propriété, jardin inclus"
    },
    {
      icon: <FaVideo />,
      title: "Vidéosurveillance extérieure",
      description: "Caméras résistantes aux intempéries avec vision nocturne"
    },
    {
      icon: <FaFire />,
      title: "Détection incendie multi-zones",
      description: "Protection complète de tous les étages et espaces"
    },
    {
      icon: <FaDoorOpen />,
      title: "Contrôle d'accès multi-portes",
      description: "Gestion des entrées principales et secondaires"
    },
    {
      icon: <FaCar />,
      title: "Protection garage",
      description: "Détecteurs spécifiques pour garages et dépendances"
    },
    {
      icon: <FaTree />,
      title: "Détection périmètre jardin",
      description: "Barrières invisibles pour détecter les intrusions"
    }
  ];

  const advantages = [
    "Couverture jusqu'à 2000m² de propriété",
    "Détecteurs extérieurs résistants -25°C à +60°C",
    "Application multi-utilisateurs (famille complète)",
    "Zones personnalisables par pièce",
    "Compatible domotique complète",
    "Installation professionnelle disponible"
  ];

  const products = [
    {
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400",
      name: "Hub 2 Plus",
      description: "Centrale pour grandes propriétés avec 4G/Ethernet"
    },
    {
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400",
      name: "MotionProtect Outdoor",
      description: "Détecteur extérieur avec immunité aux animaux"
    },
    {
      image: "https://images.unsplash.com/photo-1600508773066-b2e1c8bb40ef?w=400",
      name: "DoorProtect Plus",
      description: "Détecteur d'ouverture avec capteur de choc"
    },
    {
      image: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=400",
      name: "StreetSiren",
      description: "Sirène extérieure 113dB avec LED"
    },
    {
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      name: "KeyPad Plus",
      description: "Clavier tactile avec lecteur de badges"
    },
    {
      image: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=400",
      name: "LeaksProtect",
      description: "Détecteur d'inondation pour sous-sol"
    }
  ];

  const faqs = [
    {
      question: "Quelle surface peut couvrir le système ?",
      answer: "Un seul Hub peut couvrir jusqu'à 2000m² de propriété grâce à la portée radio de 2km en champ libre. Pour les très grandes maisons, des répéteurs peuvent étendre la couverture."
    },
    {
      question: "Le système fonctionne-t-il avec un grand jardin ?",
      answer: "Oui, les détecteurs extérieurs MotionProtect Outdoor sont conçus pour les jardins. Ils ignorent les animaux domestiques et résistent aux conditions météorologiques extrêmes."
    },
    {
      question: "Puis-je armer uniquement certaines zones ?",
      answer: "Absolument. Vous pouvez créer des scénarios personnalisés : armer uniquement le rez-de-chaussée la nuit, ou seulement l'extérieur en journée par exemple."
    },
    {
      question: "L'installation nécessite-t-elle des travaux ?",
      answer: "Non, le système est entièrement sans fil. Cependant, pour les grandes maisons, nous recommandons une installation professionnelle pour optimiser le placement des détecteurs."
    },
    {
      question: "Combien d'utilisateurs peuvent accéder au système ?",
      answer: "Vous pouvez ajouter un nombre illimité d'utilisateurs avec différents niveaux d'accès (propriétaire, famille, invités temporaires, personnel de maison)."
    }
  ];

  const testimonials = [
    {
      name: "Philippe D.",
      location: "Versailles",
      rating: 5,
      text: "Maison de 300m² avec jardin entièrement sécurisée. L'installation a pris une journée et tout fonctionne parfaitement. Les alertes sont précises et fiables."
    },
    {
      name: "Caroline B.",
      location: "Aix-en-Provence",
      rating: 5,
      text: "Nous avons équipé notre villa avec piscine. Le système distingue bien nos chiens de 30kg, aucune fausse alerte. Application très pratique pour toute la famille."
    },
    {
      name: "Marc L.",
      location: "Bordeaux",
      rating: 5,
      text: "Installation dans une maison de caractère sans perçage. Les détecteurs extérieurs ont résisté à l'hiver rigoureux. Service impeccable."
    }
  ];

  const zones = [
    {
      icon: <FaHome />,
      title: "Intérieur",
      items: ["Détection mouvement par pièce", "Protection portes et fenêtres", "Détecteurs de fumée/CO"]
    },
    {
      icon: <FaTree />,
      title: "Jardin & Périmètre",
      items: ["Barrières invisibles", "Détecteurs extérieurs", "Éclairage connecté"]
    },
    {
      icon: <FaCar />,
      title: "Garage & Dépendances",
      items: ["Détection ouverture portail", "Capteurs de vibration", "Alertes véhicules"]
    },
    {
      icon: <FaLock />,
      title: "Points d'accès",
      items: ["Contrôle portail automatique", "Serrures connectées", "Interphone vidéo"]
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
              Solutions pour <span className="text-blue-600 dark:text-blue-400">maisons privées</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Protégez votre maison et votre terrain avec un système de sécurité complet et évolutif
            </p>
             <a href="/quote">
               <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg text-white">
                Obtenir un devis personnalisé
               </button>
            </a>
          </div>
        </div>
      </section>

      {/* Why Ajax for Houses */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Pourquoi choisir Ajax pour votre maison ?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            Une protection complète adaptée aux grandes propriétés et maisons individuelles
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Protection multi-niveaux</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Sécurisez chaque zone de votre propriété : intérieur, jardin, garage, dépendances. Créez des scénarios d'armement personnalisés selon vos besoins et votre mode de vie familial.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Résistance extrême</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Dispositifs extérieurs testés de -25°C à +60°C, certifiés IP65. Résistent à la pluie, neige, chaleur intense. Immunité aux interférences électromagnétiques et radio.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Gestion famille complète</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Chaque membre de la famille a son propre accès avec son niveau de permissions. Suivez qui arme/désarme le système. Créez des codes temporaires pour invités ou personnel.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Évolutivité totale</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Commencez avec les zones essentielles et étendez progressivement. Ajoutez piscine, pool house, portail, éclairage extérieur. Jusqu'à 200 dispositifs par Hub.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Protection par zones */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Protection complète de votre propriété
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {zones.map((zone, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="text-4xl text-blue-600 dark:text-blue-400 mb-4">
                  {zone.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{zone.title}</h3>
                <ul className="space-y-2">
                  {zone.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Fonctionnalités essentielles
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all group shadow-sm hover:shadow-lg"
              >
                <div className="text-4xl text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Kit complet pour maisons
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Une sélection de dispositifs pour une protection optimale
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div 
                key={index}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-2xl mb-4 aspect-square shadow-lg">
                  <img 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                    <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold text-white">
                      En savoir plus
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Pourquoi les propriétaires nous choisissent
              </h2>
              <div className="space-y-4">
                {advantages.map((advantage, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <FaCheck className="text-sm text-white" />
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-300">{advantage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
                alt="Maison sécurisée"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Témoignages propriétaires
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                >
                  <span className="font-semibold text-left">{faq.question}</span>
                  {openFaq === index ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Prêt à sécuriser votre maison ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Recevez un devis personnalisé et une étude gratuite de votre propriété
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg">
              Demander une étude
            </button>
            <button className="bg-transparent border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all text-white">
              Parler à un expert
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Houses;