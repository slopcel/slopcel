'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paypalOrderId = searchParams.get('token'); // PayPal returns token param
  const supabase = createClient();

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    // Check if user is already logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setIsLoggedIn(true);
      setCustomerEmail(user.email || null);
    }
    
    // If we have a PayPal order ID, capture the payment
    if (paypalOrderId) {
      setCapturing(true);
      try {
        const captureResponse = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: paypalOrderId }),
        });

        if (captureResponse.ok) {
          const captureData = await captureResponse.json();
          setPaymentComplete(true);
          
          if (captureData.email) {
            setCustomerEmail(captureData.email);
            setEmail(captureData.email);
          }
          
          // If user is logged in, try to link orders
          if (user) {
            try {
              await fetch('/api/orders/link-by-email', { method: 'POST' });
            } catch (e) {
              console.error('Error linking orders:', e);
            }
          }
        } else {
          const errorData = await captureResponse.json();
          setCaptureError(errorData.error || 'Payment capture failed');
        }
      } catch (e) {
        console.error('Error capturing payment:', e);
        setCaptureError('Failed to process payment. Please contact support.');
      }
      setCapturing(false);
    } else {
      // No order ID - maybe user navigated directly here
      setPaymentComplete(true); // Assume they completed payment elsewhere
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError(signUpError.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (data.user) {
        await fetch('/api/orders/link-by-email', { method: 'POST' });
        
        if (data.session) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setSuccess('Account created! Please check your email to confirm your account, then sign in.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setIsSubmitting(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    await fetch('/api/orders/link-by-email', { method: 'POST' });
    router.push('/dashboard');
    router.refresh();
  };

  // Loading state
  if (loading || capturing) {
    return (
      <div className="min-h-screen bg-black text-[#f8f8f8] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a017] mb-4" />
        <p className="text-gray-400">
          {capturing ? 'Processing your payment...' : 'Loading...'}
        </p>
      </div>
    );
  }

  // Capture error state
  if (captureError) {
    return (
      <div className="min-h-screen bg-black text-[#f8f8f8] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="text-red-400 w-10 h-10" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Issue</h1>
          <p className="text-gray-400 mb-8">{captureError}</p>

          <div className="flex flex-col gap-4">
            <Link href="/#pricing" className="btn-primary inline-flex items-center justify-center gap-2">
              Try Again
              <ArrowRight size={18} />
            </Link>
            <Link href="/" className="btn-secondary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, show simple success and redirect option
  if (isLoggedIn && paymentComplete) {
    return (
      <div className="min-h-screen bg-black text-[#f8f8f8] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-400 w-10 h-10" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-gray-400 mb-8">
            Thank you for your purchase! Your order has been created and is ready for you.
          </p>

          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
            Go to Dashboard
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Guest user - show sign up form
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-400 w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-400">
            Create your account to access your order and submit your project idea.
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 p-3 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-lg">
            <Mail className="text-[#d4a017] flex-shrink-0" size={20} />
            <p className="text-sm text-gray-300">
              {customerEmail 
                ? `Create an account with ${customerEmail} to access your order.`
                : 'Create an account with the email you used for payment.'}
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017]"
                placeholder="your@email.com"
              />
              {customerEmail && email !== customerEmail && (
                <p className="text-xs text-orange-400 mt-1">
                  Use {customerEmail} to access your order
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017]"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-900/20 border border-red-800 text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg text-sm bg-green-900/20 border border-green-800 text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-center text-gray-400 text-sm mb-4">
              Already have an account?
            </p>
            <form onSubmit={handleSignIn} className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full btn-secondary disabled:opacity-50"
              >
                Sign In Instead
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Your order will be automatically linked to your account.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-[#f8f8f8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a017]" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
