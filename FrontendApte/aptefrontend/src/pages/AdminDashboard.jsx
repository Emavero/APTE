import React, { useState, useEffect } from 'react';
import { FaUsers, FaShoppingCart, FaBox, FaMoon, FaSun, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import authService from '../services/authService';
import orderService from '../services/orderService';
import productService from '../services/productService';

export default function AdminDashboardPro() {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product CRUD states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name:'', description:'', price:'', stock:'', category:'1', image:null });

  // Search states
  const [searchProduct, setSearchProduct] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const u = await authService.getListUsers();
        const o = await orderService.getOrders();
        const p = await productService.getProducts();
        setUsers(u.data.results || u.data || []);
        setOrders(o.data.results || o.data || []);
        setProducts(p.data.results || p.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Graph data ---
  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Paid', value: orders.filter(o => o.status === 'paid').length },
    { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
    { name: 'Completed', value: orders.filter(o => o.status === 'completed').length },
    { name: 'Canceled', value: orders.filter(o => o.status === 'canceled').length },
  ];
  const COLORS = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd'];
  const monthlySalesData = Array.from({length:12}, (_, i) => {
    const month = i+1;
    const total = orders.filter(o => new Date(o.created_at).getMonth() === i)
                        .reduce((sum, o) => sum + (o.total_price || 0), 0);
    return { month:`${month}`, total };
  });

  // --- Helpers ---
  function generateSlug(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
               .replace(/[^a-z0-9_-]/g, "-").replace(/--+/g, "-").replace(/^-+|-+$/g, "");
  }

  // --- Product CRUD ---
  const handleAddOrEditProduct = async (e) => {
    e.preventDefault();
    if(!formData.name || !formData.price || !formData.stock) { alert('Veuillez remplir les champs obligatoires'); return; }
    const data = new FormData();
    data.append("name", formData.name);
    data.append("slug", generateSlug(formData.name));
    data.append("description", formData.description || "");
    data.append("price", Number(formData.price));
    data.append("stock", Number(formData.stock));
    data.append("category_id", Number(formData.category));
    if(formData.image instanceof File) data.append("image", formData.image);

    try {
      if(editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        alert('Produit modifié');
      } else {
        await productService.createProduct(data);
        alert('Produit ajouté');
      }
      setFormData({ name:'', description:'', price:'', stock:'', category:'1', image:null });
      setEditingProduct(null);
      setShowProductForm(false);
      const p = await productService.getProducts();
      setProducts(p.data.results || p.data || []);
    } catch(err) {
      console.error(err);
      alert('Erreur: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message));
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
      image: product.image || null,
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm('Supprimer ce produit ?')) return;
    try {
      await productService.deleteProduct(id);
      alert('Produit supprimé');
      const p = await productService.getProducts();
      setProducts(p.data.results || p.data || []);
    } catch(err) { console.error(err); alert('Erreur: ' + err.message); }
  };

  // --- Filtered lists ---
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()));
  const filteredOrders = orders.filter(o => 
    String(o.delivery_address).includes(searchOrder) || 
    String(o.created_at).toLowerCase().includes(searchOrder.toLowerCase())

  );
  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
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
                    <input type="text" placeholder="Rechercher commande..." value={searchOrder} onChange={e=>setSearchOrder(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2">Nom</th>
                          <th className="px-4 py-2">Téléphone</th>
                          <th className="px-4 py-2">Adresse</th>
                          <th className="px-4 py-2">Ville</th>
                          <th className="px-4 py-2">Total</th>
                          <th className="px-4 py-2">M. de paiement</th>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map(o=>(
                          <tr key={o.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                            <td className="px-4 py-2">{o.delivery_name}</td>
                            <td className="px-4 py-2">{o.delivery_phone}</td>
                            <td className="px-4 py-2">{o.delivery_address}</td>
                            <td className="px-4 py-2">{o.delivery_city}</td>
                            <td className="px-4 py-2">{o.total_price} FCFA</td>
                            <td className="px-4 py-2">{o.payment_method}</td>
                            <td className="px-4 py-2">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{o.status}</td>
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
                    <button onClick={()=>{ setEditingProduct(null); setFormData({ name:'', description:'', price:'', stock:'', category:'1', image:null }); setShowProductForm(!showProductForm); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"><FaPlus /> Ajouter</button>
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
                        <input type="number" placeholder="Catégorie" value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})} className="px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600" />
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
                        <p className="text-blue-600 dark:text-blue-400 font-bold mb-1">{p.price} FCFA</p>
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
