'use client';

import Link from 'next/link';
import { AlertTriangle, Trophy, Trash2, ArrowLeft, Mail } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-400 mb-10">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        {/* Warning Banner */}
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Important Notice</h2>
              <p className="text-gray-300">
                Please read this policy carefully before making a purchase. Requesting a refund has 
                permanent consequences for your Hall of Fame placement and project visibility.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-8 text-gray-300 leading-relaxed">
          {/* Refund Eligibility */}
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Refund Eligibility</h2>
            <p className="mb-4">
              We offer refunds within <span className="text-[#d4a017] font-semibold">14 days</span> of 
              purchase for any reason. To request a refund, contact us with your order details.
            </p>
            <p className="text-gray-400 text-sm">
              Refunds are processed back to the original payment method within 5-10 business days.
            </p>
          </div>

          {/* Consequences Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-red-400">⚠️</span>
              Consequences of Refunding
            </h2>
            
            <div className="space-y-4">
              {/* Hall of Fame Removal */}
              <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy className="text-yellow-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Loss of Hall of Fame Position
                    </h3>
                    <p className="text-gray-400">
                      If you have secured a Hall of Fame position, requesting a refund will 
                      <span className="text-red-400 font-semibold"> permanently remove your spot</span>. 
                      Your position will be released and made available for others to claim. 
                      There is no way to recover your original position once released.
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Removal */}
              <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trash2 className="text-red-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Project Removal
                    </h3>
                    <p className="text-gray-400">
                      Your project will be <span className="text-red-400 font-semibold">completely removed</span> from 
                      Slopcel. This includes removal from the Hall of Fame showcase, the projects gallery, 
                      and any other public listings. All associated project data will be deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-gradient-to-r from-[#d4a017]/10 to-transparent border border-[#d4a017]/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#d4a017] mb-3">In Summary</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-[#d4a017]">•</span>
                <span>Refunds are available within 14 days of purchase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Refunding = Losing your Hall of Fame position forever</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Refunding = Complete removal of your project from Slopcel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4a017]">•</span>
                <span>Your position will be opened up for others to purchase</span>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="text-[#d4a017]" size={20} />
              <h2 className="text-xl font-semibold text-white">Request a Refund</h2>
            </div>
            <p className="text-gray-400 mb-4">
              To request a refund, reach out to us with your order ID and the email associated 
              with your account. We'll process your request within 2-3 business days.
            </p>
            <a 
              href="https://x.com/_madiou" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#d4a017] hover:underline"
            >
              Contact us on X/Twitter @_madiou
            </a>
          </div>
        </section>

        <div className="mt-12 flex gap-4">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/hall-of-fame" className="btn-secondary">
            View Hall of Fame
          </Link>
        </div>
      </main>
    </div>
  );
}

