'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum';
  availability?: boolean | null;
  onCheckout: (tier: 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum') => void;
  loading?: boolean;
}

export default function PricingModal({
  isOpen,
  onClose,
  tier,
  availability,
  onCheckout,
  loading = false,
}: PricingModalProps) {
  if (!isOpen) return null;

  const getTierData = () => {
    switch (tier) {
      case 'premium':
        return {
          title: 'Premium',
          price: '$300',
          description: 'Hall of Fame position #1',
          badge: '#1 SPOT',
          features: [
            '✓ 1 app deployment',
            '✓ #1 Hall of Fame position',
            '✓ Premium design',
            '✓ Premium functionalities',
            '✓ Complete access to code and repo',
            '✓ Priority support',
          ],
          buttonText: 'Get Position #1',
          borderClass: 'border-2 border-yellow-400/50',
        };
      case 'standard':
        return {
          title: 'Standard',
          price: '$150',
          description: 'Hall of Fame positions 2-10',
          features: [
            '✓ 1 app deployment',
            '✓ Hall of Fame (positions 2-11)',
            '✓ Better design',
            '✓ Premium functionalities',
            '✓ Complete access to code and repo',
            '✓ Support (up to 3 revisions)',
          ],
          buttonText: 'Get Your Spot',
          borderClass: 'border border-gray-800',
        };
      case 'hall_of_fame':
        return {
          title: 'Hall of Famer',
          price: '$75',
          description: 'Hall of Fame positions 11-100',
          features: [
            '✓ 1 app deployment',
            '✓ Hall of Fame (positions 12-100)',
            '✓ Slightly better design',
            '✓ Premium functionalities',
            '✓ Complete access to code and repo',
            '✓ Support (up to 3 revisions)',
          ],
          buttonText: 'Get Your Spot',
          borderClass: 'border border-gray-800',
        };
      case 'bare_minimum':
        return {
          title: 'The Bare Minimum',
          price: '$50',
          description: 'Host 1 slop app (no Hall of Fame)',
          features: [
            '✓ 1 app deployment',
            '✓ Complete access to code and repo',
            '✓ Complimentary regret',
            '✗ Support (I\'m busy)',
            '✗ Hall of Fame placement',
          ],
          buttonText: 'Get Started',
          borderClass: 'border border-gray-800',
        };
    }
  };

  const tierData = getTierData();
  const isSoldOut = availability === false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-[#0d0d0d] ${tierData.borderClass} rounded-lg p-8 max-w-[380px] w-full relative flex`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center flex flex-col w-full">
          {tierData.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
              {tierData.badge}
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2 text-white">{tierData.title}</h3>
          <div className="text-4xl font-bold text-white mb-4">{tierData.price}</div>
          <p className="text-gray-400 mb-6">{tierData.description}</p>
          <ul className="text-left space-y-2 mb-8">
            {tierData.features.map((feature, index) => (
              <li key={index} className="text-gray-300">{feature}</li>
            ))}
          </ul>
          {isSoldOut && (
            <p className="text-red-400 text-sm mb-4">
              {tier === 'premium' ? 'Sold out' : 'All spots taken'}
            </p>
          )}
          {!isSoldOut && tier !== 'bare_minimum' && availability === true && (
            <p className="text-[#d4a017] text-sm mb-4">
              {tier === 'premium'
                ? 'Position #1 available'
                : tier === 'standard'
                ? 'Positions 2-11 available'
                : 'Positions 12-100 available'}
            </p>
          )}
          <button
            onClick={() => onCheckout(tier)}
            disabled={loading || isSoldOut}
            className="btn-primary w-full mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Loading...'
              : isSoldOut
              ? 'Sold Out'
              : tierData.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

