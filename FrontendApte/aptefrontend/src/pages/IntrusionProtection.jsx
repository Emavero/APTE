import React from 'react';
import { FaShieldAlt, FaCheckCircle, FaCertificate, FaAward } from 'react-icons/fa';

const IntrusionProtection = () => {
  const productLines = [
    {
      category: "BASELINE",
      title: "Protection contre les intrusions",
      description: "Gamme complète pour l'intérieur et l'extérieur",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800",
      bgColor: "from-red-900 to-black",
      features: ["Détecteurs de mouvement", "Protection portes/fenêtres", "Détecteurs extérieurs", "Sirènes"]
    },
    {
      category: "SUPERIOR",
      title: "Protection contre les intrusions",
      description: "Dispositifs professionnels avancés",
      image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800",
      bgColor: "from-gray-100 to-white",
      features: ["Certifiés Grade 2", "Formation spécialisée requise", "Conformité réglementaire", "Projets haute sécurité"]
    }
  ];

  const categories = [
    {
      icon: <FaShieldAlt />,
      title: "Protection intérieure",
      items: [
        "Détecteurs de mouvement PIR",
        "Détecteurs avec caméra photo",
        "Protection portes et fenêtres",
        "Détecteurs de bris de vitre"
      ]
    },
    {
      icon: <FaShieldAlt />,
      title: "Protection extérieure",
      items: [
        "Détecteurs périmètre",
        "Immunité aux animaux 20kg",
        "Résistance -25°C à +60°C",
        "Barrières invisibles"
      ]
    },
    {
      icon: <FaShieldAlt />,
      title: "Contrôle d'accès",
      items: [
        "Claviers tactiles",
        "Badges RFID/NFC",
        "Télécommandes",
        "Contrôle via smartphone"
      ]
    },
    {
      icon: <FaShieldAlt />,
      title: "Sirènes & Alertes",
      items: [
        "Sirènes intérieures 105dB",
        "Sirènes extérieures 113dB",
        "LED d'avertissement",
        "Notifications push instantanées"
      ]
    }
  ];

  const certifications = [
    {
      icon: <FaCertificate />,
      title: "Grade 2",
      description: "Certification européenne EN 50131"
    },
    {
      icon: <FaAward />,
      title: "CE",
      description: "Conformité européenne"
    },
    {
      icon: <FaCheckCircle />,
      title: "RGPD",
      description: "Protection des données"
    }
  ];

  const advantages = [
    "Installation sans fil rapide",
    "Portée radio jusqu'à 2000m",
    "Autonomie batterie 7 ans",
    "Résistance aux interférences",
    "Compatible domotique",
    "Application intuitive"
  ];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-red-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
            Protection contre les intrusions
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Dispositifs de protection contre les intrusions avec ou sans fil
          </p>

          {/* Product Showcase */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-3 border border-gray-700">
                <img 
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200"
                  alt="KeyPad"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <p className="text-sm text-gray-400">Clavier tactile</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-3 border border-gray-700">
                <img 
                  src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=200"
                  alt="Detector"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <p className="text-sm text-gray-400">Détecteur mouvement</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-3 border border-gray-700">
                <img 
                  src="https://images.unsplash.com/photo-1558002038-1055907df827?w=200"
                  alt="Hub"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <p className="text-sm text-gray-400">Hub central</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-3 border border-gray-700">
                <img 
                  src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200"
                  alt="Door"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <p className="text-sm text-gray-400">Détecteur porte</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-800/50 rounded-2xl flex items-center justify-center mb-3 border border-gray-700">
                <img 
                  src="https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=200"
                  alt="Siren"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <p className="text-sm text-gray-400">Sirène</p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction 
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
            Pour chaque projet, qu'il soit quotidien ou ambitieux
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            La catégorie de protection contre les intrusions dispose de deux lignes de produits et dispositifs professionnels : Baseline et Superior. La Baseline comprend une large gamme de dispositifs sans fil essentiels pour l'intérieur et l'extérieur que tout partenaire Ajax peut offrir.
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            La Superior comprend des dispositifs d'intrusion sans fil avancés et fiables. Ces produits sont conformes aux réglementations internationales et locales les plus strictes et parfaitement adaptés aux projets de haut niveau. L'accès à la ligne de produits Superior est accordé aux partenaires agréés après avoir suivi une formation spécialisée à l'Ajax Academy.
          </p>
        </div>
      </section> */}

      {/* Product Lines */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Sélectionnez une ligne de produits
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {productLines.map((line, index) => (
              <div 
                key={index}
                className="group cursor-pointer overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                <div className={`relative h-80 bg-gradient-to-br ${line.bgColor} p-8 flex items-center justify-center`}>
                  <img 
                    src={line.image}
                    alt={line.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">{line.category}</p>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{line.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{line.description}</p>
                  <ul className="space-y-2">
                    {line.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <FaCheckCircle className="text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Catégories de protection
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl text-blue-600 dark:text-blue-400 mb-4">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{category.title}</h3>
                <ul className="space-y-2">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Certifications et conformité
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {certifications.map((cert, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg text-center"
              >
                <div className="text-5xl text-blue-600 dark:text-blue-400 mb-4 flex justify-center">
                  {cert.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{cert.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{cert.description}</p>
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
                Pourquoi choisir nos systèmes ?
              </h2>
              <div className="space-y-4">
                {advantages.map((advantage, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <FaCheckCircle className="text-sm text-white" />
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-300">{advantage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1558002038-1055907df827?w=800"
                alt="Système de sécurité"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Prêt à protéger votre propriété ?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Découvrez notre gamme complète de solutions de sécurité
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/products">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg">
                Voir tous les produits
              </button>
            </a>
            <a href="/installers">
              <button className="bg-transparent border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all text-white">
                Trouver un installateur
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntrusionProtection;