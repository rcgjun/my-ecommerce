'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminProductForm from '@/components/AdminProductForm';
import {
  getSession,
  signOut,
  getProducts,
  getOrders,
  deleteProduct,
  updateOrderStatus,
  getSalesAnalytics,
  getCoverPhotoUrl,
  updateCoverPhotoUrl,
  Product,
  OrderWithProduct,
} from '@/lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Trash2,
  DollarSign,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

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
        console.log('Loading products...');
        const productsData = await getProducts();
        console.log('Products loaded:', productsData.length);
        setProducts(productsData);
      }
      if (activeTab === 'orders') {
        console.log('Loading orders...');
        const ordersData = await getOrders();
        console.log('Orders loaded:', ordersData.length, ordersData);
        setOrders(ordersData || []);
      }
      if (activeTab === 'analytics') {
        console.log('Loading analytics...');
        const analyticsData = await getSalesAnalytics();
        console.log('Analytics loaded:', analyticsData);
        setAnalytics(analyticsData);
      }
      if (activeTab === 'cover-photo') {
        const coverUrl = await getCoverPhotoUrl();
        setCoverPhotoUrl(coverUrl === 'default' ? '' : coverUrl);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Error loading data: ${errorMessage}\n\nCheck browser console (F12) for details.`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
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

  const handleUpdateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'delivered' | 'returned') => {
    try {
      await updateOrderStatus(orderId, status);
      await loadData();
      alert('Order status updated successfully!');
    } catch (error: any) {
      console.error('Error updating order:', error);
      alert('Error updating order: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleCoverPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverPhotoUrl.trim()) {
      alert('Please enter a valid image URL');
      return;
    }

    setUploadingCover(true);
    try {
      await updateCoverPhotoUrl(coverPhotoUrl);
      alert('Cover photo updated successfully! Visit homepage to see changes.');
    } catch (error) {
      console.error('Error updating cover photo:', error);
      alert('Error updating cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (confirm('Remove cover photo and use default gradient?')) {
      setUploadingCover(true);
      try {
        await updateCoverPhotoUrl('default');
        setCoverPhotoUrl('');
        alert('Cover photo removed! Homepage will show default gradient.');
      } catch (error) {
        console.error('Error removing cover photo:', error);
        alert('Error removing cover photo');
      } finally {
        setUploadingCover(false);
      }
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
                { id: 'cover-photo', label: 'Cover Photo', icon: ImageIcon },
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

            {/* Cover Photo Tab */}
            {activeTab === 'cover-photo' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="text-blue-600" />
                  Manage Cover Photo
                </h3>
                
                <div className="max-w-2xl space-y-6">
                  {/* Current Cover Preview */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700">Current Cover Photo</p>
                    </div>
                    <div className="relative h-64 bg-gray-100">
                      {coverPhotoUrl ? (
                        <img
                          src={coverPhotoUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.alt = 'Failed to load image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
                          <div className="text-center text-white">
                            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Default Gradient Background</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Form */}
                  <form onSubmit={handleCoverPhotoSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Photo URL
                      </label>
                      <input
                        type="url"
                        value={coverPhotoUrl}
                        onChange={(e) => setCoverPhotoUrl(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/your-cover-image.jpg"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Enter the URL of your cover image. Recommended size: 1920x600px
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">📸 Where to get image URLs:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Upload to <a href="https://imgur.com" target="_blank" className="underline">Imgur.com</a> (free)</li>
                        <li>• Use <a href="https://unsplash.com" target="_blank" className="underline">Unsplash.com</a> (free stock photos)</li>
                        <li>• Upload to your hosting and use full URL</li>
                        <li>• Use <a href="https://imagekit.io" target="_blank" className="underline">ImageKit.io</a> or <a href="https://cloudinary.com" target="_blank" className="underline">Cloudinary.com</a></li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={uploadingCover}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingCover ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Upload size={20} />
                            Update Cover Photo
                          </>
                        )}
                      </button>
                      
                      {coverPhotoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCoverPhoto}
                          disabled={uploadingCover}
                          className="px-6 py-3 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Remove Cover
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Tips */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">💡 Tips for Best Results:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Use high-quality images (1920x600px recommended)</li>
                      <li>• Ensure text will be readable on the image (avoid busy backgrounds)</li>
                      <li>• Keep file size under 500KB for fast loading</li>
                      <li>• Test on mobile and desktop after updating</li>
                      <li>• Image will have a dark overlay for better text readability</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Add Product Tab - NOW USING AdminProductForm */}
            {activeTab === 'add-product' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Add New Product
                </h3>
                <AdminProductForm 
                  onSuccess={() => {
                    setActiveTab('products');
                    loadData();
                  }}
                  onCancel={() => setActiveTab('products')}
                />
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Inventory</h3>
                <div className="grid gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <img 
                        src={product.variations?.[0]?.images?.[0] || 'https://via.placeholder.com/80'} 
                        alt={product.title} 
                        className="w-20 h-20 object-cover rounded" 
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.title}</h4>
                        <p className="text-sm text-gray-600">${product.price}</p>
                        <div className="flex gap-1 mt-1">
                          {product.variations?.map((variation, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: variation.hex }}
                              title={variation.name}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
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
                
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ShoppingCart size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">No orders yet</p>
                    <p className="text-sm text-gray-500 mt-1">Orders will appear here when customers place them</p>
                  </div>
                ) : (
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
                          <div className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}