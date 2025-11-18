'use client';

import { useEffect, useState } from 'react';
import { getProducts, Product, getCoverPhotoUrl } from '@/lib/supabase';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverImage, setCoverImage] = useState<string>('default');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCoverImage();
  }, []);

  const loadCoverImage = async () => {
    try {
      const url = await getCoverPhotoUrl();
      if (url && url !== 'default') {
        setCoverImage(url);
        setImageError(false);
      } else {
        setImageError(true);
      }
    } catch (error) {
      console.error('Error loading cover image:', error);
      setImageError(true);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Dynamic Cover */}
      <div className="relative h-96 overflow-hidden">
        {!imageError && coverImage !== 'default' ? (
          // Custom cover image from URL
          <>
            <img
              src={coverImage}
              alt="Store Cover"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50"></div>
          </>
        ) : (
          // Default gradient background if no cover image
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            <div className="absolute inset-0 bg-black/10"></div>
          </>
        )}
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
              Welcome to Our Store
            </h1>
            <p className="text-xl text-white mb-8 drop-shadow-xl">
              Discover amazing products at unbeatable prices
            </p>
            <a
              href="#products"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-xl transform hover:scale-105 hover:-translate-y-1"
            >
              Shop Now <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Our Products</h2>
          <p className="text-gray-600 mt-2">Browse our collection of quality products</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products yet</h3>
            <p className="text-gray-500">Check back soon for amazing products!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img
                    src={product.variations[0]?.images[0] || 'https://via.placeholder.com/400'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ${product.price}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Colors:</span>
                    <div className="flex gap-1">
                      {product.variations.slice(0, 4).map((variation, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: variation.hex }}
                          title={variation.name}
                        ></div>
                      ))}
                      {product.variations.length > 4 && (
                        <span className="text-xs text-gray-500">+{product.variations.length - 4}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 Your Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}