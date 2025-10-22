import React, { useState, useEffect } from 'react';
import { FaUsers, FaShoppingCart, FaBox, FaPlus, FaEdit, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import apiClient from '../services/apiClient';
import productService from '../services/productService';
import orderService from '../services/orderService';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '1',
    image: null,
  });

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'products') loadProducts();
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Chargement utilisateurs...');
      const response = await apiClient.get('users/');
      console.log('Réponse utilisateurs:', response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erreur utilisateurs complète:', err);
      setError(`Erreur chargement utilisateurs: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Chargement commandes...');
      const response = await orderService.getOrders();
      console.log('Réponse commandes:', response.data);
      const data = response.data.results || response.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur commandes complète:', err);
      setError(`Erreur chargement commandes: ${err.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Chargement produits...');
      const response = await productService.getProducts();
      console.log('Réponse produits:', response.data);
      const data = response.data.results || response.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur produits complète:', err);
      setError(`Erreur chargement produits: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.price || !formData.stock) {
        alert('Veuillez remplir les champs obligatoires');
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('slug', formData.name.toLowerCase().replace(/\s+/g, '-'));
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category || 1);
      if (formData.image) data.append('image', formData.image);

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        alert('Produit modifié');
      } else {
        await productService.createProduct(data);
        alert('Produit ajouté');
      }

      setFormData({ name: '', description: '', price: '', stock: '', category: '1', image: null });
      setEditingProduct(null);
      setShowProductForm(false);
      loadProducts();
    } catch (err) {
      console.error('Erreur produit:', err);
      alert('Erreur: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Supprimer ce produit?')) return;

    try {
      await productService.deleteProduct(productId);
      alert('Produit supprimé');
      loadProducts();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category?.id || '1',
      image: null,
    });
    setShowProductForm(true);
  };

  const filteredData = (data) => {
    return data.filter(item => {
      const search = searchTerm.toLowerCase();
      if (activeTab === 'users') {
        return (item.username?.toLowerCase() || '').includes(search) || (item.email?.toLowerCase() || '').includes(search);
      }
      if (activeTab === 'orders') {
        return item.id?.toString().includes(search) || (item.user?.username?.toLowerCase() || '').includes(search);
      }
      if (activeTab === 'products') {
        return (item.name?.toLowerCase() || '').includes(search);
      }
      return true;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Admin</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Gestion complète de votre plateforme</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 pb-12">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <FaExclamationTriangle className="text-red-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-red-600 dark:text-red-400 font-semibold">Erreur</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">Ouvrez la console (F12) pour plus de détails</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-6 flex-wrap">
          <button onClick={() => { setActiveTab('users'); setError(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}><FaUsers /> Utilisateurs ({users.length})</button>
          <button onClick={() => { setActiveTab('orders'); setError(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}><FaShoppingCart /> Commandes ({orders.length})</button>
          <button onClick={() => { setActiveTab('products'); setError(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'}`}><FaBox /> Produits ({products.length})</button>
        </div>

        <div className="mb-6 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700" />
        </div>

        {loading && <div className="text-center py-12 text-gray-500"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div><p>Chargement...</p></div>}

        {!loading && activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="px-6 py-4 text-left font-semibold">ID</th><th className="px-6 py-4 text-left font-semibold">Nom</th><th className="px-6 py-4 text-left font-semibold">Email</th><th className="px-6 py-4 text-left font-semibold">Date</th><th className="px-6 py-4 text-left font-semibold">Statut</th></tr></thead>
                <tbody>
                  {filteredData(users).length > 0 ? filteredData(users).map(u => <tr key={u.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"><td className="px-6 py-4">{u.id}</td><td className="px-6 py-4 font-medium">{u.username}</td><td className="px-6 py-4">{u.email}</td><td className="px-6 py-4">{new Date(u.date_joined).toLocaleDateString('fr-FR')}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Actif' : 'Inactif'}</span></td></tr>) : <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Aucun utilisateur</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="px-6 py-4 text-left font-semibold">ID</th><th className="px-6 py-4 text-left font-semibold">Utilisateur</th><th className="px-6 py-4 text-left font-semibold">Total</th><th className="px-6 py-4 text-left font-semibold">Statut</th><th className="px-6 py-4 text-left font-semibold">Date</th></tr></thead>
                <tbody>
                  {filteredData(orders).length > 0 ? filteredData(orders).map(o => <tr key={o.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"><td className="px-6 py-4">#{o.id}</td><td className="px-6 py-4 font-medium">{o.user?.username}</td><td className="px-6 py-4 font-bold text-blue-600">{o.total_price} FCFA</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${o.status === 'completed' ? 'bg-green-100 text-green-800' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{o.status}</span></td><td className="px-6 py-4">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td></tr>) : <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">Aucune commande</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'products' && (
          <div>
            <button onClick={() => { setEditingProduct(null); setFormData({ name: '', description: '', price: '', stock: '', category: '1', image: null }); setShowProductForm(!showProductForm); }} className="mb-6 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"><FaPlus /> Ajouter un produit</button>

            {showProductForm && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border-l-4 border-blue-600">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{editingProduct ? 'Modifier' : 'Ajouter'} produit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Nom *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  <input type="number" placeholder="Prix *" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  <input type="number" placeholder="Stock *" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  <input type="number" placeholder="Catégorie" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="col-span-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, image: e.target.files?.[0]})} className="col-span-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  <button onClick={handleAddProduct} className="col-span-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">{editingProduct ? 'Modifier' : 'Ajouter'}</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData(products).length > 0 ? filteredData(products).map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                  <img src={p.image_url || '/assets/images/placeholder.jpg'} alt={p.name} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{p.name}</h4>
                    <p className="text-blue-600 dark:text-blue-400 font-bold mb-3">{p.price} FCFA</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Stock: {p.stock}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditProduct(p)} className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 transition"><FaEdit /> Modifier</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 transition"><FaTrash /> Supprimer</button>
                    </div>
                  </div>
                </div>
              )) : <div className="col-span-3 text-center py-8 text-gray-500">Aucun produit</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}