import React from "react";

/**
 * SolutionsApartments.jsx
 * Page "Solutions - Appartements" style moderne (TailwindCSS).
 *
 * Usage: importer et rendre <SolutionsApartments /> dans ton routeur/app.
 * Remplace les images (src) et textes par ceux de ton projet.
 */

const Feature = ({ icon, title, desc }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 p-6 rounded-2xl shadow-sm hover:shadow-lg transition">
    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4">
      {icon}
    </div>
    <h4 className="font-semibold text-lg mb-2">{title}</h4>
    <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>
  </div>
);

const ProductCard = ({ img, name, price, features, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow hover:shadow-lg transition">
    <div className="w-full h-44 bg-gray-100 dark:bg-gray-700">
      <img src={img} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h5 className="font-semibold text-lg">{name}</h5>
          <p className="text-blue-600 font-bold mt-1">{price}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && <button onClick={onEdit} className="p-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Éditer</button>}
          {onDelete && <button onClick={onDelete} className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Suppr.</button>}
        </div>
      </div>
      <ul className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-1">
        {features.map((f, i) => <li key={i}>• {f}</li>)}
      </ul>
    </div>
  </div>
);

export default function SolutionsApartments() {
  // exemples de données (remplace avec ton API si besoin)
  const features = [
    { title: "Sécurité 24/7", desc: "Détection intrusions & alarmes intelligentes.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2l9 4-9 4-9-4 9-4z" /></svg> },
    { title: "Contrôle à distance", desc: "Gestion via application mobile et tableaux de bord.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3" /></svg> },
    { title: "Automatisation", desc: "Scénarios & économies d'énergie pour bâtiments.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18" /></svg> },
    { title: "Intégrations", desc: "Compatible IoT, caméras, capteurs et systèmes tiers.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6l4 2" /></svg> },
  ];

  const products = [
    { id: 1, img: "/assets/placeholder-1.jpg", name: "Pack Sécurité Appartement", price: "129 000 FCFA", features: ["Capteur porte/fenêtre", "Sirène intérieure", "Installation 1h"] },
    { id: 2, img: "/assets/placeholder-2.jpg", name: "Caméra extérieure 1080p", price: "49 000 FCFA", features: ["HD 1080p", "Vision nuit", "Étanche IP66"] },
    { id: 3, img: "/assets/placeholder-3.jpg", name: "Module domotique", price: "29 500 FCFA", features: ["Relais 2A", "Zigbee/Z-Wave", "Scénarios programmables"] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      {/* HERO */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold mb-4">Solution pour appartements</p>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">Sécurisez et connectez vos résidences avec <span className="text-blue-600">APTE</span></h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl mb-6">
                Plateforme tout-en-un : détection, notifications, gestion d’accès et automatisation énergétique pour immeubles et appartements — simple à déployer et à contrôler depuis une app.
              </p>

              <div className="flex flex-wrap gap-3">
                <a href="#contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                  Demander une démo
                </a>
                <a href="#products" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-200 transition">
                  Voir les packs
                </a>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Surveillance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">#</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Déploiements</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Disponibilité</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">Intégrable</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">IoT & tiers</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-100 dark:ring-gray-700">
                <img src="/assets/hero-apartment.jpg" alt="Appartements connectés" className="w-full h-96 object-cover" />
              </div>

              {/* small card overlay */}
              <div className="absolute bottom-6 left-6 bg-white dark:bg-gray-800/80 p-4 rounded-2xl shadow-md w-64">
                <p className="text-sm text-gray-500 dark:text-gray-300">Exemple : détection d'intrusion</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">!</div>
                  <div>
                    <p className="text-sm font-semibold">Alarme activée</p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Notification envoyée à l’app</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-3">Pourquoi APTE pour les appartements ?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Une solution pensée pour les gestionnaires d'immeubles et résidences : fiabilité, intégration, facilité d'usage et ROI.
            </p>
            <a href="#contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">Contact commercial</a>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <Feature key={i} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-xl font-bold mb-6">Comment ça marche</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow">
              <h4 className="font-semibold mb-2">1. Audit & installation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">On réalise un audit, on installe les capteurs et la centralisation.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow">
              <h4 className="font-semibold mb-2">2. Connectivité & intégration</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connexion au cloud, intégration de caméras et systèmes tiers.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow">
              <h4 className="font-semibold mb-2">3. Supervision & automatisation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Tableau de bord, alertes, et scénarios automatiques pour la gestion quotidienne.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS / PACKS */}
      <section id="products" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Nos packs & équipements</h3>
          <div className="text-sm text-gray-500">10% d'installation offerte pour les immeubles</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(p => (
            <ProductCard
              key={p.id}
              img={p.img}
              name={p.name}
              price={p.price}
              features={p.features}
              onEdit={() => alert(`Edit ${p.id}`)}
              onDelete={() => { if (confirm('Supprimer ce produit ?')) alert('Supprimé'); }}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-6 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h4 className="text-2xl font-bold">Prêt à sécuriser vos appartements ?</h4>
              <p className="text-sm opacity-90 mt-2">Contactez-nous pour une démonstration sur site ou un devis personnalisé.</p>
            </div>
            <div className="w-full md:w-auto">
              <a href="/contact" className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:opacity-95 transition">
                Obtenir une démo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & Footer */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h5 className="text-xl font-bold mb-4">Questions fréquentes</h5>
            <div className="space-y-4">
              <details className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <summary className="font-semibold cursor-pointer">Installation compliquée ?</summary>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Non — nos techniciens assurent installation et configuration en quelques heures.</p>
              </details>

              <details className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <summary className="font-semibold cursor-pointer">Compatible avec d'autres systèmes ?</summary>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Oui, nous avons des API et intégrations IoT (MQTT, REST) pour la plupart des équipements.</p>
              </details>
            </div>
          </div>

          <div>
            <h5 className="text-xl font-bold mb-4">Contact</h5>
            <form className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Nom</label>
                <input aria-label="Nom" className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700" placeholder="Nom complet" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Email</label>
                <input aria-label="Email" className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700" placeholder="email@exemple.com" />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">Message</label>
                <textarea aria-label="Message" rows="4" className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700" placeholder="Parlez-nous de votre projet..." />
              </div>
              <div className="text-right">
                <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} APTE — Tous droits réservés</div>
          <div className="flex gap-4 text-gray-600 dark:text-gray-400">
            <a href="/privacy" className="text-sm hover:underline">Politique de confidentialité</a>
            <a href="/terms" className="text-sm hover:underline">CGU</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
