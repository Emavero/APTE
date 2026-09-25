import React, { useCallback, useEffect, useState } from 'react';
import { FaUsers, FaShoppingCart, FaBox, FaMoon, FaSun, FaPlus, FaEdit, FaTrash, FaSearch, FaFileInvoice } from 'react-icons/fa';
import authService from '../services/authService';
import orderService from '../services/orderService';
import productService from '../services/productService';
import { formatMoney, toAmount } from '../utils/currency';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name:'', description:'', price:'', stock:'', category:'', image:null });

  // Search states
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const [categories, setCategories] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Requêtes en parallèle : la version séquentielle triplait le temps
      // d'affichage du tableau de bord.
      const [u, o, p, c] = await Promise.all([
        authService.getListUsers(),
        orderService.getOrders(),
        productService.getProducts(),
        productService.getCategories(),
      ]);
      setUsers(u.data.results || u.data || []);
      setOrders(o.data.results || o.data || []);
      setProducts(p.data.results || p.data || []);
      setCategories(c.data.results || c.data || []);
      setFeedback(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.detail || 'Chargement du tableau de bord impossible.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshProducts = async () => {
    const p = await productService.getProducts();
    setProducts(p.data.results || p.data || []);
  };

  // Chiffre d'affaires : seules les commandes réglées comptent.
  const revenue = orders
    .filter((o) => ['paid', 'shipped', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + toAmount(o.total_price), 0);

  // --- Product CRUD ---
  const handleAddOrEditProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.price === '' || formData.stock === '' || !formData.category) {
      setFeedback({ type: 'error', message: 'Veuillez remplir les champs obligatoires.' });
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description || "");
    data.append("price", String(Number(formData.price)));
    data.append("stock", String(Number(formData.stock)));
    data.append("category_id", String(Number(formData.category)));
    if (formData.image instanceof File) data.append("image", formData.image);

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        setFeedback({ type: 'success', message: 'Produit modifié.' });
      } else {
        await productService.createProduct(data);
        setFeedback({ type: 'success', message: 'Produit ajouté.' });
      }
      setFormData({ name:'', description:'', price:'', stock:'', category:'', image:null });
      setEditingProduct(null);
      setShowProductForm(false);
      await refreshProducts();
    } catch (err) {
      const data = err.response?.data;
      const details =
        data && typeof data === 'object'
          ? Object.entries(data.errors || data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : err.message;
      setFeedback({ type: 'error', message: `Erreur : ${details}` });
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category?.id || '',
      image: null,
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await productService.deleteProduct(id);
      setFeedback({ type: 'success', message: 'Produit supprimé.' });
      await refreshProducts();
    } catch (err) {
      // Un produit déjà commandé est protégé en base : il se dépublie au lieu
      // de se supprimer, sinon les commandes passées perdraient leur référence.
      setFeedback({
        type: 'error',
        message:
          err.response?.status === 409
            ? 'Ce produit figure dans des commandes : dépubliez-le au lieu de le supprimer.'
            : `Erreur : ${err.response?.data?.detail || err.message}`,
      });
    }
  };

  // --- Filtered lists ---
  // Les champs texte peuvent être nuls côté API : la recherche doit les tolérer
  // plutôt que de faire planter le rendu de toute la liste.
  const matches = (value, term) => String(value ?? '').toLowerCase().includes(term.toLowerCase());

  const filteredProducts = products.filter(p => matches(p.name, searchProduct));
  const filteredOrders = orders.filter(o =>
    matches(o.id, searchOrder) ||
    matches(o.user, searchOrder) ||
    matches(o.delivery_name, searchOrder) ||
    matches(o.invoice?.number, searchOrder)
  );
  const filteredUsers = users.filter(u =>
    matches(u.full_name, searchUser) || matches(u.email, searchUser) || matches(u.phone, searchUser)
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0">
          <div className="p-6 text-center font-bold text-xl border-b border-gray-200 dark:border-gray-700">Admin Panel</div>
          <nav className="p-4 space-y-2">
            <button onClick={()=>setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 w-full rounded hover:bg-blue-600 hover:text-white transition ${activeTab==='overview'?'bg-blue-600 text-white':''}`}><FaUsers /> Aperçu</button>
            <button onClick={()=>setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 w-full rounded hover:bg-blue-600 hover:text-white transition ${activeTab==='users'?'bg-blue-600 text-white':''}`}><FaUsers /> Utilisateurs</button>
            <button onClick={()=>setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 w-full rounded hover:bg-blue-600 hover:text-white transition ${activeTab==='orders'?'bg-blue-600 text-white':''}`}><FaShoppingCart /> Commandes</button>
            <button onClick={()=>setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 w-full rounded hover:bg-blue-600 hover:text-white transition ${activeTab==='products'?'bg-blue-600 text-white':''}`}><FaBox /> Produits</button>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard Admin</h1>
            <button onClick={()=>setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">{darkMode?<FaSun />:<FaMoon />}</button>
          </header>

          {feedback && (
            <div className={`rounded-lg p-4 mb-6 border ${
              feedback.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
            }`}>
              <p className="text-sm">{feedback.message}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400"><div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-2"></div>Chargement...</div>
          ) : (
            <>
              {/* Overview tab */}
              {activeTab==='overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 dark:text-gray-400">Total Utilisateurs</p>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 dark:text-gray-400">Total Commandes</p>
                    <p className="text-3xl font-bold">{orders.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Encaissé : {formatMoney(revenue)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition">
                    <p className="text-gray-500 dark:text-gray-400">Produits en stock</p>
                    <p className="text-3xl font-bold">{products.length}</p>
                  </div>
                </div>
              )}

              {/* Users tab */}
              {activeTab==='users' && (
                <>
                  <div className="mb-4 relative max-w-xs">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" placeholder="Rechercher utilisateur..." value={searchUser} onChange={e=>setSearchUser(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2">Nom</th>
                          <th className="px-4 py-2">Email</th>
                          <th className="px-4 py-2">Téléphone</th>
                          <th className="px-4 py-2">Rôle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u=>(
                          <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                            <td className="px-4 py-2">{u.full_name}</td>
                            <td className="px-4 py-2">{u.email}</td>
                            <td className="px-4 py-2">{u.phone}</td>
                            <td className="px-4 py-2">{u.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Orders tab */}
{activeTab==='orders' && (
  <>
    <div className="mb-4 relative max-w-xs">
      <FaSearch className="absolute left-3 top-3 text-gray-400" />
      <input 
        type="text" 
        placeholder="Rechercher commande..." 
        value={searchOrder} 
        onChange={e=>setSearchOrder(e.target.value)} 
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" 
      />
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Client</th>
            <th className="px-4 py-2">Adresse</th>
            <th className="px-4 py-2">Ville</th>
            <th className="px-4 py-2">Articles</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Statut</th>
            <th className="px-4 py-2">Facture</th>
            <th className="px-4 py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(o=>(
            <tr key={o.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
              <td className="px-4 py-2">#{o.id}</td>
              <td className="px-4 py-2">{o.delivery_name}</td>
              <td className="px-4 py-2">{o.delivery_address}</td>
              <td className="px-4 py-2">{o.delivery_city}</td>

              <td className="px-4 py-2">
                {/* Afficher les produits */}
                <div className="space-y-1">
                  {o.items_data && o.items_data.length > 0 ? (
                    o.items_data.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.product.name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          : {item.quantity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500">Aucun produit</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2 font-bold text-blue-600 dark:text-blue-400">
                {formatMoney(o.total_price)}
              </td>
              <td className="px-4 py-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  o.status === 'completed' ? 'bg-green-100 text-green-800' :
                  o.status === 'canceled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {o.status_display || o.status}
                </span>
              </td>
              <td className="px-4 py-2 text-sm">
                {o.invoice?.number ? (
                  <a
                    href={orderService.getInvoicePrintUrl(o.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <FaFileInvoice /> {o.invoice.number}
                  </a>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                {new Date(o.created_at).toLocaleDateString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)}

              {/* Products tab */}
              {activeTab==='products' && (
                <>
                  <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                    <button onClick={()=>{ setEditingProduct(null); setFormData({ name:'', description:'', price:'', stock:'', category:'', image:null }); setShowProductForm(!showProductForm); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"><FaPlus /> Ajouter</button>
                    <div className="relative flex-1 max-w-xs">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input type="text" placeholder="Rechercher produit..." value={searchProduct} onChange={e=>setSearchProduct(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                    </div>
                  </div>
                  {showProductForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border-l-4 border-blue-600">
                      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editingProduct?'Modifier':'Ajouter'} produit</h3>
                      <form onSubmit={handleAddOrEditProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nom *" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                        <input type="number" placeholder="Prix *" value={formData.price} onChange={e=>setFormData({...formData,price:e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                        <input type="number" placeholder="Stock *" value={formData.stock} onChange={e=>setFormData({...formData,stock:e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                        <select value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                          <option value="">Catégorie *</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <textarea placeholder="Description" value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} className="col-span-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                        {editingProduct && editingProduct.image_url && !formData.image && <img src={editingProduct.image_url} alt={editingProduct.name} className="col-span-2 w-32 h-32 object-cover mb-2" />}
                        <input type="file" accept="image/*" onChange={e=>setFormData({...formData,image:e.target.files?.[0]})} className="col-span-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                        <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">{editingProduct?'Modifier':'Ajouter'}</button>
                      </form>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(p=>(
                      <div key={p.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow hover:shadow-lg transition">
                        <img src={p.image_url || '/assets/images/placeholder.jpg'} alt={p.name} className="w-full h-40 object-cover rounded-lg mb-3"/>
                        <h4 className="font-bold mb-1">{p.name}</h4>
                        <p className="text-blue-600 dark:text-blue-400 font-bold mb-1">{formatMoney(p.price)}</p>
                        <p className="text-gray-500 dark:text-gray-300 mb-2">Stock: {p.stock}</p>
                        <div className="flex gap-2">
                          <button onClick={()=>handleEditProduct(p)} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"><FaEdit /> Modifier</button>
                          <button onClick={()=>handleDeleteProduct(p.id)} className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 transition"><FaTrash /> Supprimer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
