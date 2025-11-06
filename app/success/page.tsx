'use client';

import Link from 'next/link';
import { CheckCircle, Home, Package } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="text-white" size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Order Placed Successfully!
        </h1>
        
        <p className="text-gray-600 mb-2">
          Thank you for your order. We've received your request and will confirm it soon.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-blue-800 mb-2">
            <Package size={20} />
            <span className="font-semibold">What's Next?</span>
          </div>
          <p className="text-sm text-blue-700">
            Our team will review your order and contact you shortly to confirm the details and delivery timeline.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Continue Shopping
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          You can close this page now or browse more products
        </p>
      </div>
    </div>
  );
}