'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSession,
  signOut,
  getProducts,
  getOrders,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  getSalesAnalytics,
  Product,
  Order,
} from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Plus,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    image_url: '',
    colors: '',
  });
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [activeTab, loading]);

  const checkAuth = async () => {
    try {
      const session = await getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    } catch (error) {
      router.push('/admin/login');
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'products' || activeTab === 'add-product') {
        const productsData = await getProducts();
        setProducts(productsData);
      }
      if (activeTab === 'orders') {
        const ordersData = await getOrders();
        setOrders(ordersData);
      }
      if (activeTab === 'analytics') {
        const analyticsData = await getSalesAnalytics();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        title: productForm.title,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url,
        colors: productForm.colors.split(',').map(c => c.trim()),
      };

      if (editingProduct) {
        await updateProduct(editingProduct, productData);
      } else {
        await createProduct(productData);
      }

      setProductForm({ title: '', description: '', price: '', image_url: '', colors: '' });
      setEditingProduct(null);
      loadData();
      alert(editingProduct ? 'Product updated!' : 'Product added!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    setProductForm({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
      colors: product.colors.join(', '),
    });
    setActiveTab('add-product');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      loadData();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${analytics.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={48} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Products Sold</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalSold}</p>
                </div>
                <Package className="text-blue-600" size={48} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold text-purple-600">{orders.length}</p>
                </div>
                <ShoppingCart className="text-purple-600" size={48} />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'add-product', label: 'Add Product', icon: Plus },
                { id: 'products', label: 'Inventory', icon: Package },
                { id: 'orders', label: 'Orders', icon: ShoppingCart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Product Tab */}
            {activeTab === 'add-product' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <form onSubmit={handleProductSubmit} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colors (comma-separated) *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.colors}
                      onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="#FF0000, #00FF00, #0000FF"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ title: '', description: '', price: '', image_url: '', colors: '' });
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Inventory</h3>
                <div className="grid gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <img src={product.image_url} alt={product.title} className="w-20 h-20 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.title}</h4>
                        <p className="text-sm text-gray-600">${product.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h3>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{order.name}</h4>
                          <p className="text-sm text-gray-600">{order.phone}</p>
                          <p className="text-sm text-gray-600">{order.address}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-sm text-gray-600">
                          Color: <span className="font-medium">{order.color}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Total: <span className="font-bold text-green-600">${order.total_price}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                          >
                            Mark Delivered
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'returned')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                        >
                          Mark Returned
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}