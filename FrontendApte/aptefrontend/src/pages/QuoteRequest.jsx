// src/components/QuoteRequest.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaDownload, FaPlus, FaMinus, FaCheck, FaEye } from "react-icons/fa";
import productService from "../services/productService";
import quoteService from "../services/quoteService";

/**
 * Composant QuoteRequest amélioré :
 * - images miniatures
 * - résumé flottant
 * - aperçu PDF avant téléchargement (html2pdf)
 * - PDF optimisé A4 (tenu sur une page)
 * - UI modernisée
 */

export default function QuoteRequest() {
  const [step, setStep] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [params, setParams] = useState({ rooms: 0, entries: 0, windows: 0 });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const pageRef = useRef(null); // optionally used for preview

  // Charger html2pdf (option choisie)
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const systemCategoryMap = {
    "Protection contre les intrusions": 8,
    Vidéosurveillance: 9,
    "Sécurité incendie": 10,
    "Confort et automatisation": 11,
  };

  const featuresList = {
    "Protection contre les intrusions": ["Sécurité intérieur", "Bouton de panique"],
    Vidéosurveillance: [
      "Caméras filaires - Avec éclairage infrarouge",
      "Caméras filaires - Avec éclairage hybride",
      "Caméras Wi-Fi",
      "Enregistreurs vidéo réseau - Sans HDMI",
      "Enregistreurs vidéo réseau - Avec prise en charge HDMI",
      "Sonnettes vidéo",
    ],
    "Sécurité incendie": ["Détection de chaleur et de fumée", "Détection de CO", "Déclencheur manuel d'alarme"],
    "Confort et automatisation": [
      "Contrôle de l'éclairage",
      "Gérez l'alimentation électrique",
      "Contrôle de la qualité de l'air",
      "Détection des fuites",
      "Fermeture automatique de l'eau",
    ],
  };

  const productFeatureMap = {
    1: "Sécurité intérieur",
    2: "Bouton de panique",
    3: "Caméras filaires - Avec éclairage infrarouge",
    4: "Caméras Wi-Fi",
    5: "Enregistreurs vidéo réseau - Avec prise en charge HDMI",
    6: "Détection de chaleur et de fumée",
    7: "Détection de CO",
    8: "Contrôle de l'éclairage",
    9: "Détection des fuites",
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      const productsData = response?.data?.results || response?.data || [];
      const products = Array.isArray(productsData)
        ? productsData
            .filter((p) => p.is_active !== false) // tolérance
            .map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category?.id || p.category,
              price: typeof p.price === "string" ? parseFloat(p.price) : p.price || 0,
              stock: p.stock,
              image_url: p.image_url || "/assets/images/placeholder.jpg",
            }))
        : [];
      setAllProducts(products);
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSystem = (system) => {
    setSelectedSystems((prev) => (prev.includes(system) ? prev.filter((s) => s !== system) : [...prev, system]));
    setSelectedFeatures([]);
  };

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]));
  };

  const handleContinueStep2 = () => {
    setDropdownOpen(false);
    setStep(2);
  };

  const handleContinueStep3 = () => setStep(3);

  const getProductFeature = (productId) => productFeatureMap[productId] || null;

  const handleContinueStep4 = () => {
    const selectedCategoryIds = selectedSystems.map((s) => systemCategoryMap[s]);

    const filtered = allProducts.filter((p) => {
      const isInSelectedCategory = selectedCategoryIds.includes(p.category);

      let matchesFeature = false;
      if (selectedFeatures.length === 0) matchesFeature = true;
      else {
        selectedFeatures.forEach((feature) => {
          Object.values(productFeatureMap).forEach((productFeature) => {
            if (productFeature === feature && productFeature === getProductFeature(p.id)) matchesFeature = true;
          });
        });
      }

      return isInSelectedCategory && matchesFeature;
    });

    setFilteredProducts(filtered);

    const maxParam = Math.max(params.rooms, params.entries, params.windows);
    const suggestedQty = maxParam > 0 ? maxParam : 1;

    const initialProducts = filtered.map((p) => ({ ...p, qty: suggestedQty }));
    setSelectedProducts(initialProducts);
    setStep(4);
  };

  const handleUpdateQty = (productId, qty) => {
    if (qty < 0) return;
    setSelectedProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, qty } : p)));
  };

  const handleRemoveProduct = (productId) => setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));

  const calculateTotal = () => selectedProducts.reduce((sum, p) => sum + (p.price || 0) * (p.qty || 0), 0);

  // Crée le HTML compact pour le pdf (optimisé pour tenir sur 1 page A4)
  const buildPdfHtml = ({ quoteNumber, preview = false } = {}) => {
    const total = calculateTotal();
    // URL QR simple (Google Chart) encodant le numéro du devis (runtime fetch by browser)
    const qrData = encodeURIComponent(`DEVIS:${quoteNumber}`);
    const qrUrl = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${qrData}&choe=UTF-8`;

    const productRows = selectedProducts
      .map(
        (p) =>
          `<tr>
            <td style="padding:6px 8px; vertical-align: middle;">
              <div style="display:flex; gap:10px; align-items:center;">
                <img src="${p.image_url}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #e6eefc;" />
                <div style="font-size:12px;color:#22303f;font-weight:600;">${escapeHtml(p.name)}</div>
              </div>
            </td>
            <td style="padding:6px 8px;text-align:center;">${p.qty}</td>
            <td style="padding:6px 8px;text-align:right;">${formatNumber(p.price)} FCFA</td>
            <td style="padding:6px 8px;text-align:right;font-weight:700;">${formatNumber((p.price || 0) * (p.qty || 0))} FCFA</td>
          </tr>`
      )
      .join("");

    // compact style, small paddings to fit one page
    return `<!doctype html>
      <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Devis - ${quoteNumber}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#22303f; margin:0; background:white; -webkit-print-color-adjust:exact; }
          .page { width:210mm; height:297mm; padding:15mm; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; border-bottom:3px solid #2563eb; padding-bottom:10px; }
          .company { display:flex; gap:12px; align-items:center; }
          .company img { width:72px; height:72px; object-fit:contain; }
          .company h1 { font-size:18px; color:#2563eb; margin:0; }
          .meta { text-align:right; font-size:11px; color:#5b6b7a; }
          .section-title { font-size:12px; background:#f0f7ff; padding:6px 8px; border-left:4px solid #2563eb; margin-top:12px; font-weight:700; color:#2563eb; }
          .params { font-size:11px; color:#495867; margin-top:8px; display:flex; gap:16px; flex-wrap:wrap; }
          table { width:100%; border-collapse:collapse; margin-top:8px; font-size:11px; }
          table th { background:#2563eb; color:white; padding:8px; text-align:left; font-weight:700; font-size:11px; }
          table td { border-bottom:1px solid #e6eefc; padding:6px; vertical-align:middle; font-size:11px; color:#1f2b36; }
          .total { margin-top:12px; display:flex; justify-content:flex-end; gap:16px; align-items:center; }
          .total .label { font-weight:600; color:#22303f; font-size:12px; }
          .total .value { font-weight:800; color:#2563eb; font-size:16px; }
          .footer { position:absolute; bottom:12mm; left:15mm; right:15mm; text-align:center; font-size:10px; color:#7b8894; }
          .qr { width:72px; height:72px; border:1px solid transparent; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="company">
              <img src="${logoDataUrl()}" alt="logo" />
              <div>
                <h1>DEVIS DE SÉCURITÉ</h1>
                <div style="font-size:11px;color:#596b7a;margin-top:6px;">APTE — Sécurité & Confort pour votre établissement</div>
                <div style="font-size:10px;color:#8899aa;margin-top:4px;">www.apte.sn</div>
              </div>
            </div>
            <div class="meta">
              <div style="font-weight:700;color:#22303f;">N° ${quoteNumber}</div>
              <div style="margin-top:6px;">${new Date().toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</div>
              <img src="${qrUrl}" alt="qr" class="qr" style="margin-top:8px;" />
            </div>
          </div>

          <div class="section-title">📋 Paramètres</div>
          <div class="params">
            <div>Pièces: <strong>${params.rooms}</strong></div>
            <div>Entrées: <strong>${params.entries}</strong></div>
            <div>Fenêtres: <strong>${params.windows}</strong></div>
          </div>

          <div class="section-title">🔐 Systèmes & Fonctionnalités</div>
          <div style="margin-top:8px;font-size:11px;color:#22303f;">${selectedSystems.map((s) => escapeHtml(s)).join(", ") || "-"}</div>

          <div class="section-title">📦 Détail des produits</div>
          <table>
            <thead>
              <tr>
                <th style="width:55%;">Produit</th>
                <th style="width:12%;text-align:center;">Qté</th>
                <th style="width:16%;text-align:right;">Prix U.</th>
                <th style="width:17%;text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${productRows || `<tr><td colspan="4" style="padding:8px;color:#7b8894;">Aucun produit sélectionné</td></tr>`}
            </tbody>
          </table>

          <div class="total">
            <div class="label">MONTANT TOTAL :</div>
            <div class="value">${formatNumber(total)} FCFA</div>
          </div>

          <div class="footer">
            Ce devis est valable 30 jours. Pour toute question: info@apte-security.com — © ${new Date().getFullYear()} APTE Security
          </div>
        </div>
      </body>
      </html>`;
  };

  // --- Helpers ---
  const formatNumber = (n) => {
    if (n == null) return "0";
    return Number(n).toLocaleString("fr-FR");
  };

  const escapeHtml = (text) => {
    if (text == null) return "";
    return String(text).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  };

  // small fallback base64 inline logo (SVG) to avoid external dependency
  const logoDataUrl = () => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><rect rx='8' width='200' height='60' fill='#2563eb'/><text x='16' y='36' font-family='Segoe UI, Tahoma, Verdana' font-size='18' fill='white'>APTE</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // Génère et ouvre l'aperçu PDF dans un nouvel onglet sans forcer le téléchargement
  const previewPdf = async () => {
    if (!window.html2pdf) {
      alert("La bibliothèque html2pdf n'est pas encore chargée. Réessayez dans un moment.");
      return;
    }
    setPreviewLoading(true);
    try {
      const quoteNumber = `DEV${new Date().getTime().toString().slice(-6)}`;
      const html = buildPdfHtml({ quoteNumber, preview: true });

      // créer un blob PDF via html2pdf (output: blob)
      const opt = {
        margin: [6, 6, 6, 6], // mm minimal
        filename: `devis_${quoteNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      // from string -> create element
      const wrapper = document.createElement("div");
      wrapper.style.width = "210mm";
      wrapper.style.margin = "0";
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper); // required so html2canvas can render images

      // generate blob
      const worker = window.html2pdf().set(opt).from(wrapper).outputPdf("blob");
      const blob = await worker;
      const url = URL.createObjectURL(blob);

      // open preview in new tab
      window.open(url, "_blank");

      // cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url);
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      }, 60000);
    } catch (err) {
      console.error("Erreur preview PDF", err);
      alert("Impossible de générer l'aperçu du PDF. Voir console.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Génère et force le téléchargement du PDF
  const downloadPdf = () => {
    if (!window.html2pdf) {
      alert("La bibliothèque html2pdf n'est pas encore chargée. Réessayez dans un moment.");
      return;
    }

    const quoteNumber = `DEV${new Date().getTime().toString().slice(-6)}`;
    const html = buildPdfHtml({ quoteNumber, preview: false });
    const opt = {
      margin: [6, 6, 6, 6],
      filename: `devis_${quoteNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    // build wrapper, append to DOM
    const wrapper = document.createElement("div");
    wrapper.style.width = "210mm";
    wrapper.style.margin = "0";
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    window.html2pdf()
      .set(opt)
      .from(wrapper)
      .save()
      .then(() => {
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      })
      .catch((err) => {
        console.error("Erreur génération PDF", err);
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      });
  };

  const submitQuote = async () => {
    try {
      const total = calculateTotal();
      const payload = {
        description: `Systèmes: ${selectedSystems.join(", ")}`,
        message: `Fonctionnalités: ${selectedFeatures.join(", ")} | Pièces: ${params.rooms}, Entrées: ${params.entries}, Fenêtres: ${params.windows}`,
        total_estimate: total,
        items_write: selectedProducts.map((p) => ({ product: p.id, quantity: p.qty })),
      };

      console.log("Payload envoyé:", payload);
      const response = await quoteService.createQuote(payload);
      console.log("Réponse du serveur:", response);

      // ouvrir l'aperçu (optionnel) puis forcer le téléchargement
      await previewPdf(); // affiche l'aperçu
      downloadPdf(); // télécharge
      setSubmitted(true);
    } catch (e) {
      console.error("Erreur lors de l'envoi:", e);
      alert("Erreur lors de l'envoi du devis (voir console).");
    }
  };

  // UI rendering
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
              <FaCheck className="text-white text-3xl" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Succès!</h2>
          <p className="text-gray-600 mb-6">
            Votre demande de devis a été envoyée et un aperçu PDF a été ouvert.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setSelectedSystems([]);
              setSelectedFeatures([]);
              setParams({ rooms: 0, entries: 0, windows: 0 });
              setSelectedProducts([]);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition font-semibold"
          >
            Créer un nouveau devis
          </button>
        </div>
      </div>
    );
  }

  // ---------- JSX principal ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Demande de Devis</h1>
          <p className="text-gray-600">Sécurité & Confort pour votre établissement</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    s <= step ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 transition ${s < step ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gray-200"}`}></div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Système</span>
            <span>Produits</span>
            <span>Paramètres</span>
            <span>Confirmation</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          {/* Step 1: systèmes */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Sélectionnez le système</h2>

              <div className="relative mb-6">
                <button
                  onClick={() => setDropdownOpen((d) => !d)}
                  className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl px-5 py-4 text-left flex items-center justify-between hover:border-blue-500 transition"
                >
                  <span className="text-gray-700">
                    {selectedSystems.length === 0 ? "Sélectionnez un ou plusieurs systèmes..." : `${selectedSystems.length} système(s) sélectionné(s)`}
                  </span>
                  <FaChevronDown className={`text-blue-600 transition ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-xl z-50">
                    {Object.keys(systemCategoryMap).map((system, idx, arr) => (
                      <label
                        key={system}
                        className={`flex items-center px-6 py-4 hover:bg-blue-50 cursor-pointer transition ${idx !== arr.length - 1 ? "border-b border-gray-100" : ""}`}
                      >
                        <input type="checkbox" className="sr-only" checked={selectedSystems.includes(system)} onChange={() => toggleSystem(system)} />
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-3 ${selectedSystems.includes(system) ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600" : "border-gray-300"}`}>
                          {selectedSystems.includes(system) && <FaCheck className="text-white text-sm" />}
                        </div>
                        <div className="text-gray-900 font-medium">{system}</div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedSystems.length > 0 && <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-lg mb-6"><strong className="text-blue-900">Sélections :</strong> <span className="text-gray-700 ml-2">{selectedSystems.join(", ")}</span></div>}

              <div className="flex gap-3">
                <button onClick={() => { /* nothing to go back */ }} className="flex-1 bg-gray-200 text-gray-900 px-4 py-3 rounded-xl disabled:opacity-50">
                  ← Retour
                </button>
                <button onClick={handleContinueStep2} disabled={selectedSystems.length === 0} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg disabled:opacity-50">
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: fonctionnalités */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Sélectionnez les fonctionnalités</h2>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {selectedSystems.map((system) => (
                  <div key={system} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                    <h3 className="text-lg font-bold mb-3 text-blue-900 flex items-center gap-2">
                      <span className="w-7 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm">→</span>
                      {system}
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {featuresList[system].map((feature) => (
                        <label key={feature} className="flex items-center p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 cursor-pointer">
                          <input type="checkbox" className="sr-only" checked={selectedFeatures.includes(feature)} onChange={() => toggleFeature(feature)} />
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-3 ${selectedFeatures.includes(feature) ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600" : "border-gray-300"}`}>
                            {selectedFeatures.includes(feature) && <FaCheck className="text-white text-sm" />}
                          </div>
                          <div className="text-gray-900">{feature}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-3 rounded-xl">← Retour</button>
                <button onClick={handleContinueStep3} disabled={selectedFeatures.length === 0} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl disabled:opacity-50">Continuer →</button>
              </div>
            </div>
          )}

          {/* Step 3: paramètres */}
          {step === 3 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Paramètres de l'établissement</h2>

              <div className="space-y-4 mb-6">
                {[
                  { key: "rooms", label: "Pièces", icon: "🏠", desc: "Nombre de pièces" },
                  { key: "entries", label: "Entrées", icon: "🚪", desc: "Nombre d'entrées" },
                  { key: "windows", label: "Fenêtres", icon: "🪟", desc: "Nombre de fenêtres" },
                ].map(({ key, label, icon, desc }) => (
                  <div key={key} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-2xl">{icon}</span> {label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{desc}</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-600">{params[key]}</span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setParams((p) => ({ ...p, [key]: Math.max(0, p[key] - 1) }))} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg font-bold"><FaMinus /></button>
                      <button onClick={() => setParams((p) => ({ ...p, [key]: p[key] + 1 }))} className="flex-1 bg-green-100 hover:bg-green-200 text-green-600 py-2 rounded-lg font-bold"><FaPlus /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-900">💡 Ces paramètres servent à suggérer des quantités adaptées.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-3 rounded-xl">← Retour</button>
                <button onClick={handleContinueStep4} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl">Continuer →</button>
              </div>
            </div>
          )}

          {/* Step 4: produits */}
          {step === 4 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Produits & Quantités</h2>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg mb-6">
                  <p className="text-red-800">⚠️ Aucun produit disponible pour cette sélection.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {selectedProducts.map((product) => (
                      <div key={product.id} className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-100 rounded-xl p-3 flex items-center justify-between hover:border-blue-300 transition">
                        <div className="flex-1 flex items-center gap-3">
                          <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover border" />
                          <div>
                            <h3 className="font-bold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-blue-600 font-semibold">{formatNumber(product.price)} FCFA</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button onClick={() => handleUpdateQty(product.id, product.qty - 1)} className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center font-bold"><FaMinus /></button>
                          <input type="number" value={product.qty} onChange={(e) => handleUpdateQty(product.id, parseInt(e.target.value) || 0)} className="w-16 h-10 text-center border-2 border-gray-300 rounded-lg font-bold" min="0" />
                          <button onClick={() => handleUpdateQty(product.id, product.qty + 1)} className="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center font-bold"><FaPlus /></button>
                          <button onClick={() => handleRemoveProduct(product.id)} className="ml-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold">Retirer</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Résumé du devis (zone principale) */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Résumé du devis</h3>
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                      {selectedProducts.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{p.name} × {p.qty}</span>
                          <span className="font-bold text-blue-600">{formatNumber((p.price || 0) * (p.qty || 0))} FCFA</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t-2 border-blue-200 pt-3 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{formatNumber(calculateTotal())} FCFA</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-3 rounded-xl">← Retour</button>

                <div className="flex-1 flex gap-2">
                  <button onClick={previewPdf} disabled={selectedProducts.length === 0 || previewLoading} className="flex-1 bg-white border-2 border-blue-200 text-blue-600 px-4 py-3 rounded-xl hover:shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <FaEye /> Aperçu
                  </button>

                  <button onClick={submitQuote} disabled={selectedProducts.length === 0} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    <FaDownload /> Envoyer & Télécharger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.28s ease-out; }
      `}</style>
    </div>
  );
}
