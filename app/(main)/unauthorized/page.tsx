'use client';

import Link from 'next/link';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center">
            <ShieldX className="text-red-400 w-12 h-12" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        
        {/* Description */}
        <p className="text-gray-400 mb-8">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>

        {/* Error Code */}
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 mb-8">
          <div className="text-gray-500 text-sm mb-1">Error Code</div>
          <div className="text-red-400 font-mono text-lg">403 - Forbidden</div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-gray-500 text-sm">
          If you believe this is an error, please contact the administrator.
        </p>
      </div>
    </div>
  );
}

