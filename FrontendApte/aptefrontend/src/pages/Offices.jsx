import React, { useState } from 'react';
import { FaShieldAlt, FaVideo, FaFire, FaDoorOpen, FaWifi, FaBell, FaCheck, FaChevronDown, FaChevronUp, FaBriefcase, FaClock, FaUsers, FaKey, FaLaptop, FaFileAlt } from 'react-icons/fa';

const Offices = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: <FaBriefcase />,
      title: "Gestion multi-sites",
      description: "Contrôlez plusieurs bureaux depuis une seule interface"
    },
    {
      icon: <FaVideo />,
      title: "Vidéosurveillance professionnelle",
      description: "Caméras IP avec enregistrement cloud sécurisé"
    },
    {
      icon: <FaDoorOpen />,
      title: "Contrôle d'accès par badge",
      description: "Gestion des entrées et sorties des employés"
    },
    {
      icon: <FaClock />,
      title: "Horaires personnalisés",
      description: "Armement/désarmement automatique selon planning"
    },
    {
      icon: <FaUsers />,
      title: "Multi-utilisateurs",
      description: "Niveaux d'accès différenciés par employé"
    },
    {
      icon: <FaFileAlt />,
      title: "Rapports détaillés",
      description: "Historique complet des événements et accès"
    }
  ];

  const advantages = [
    "Conformité RGPD et normes bureaux",
    "Installation sans interruption d'activité",
    "Gestion centralisée multi-sites",
    "Intégration systèmes RH existants",
    "Support technique prioritaire 24/7",
    "Garantie professionnelle 3 ans"
  ];

  const products = [
    {
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400",
      name: "Hub 2 Plus Pro",
      description: "Centrale pour espaces professionnels"
    },
    {
      image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400",
      name: "DoorProtect Plus",
      description: "Sécurisation portes et fenêtres bureaux"
    },
    {
      image: "https://images.unsplash.com/photo-1600508773066-b2e1c8bb40ef?w=400",
      name: "FireProtect 2",
      description: "Détection incendie certifiée ERP"
    },
    {
      image: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=400",
      name: "MotionCam Pro",
      description: "Détection avec photo vérification"
    },
    {
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      name: "KeyPad Plus Pro",
      description: "Lecteur badges RFID professionnel"
    },
    {
      image: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=400",
      name: "Pass",
      description: "Badges d'accès sécurisés NFC"
    }
  ];

  const faqs = [
    {
      question: "Le système est-il conforme aux normes bureaux ?",
      answer: "Oui, tous nos systèmes respectent les normes ERP, RGPD et réglementations sur la protection des données en milieu professionnel. Certification ISO 27001 disponible."
    },
    {
      question: "Peut-on gérer plusieurs sites depuis une seule interface ?",
      answer: "Absolument. L'application APTE PRO permet de gérer un nombre illimité de sites depuis un tableau de bord centralisé avec rapports consolidés."
    },
    {
      question: "L'installation perturbe-t-elle l'activité ?",
      answer: "Non, installation sans fil réalisée en dehors des heures de bureau. Pour 100m² de bureaux, comptez 4-6h d'installation par nos techniciens certifiés."
    },
    {
      question: "Comment gérer les accès des employés ?",
      answer: "Via l'application, créez des profils utilisateurs avec horaires autorisés, zones accessibles et niveau de permissions. Ajoutez/supprimez des accès en temps réel."
    },
    {
      question: "Que se passe-t-il en cas d'intrusion ?",
      answer: "Alertes simultanées au responsable sécurité, à la direction et optionnellement à une société de télésurveillance. Sirène sur site et photos des détecteurs MotionCam."
    },
    {
      question: "Les rapports d'activité sont-ils exportables ?",
      answer: "Oui, export Excel/PDF de tous les événements : armements, désarmements, alertes, passages badges. Idéal pour audits et assurances."
    }
  ];

  const testimonials = [
    {
      name: "David M.",
      company: "Cabinet d'avocat - Paris",
      rating: 5,
      text: "300m² de bureaux sécurisés avec gestion des badges pour 15 employés. Installation en une journée, aucune interruption d'activité. Rapports parfaits pour notre assurance."
    },
    {
      name: "Sophie K.",
      company: "Startup Tech - Lyon",
      rating: 5,
      text: "Solution idéale pour nos open-spaces. Gestion des accès hyper simple, les employés utilisent leur badge smartphone. Fini les clés à gérer !"
    },
    {
      name: "Thomas R.",
      company: "Expert-comptable - Marseille",
      rating: 5,
      text: "Confidentialité maximale pour nos archives clients. Zones sécurisées avec double authentification. Le support technique est réactif et professionnel."
    }
  ];

  const useCases = [
    {
      icon: <FaBriefcase />,
      title: "Bureaux standards",
      description: "50-500m²",
      features: ["Protection périmétrique", "Contrôle accès entrée", "Vidéosurveillance zones clés"]
    },
    {
      icon: <FaLaptop />,
      title: "Open-spaces",
      description: "Espaces collaboratifs",
      features: ["Détection mouvement intelligente", "Gestion horaires flexibles", "Zones communes sécurisées"]
    },
    {
      icon: <FaKey />,
      title: "Espaces confidentiels",
      description: "Salles serveurs, archives",
      features: ["Double authentification", "Logs détaillés", "Alertes prioritaires"]
    },
    {
      icon: <FaUsers />,
      title: "Multi-sites",
      description: "Plusieurs établissements",
      features: ["Gestion centralisée", "Rapports consolidés", "Déploiement standardisé"]
    }
  ];

  const securityLevels = [
    {
      title: "Niveau 1 - Périmètre",
      items: ["Détecteurs portes/fenêtres", "Détection tentative effraction", "Sirène extérieure"]
    },
    {
      title: "Niveau 2 - Espaces communs",
      items: ["Détection mouvement zones", "Caméras couloirs", "Alarme sonore"]
    },
    {
      title: "Niveau 3 - Zones sensibles",
      items: ["Accès par badge", "Vidéo enregistrée", "Notifications immédiates"]
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
              Solutions pour <span className="text-blue-600 dark:text-blue-400">les bureaux</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              Sécurisez vos espaces professionnels avec un système intelligent adapté aux entreprises
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg text-white">
              Demander une démo
            </button>
          </div>
        </div>
      </section>

      {/* Why APTE for Offices */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Pourquoi APTE pour vos bureaux ?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            Une solution professionnelle complète pour la sécurité de vos espaces de travail
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Installation sans travaux</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Système entièrement sans fil. Installation en dehors des heures de bureau sans perturbation. Idéal pour locaux loués. Déménagez avec votre système si besoin.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Gestion intelligente des accès</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Badges RFID ou smartphone pour employés. Créez des profils avec horaires et zones autorisées. Codes temporaires pour visiteurs. Historique complet consultable.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Conformité et sécurité des données</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Conforme RGPD et normes ERP. Données cryptées AES-128. Serveurs européens. Certificat ISO 27001. Parfait pour cabinets juridiques, médicaux, comptables.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Évolutivité professionnelle</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Commencez avec un site, étendez à plusieurs. Ajoutez facilement dispositifs et utilisateurs. Gestion centralisée multi-sites. Idéal pour franchises et groupes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Adapté à tous types de bureaux
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="text-4xl text-blue-600 dark:text-blue-400 mb-4">
                  {useCase.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{useCase.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Levels */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Protection à 3 niveaux
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {securityLevels.map((level, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{level.title}</h3>
                <ul className="space-y-3">
                  {level.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <FaCheck className="text-blue-600 mt-1 flex-shrink-0" />
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
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Fonctionnalités professionnelles
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
            Kit professionnel bureaux
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Dispositifs certifiés pour environnements professionnels
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
                      Voir les specs
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
                Pourquoi les entreprises nous choisissent
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
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"
                alt="Bureau sécurisé"
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
            Témoignages professionnels
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.company}</p>
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
            Sécurisez vos bureaux dès aujourd'hui
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Bénéficiez d'une étude personnalisée et d'une démo sur site
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg">
              Planifier une démo
            </button>
            <button className="bg-transparent border-2 border-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all text-white">
              Télécharger la brochure
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Offices;