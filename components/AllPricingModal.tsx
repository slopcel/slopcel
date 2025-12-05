'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AllPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TierData {
  tier: 'premium' | 'standard' | 'hall_of_fame' | 'bare_minimum';
  title: string;
  price: string;
  description: string;
  badge?: string;
  features: string[];
  buttonText: string;
  borderClass: string;
  amount: number;
}

export default function AllPricingModal({
  isOpen,
  onClose,
}: AllPricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    premium: boolean | null;
    standard: boolean | null;
    hallOfFame: boolean | null;
  }>({
    premium: null,
    standard: null,
    hallOfFame: null,
  });

  useEffect(() => {
    if (isOpen) {
      checkAvailability();
    }
  }, [isOpen]);

  const checkAvailability = async () => {
    const supabase = createClient();
    
    const [premium, standard, hallOfFame] = await Promise.all([
      supabase.rpc('check_tier_availability', { amount_cents: 30000 }),
      supabase.rpc('check_tier_availability', { amount_cents: 15000 }),
      supabase.rpc('check_tier_availability', { amount_cents: 7500 }),
    ]);

    setAvailability({
      premium: premium.data ?? null,
      standard: standard.data ?? null,
      hallOfFame: hallOfFame.data ?? null,
    });
  };

  const tiers: TierData[] = [
    {
      tier: 'premium',
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
      amount: 30000,
    },
    {
      tier: 'standard',
      title: 'Standard',
      price: '$150',
      description: 'Hall of Fame positions 2-11',
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
      amount: 15000,
    },
    {
      tier: 'hall_of_fame',
      title: 'Hall of Famer',
      price: '$75',
      description: 'Hall of Fame positions 12-100',
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
      amount: 7500,
    },
    {
      tier: 'bare_minimum',
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
      amount: 5000,
    },
  ];

  const getAvailabilityStatus = (tier: TierData) => {
    if (tier.tier === 'bare_minimum') return null;
    
    const avail = tier.tier === 'premium' 
      ? availability.premium 
      : tier.tier === 'standard' 
      ? availability.standard 
      : availability.hallOfFame;
    
    return avail;
  };

  const handleCheckout = async (tier: TierData) => {
    setLoading(tier.tier);
    try {
      const response = await fetch('/api/dodo/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: tier.tier }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        if (data.requiresAuth) {
          window.location.href = '/login';
        } else {
          toast.error(data.error);
          setLoading(null);
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout. Please try again.');
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d0d] border border-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 text-gray-400 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="p-3 sm:p-4 border-b border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center">Pricing</h2>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar" style={{ padding: '12px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier) => {
              const isSoldOut = tier.tier !== 'bare_minimum' && getAvailabilityStatus(tier) === false;
              const isAvailable = tier.tier !== 'bare_minimum' && getAvailabilityStatus(tier) === true;
              const isLoading = loading === tier.tier;

              return (
                <div
                  key={tier.tier}
                  className={`bg-[#141414] ${tier.borderClass} rounded-lg p-4 sm:p-6 relative flex flex-col`}
                >
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                      {tier.badge}
                    </div>
                  )}
                  
                  <div className="text-center flex flex-col flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">{tier.title}</h3>
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-4">{tier.price}</div>
                    <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">{tier.description}</p>
                    
                    <ul className="text-left space-y-2 mb-4 sm:mb-6 flex-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="text-gray-300 text-xs sm:text-sm">{feature}</li>
                      ))}
                    </ul>

                    {isSoldOut && (
                      <p className="text-red-400 text-sm mb-4">
                        {tier.tier === 'premium' ? 'Sold out' : 'All spots taken'}
                      </p>
                    )}
                    {isAvailable && (
                      <p className="text-[#d4a017] text-sm mb-4">
                        {tier.tier === 'premium'
                          ? 'Position #1 available'
                          : tier.tier === 'standard'
                          ? 'Positions 2-11 available'
                          : 'Positions 12-100 available'}
                      </p>
                    )}

                    <button
                      onClick={() => handleCheckout(tier)}
                      disabled={isLoading || isSoldOut}
                      className="btn-primary w-full mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading
                        ? 'Loading...'
                        : isSoldOut
                        ? 'Sold Out'
                        : tier.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

