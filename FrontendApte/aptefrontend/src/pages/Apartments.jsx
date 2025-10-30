import React, { useState } from 'react';
import { FaShieldAlt, FaVideo, FaFire, FaDoorOpen, FaWifi, FaBell, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Apartments = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Protection contre les intrusions",
      description: "Détecteurs de mouvement et d'ouverture intelligents"
    },
    {
      icon: <FaVideo />,
      title: "Vidéosurveillance HD",
      description: "Caméras avec vision nocturne et stockage cloud"
    },
    {
      icon: <FaFire />,
      title: "Détection incendie",
      description: "Alertes instantanées en cas de fumée ou chaleur"
    },
    {
      icon: <FaDoorOpen />,
      title: "Contrôle d'accès",
      description: "Gestion des entrées via smartphone"
    },
    {
      icon: <FaWifi />,
      title: "Connexion sans fil",
      description: "Installation simple sans câblage complexe"
    },
    {
      icon: <FaBell />,
      title: "Notifications en temps réel",
      description: "Alertes immédiates sur votre téléphone"
    }
  ];

  const advantages = [
    "Installation sans travaux",
    "Application mobile intuitive",
    "Autonomie batterie jusqu'à 7 ans",
    "Compatible avec Google Home et Alexa",
    "Garantie 2 ans",
    "Support technique 24/7"
  ];

  const products = [
    {
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400",
      name: "Hub 2 Plus",
      description: "Centrale intelligente avec 4G et Ethernet"
    },
    {
      image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400",
      name: "MotionCam",
      description: "Détecteur avec caméra photo intégrée"
    },
    {
      image: "https://images.unsplash.com/photo-1600508773066-b2e1c8bb40ef?w=400",
      name: "FireProtect Plus",
      description: "Détecteur de fumée, CO et température"
    }
  ];

  const faqs = [
    {
      question: "Puis-je installer le système moi-même ?",
      answer: "Oui, tous nos dispositifs sont conçus pour une installation facile sans câblage. L'application vous guide étape par étape."
    },
    {
      question: "Quelle est la portée du signal sans fil ?",
      answer: "La portée peut atteindre jusqu'à 2000m en champ libre. Dans un appartement standard, cela couvre facilement tous les espaces."
    },
    {
      question: "Le système fonctionne-t-il en cas de coupure internet ?",
      answer: "Oui, le Hub dispose d'une connexion 4G de secours et d'une batterie pouvant tenir jusqu'à 15 heures."
    },
    {
      question: "Comment sont stockées mes vidéos ?",
      answer: "Les vidéos sont stockées de manière sécurisée dans le cloud crypté. Vous pouvez également utiliser une carte SD locale."
    }
  ];

  const testimonials = [
    {
      name: "Marie L.",
      location: "Paris 15ème",
      rating: 5,
      text: "Installation en 2h chrono dans mon appartement. L'application est très intuitive et je me sens beaucoup plus en sécurité."
    },
    {
      name: "Ahmed K.",
      location: "Lyon",
      rating: 5,
      text: "Excellent système ! Les notifications sont instantanées et la qualité vidéo est impressionnante même la nuit."
    },
    {
      name: "Sophie M.",
      location: "Marseille",
      rating: 5,
      text: "Parfait pour mon appartement en location. Aucun perçage nécessaire, je pourrai tout remporter si je déménage."
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
              Solutions pour <span className="text-blue-600 dark:text-blue-400">appartements</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Protégez votre appartement avec un système de sécurité intelligent, sans câblage complexe
            </p>
             <a href="/quote">
               <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg text-white">
                 Demander un devis gratuit
                </button>
             </a>
          </div>
        </div>
      </section>

      {/* Why APTE Section */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Pourquoi choisir APTE pour votre appartement ?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            Un système conçu spécifiquement pour les besoins des appartements modernes
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Installation sans perçage</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Idéal pour les appartements en location. Tous les dispositifs sont sans fil et s'installent avec des adhésifs 3M double face de qualité professionnelle. Aucun dommage aux murs, aucun câblage visible.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contrôle total via smartphone</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Armez et désarmez votre système à distance, recevez des notifications instantanées, visualisez vos caméras en direct et gérez les accès depuis n'importe où dans le monde via l'application APTE.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Respect de la vie privée</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Détecteurs intelligents qui distinguent les animaux domestiques jusqu'à 20kg. Zones de confidentialité sur les caméras. Toutes les données sont cryptées de bout en bout selon les normes européennes RGPD.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Évolutif selon vos besoins</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Commencez avec un kit de base et ajoutez des dispositifs au fil du temps. Jusqu'à 200 appareils peuvent être connectés à un seul Hub. Parfait pour étendre la protection vers un garage ou une cave.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Fonctionnalités clés
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
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Nos produits phares pour appartements
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Une sélection de dispositifs essentiels pour protéger votre espace
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
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Pourquoi les propriétaires nous font confiance
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
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
                alt="Appartement sécurisé"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Témoignages clients
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
      <section className="py-20 bg-white dark:bg-gray-900">
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
            Prêt à sécuriser votre appartement ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Obtenez un devis personnalisé gratuit en moins de 24h
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/quote">
            <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-lg hover:bg-blue-50 transition-all">
              Demander un devis
            </button>
            </a>
            <button className="bg-transparent border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all text-white">
              Contacter un expert
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Apartments;