'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, Profile } from '@/types/database';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle, XCircle, Clock, Trophy, LogOut, Plus, Edit2, Save, X, Mail, AlertCircle, Lightbulb, User, Camera, EyeOff } from 'lucide-react';
import Link from 'next/link';
import AllPricingModal from '@/components/AllPricingModal';
import Image from 'next/image';
import { toast } from 'sonner';

export const runtime = 'edge';

export default function UserDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [ideaDescriptions, setIdeaDescriptions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showAccountMessage, setShowAccountMessage] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [linkedOrdersMessage, setLinkedOrdersMessage] = useState<string | null>(null);
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    avatar_url: '',
    twitter_url: '',
    is_anonymous: false,
  });
  const [twitterError, setTwitterError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Check if user just completed a payment
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        setShowAccountMessage(true);
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      }
    }
    initializeData();
  }, []);

  const initializeData = async () => {
    // First, try to link any orders made with the same email
    await linkOrdersByEmail();
    // Then fetch data
    await fetchData();
    // Fetch profile
    await fetchProfile();
  };

  const linkOrdersByEmail = async () => {
    try {
      const response = await fetch('/api/orders/link-by-email', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.linked > 0) {
        setLinkedOrdersMessage(data.message);
      }
    } catch (error) {
      console.error('Error linking orders:', error);
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching profile:', error);
    }
    
    if (data) {
      setProfile(data);
      setProfileForm({
        display_name: data.display_name || '',
        avatar_url: data.avatar_url || '',
        twitter_url: data.twitter_url || '',
        is_anonymous: data.is_anonymous || false,
      });
    }
  };

  // Validate Twitter URL
  const isValidTwitterUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional)
    const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]{1,15}\/?$/;
    return twitterRegex.test(url);
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUserEmail(user.email || null);
    setUserId(user.id);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!userId) return;
    
    // Validate Twitter URL
    if (profileForm.twitter_url && !isValidTwitterUrl(profileForm.twitter_url)) {
      setTwitterError('Please enter a valid Twitter/X profile URL (e.g., https://x.com/username)');
      return;
    }
    setTwitterError(null);
    
    setSavingProfile(true);
    
    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    let error;
    if (existing) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: profileForm.display_name || null,
          avatar_url: profileForm.avatar_url || null,
          twitter_url: profileForm.twitter_url || null,
          is_anonymous: profileForm.is_anonymous,
        })
        .eq('id', userId);
      error = updateError;
    } else {
      // Insert new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: profileForm.display_name || null,
          avatar_url: profileForm.avatar_url || null,
          twitter_url: profileForm.twitter_url || null,
          is_anonymous: profileForm.is_anonymous,
        });
      error = insertError;
    }

    if (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } else {
      setEditingProfile(false);
      await fetchProfile();
      toast.success('Profile saved successfully!');
    }
    
    setSavingProfile(false);
  };

  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-400" size={20} />;
      case 'failed': return <XCircle className="text-red-400" size={20} />;
      default: return <Clock className="text-yellow-400" size={20} />;
    }
  };

  const getTierLabel = (amount: number) => {
    if (amount === 30000) return 'Premium ($300)';
    if (amount === 15000) return 'Standard ($150)';
    if (amount === 7500) return 'Hall of Famer ($75)';
    if (amount === 5000) return 'Bare Minimum ($50)';
    return formatAmount(amount);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  const startEditingIdea = (order: Order) => {
    setEditingOrderId(order.id);
    setIdeaDescriptions({
      ...ideaDescriptions,
      [order.id]: order.idea_description || '',
    });
    setProjectNames({
      ...projectNames,
      [order.id]: order.project_name || '',
    });
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
  };

  const saveIdea = async (orderId: string) => {
    setSaving(orderId);
    const description = ideaDescriptions[orderId] || '';
    const projectName = projectNames[orderId] || '';

    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      setSaving(null);
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        idea_description: description,
        project_name: projectName.trim(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error saving idea:', error);
      toast.error('Failed to save idea. Please try again.');
    } else {
      setEditingOrderId(null);
      toast.success('Idea saved successfully!');
      fetchData(); // Refresh orders
    }
    setSaving(null);
  };

  // Count orders that need idea submission (need both project name and description)
  const ordersNeedingIdea = orders.filter(
    (o) => o.status === 'completed' && (!o.idea_description || !o.project_name)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-[#f8f8f8] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#f8f8f8] p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-gray-400 text-sm sm:text-base">Welcome, {userEmail}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <button 
              onClick={() => setShowPricingModal(true)}
              className="btn-secondary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Purchase More</span>
              <span className="sm:hidden">Purchase</span>
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2 text-red-400 hover:bg-red-900/10 hover:text-red-300 text-sm sm:text-base px-3 sm:px-4 py-2"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Log Out</span>
              <span className="sm:hidden">Logout</span>
            </button>
          </div>
        </div>

        {showAccountMessage && (
          <div className="mb-6 bg-[#0d0d0d] border border-[#d4a017] rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <Mail className="text-[#d4a017] mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Payment Successful! 🎉</h3>
                <p className="text-gray-300 mb-2 text-sm sm:text-base">
                  Your payment has been processed successfully. We've sent a password reset email to your email address.
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Please check your email and click the password reset link to set your password and log in.
                </p>
                <button
                  onClick={() => setShowAccountMessage(false)}
                  className="mt-4 text-xs sm:text-sm text-[#d4a017] hover:text-[#e5b030]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {linkedOrdersMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <CheckCircle className="text-green-400 mt-1 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Orders Linked!</h3>
                <p className="text-gray-300 text-sm sm:text-base">
                  {linkedOrdersMessage}
                </p>
                <button
                  onClick={() => setLinkedOrdersMessage(null)}
                  className="mt-4 text-xs sm:text-sm text-green-400 hover:text-green-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-6 bg-[#0d0d0d] border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <User size={20} className="sm:w-6 sm:h-6" />
              My Profile
            </h2>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}
          </div>
          
          <div className="p-4 sm:p-6">
            {editingProfile ? (
              <div className="space-y-4">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                    {profileForm.avatar_url ? (
                      <Image
                        src={profileForm.avatar_url}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="text-gray-500" size={32} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      value={profileForm.avatar_url}
                      onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                      placeholder="https://example.com/your-avatar.jpg"
                      className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                    placeholder="Your display name"
                    className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be shown on your projects in the Hall of Fame</p>
                </div>

                {/* Twitter/X Profile */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter/X Profile
                  </label>
                  <input
                    type="url"
                    value={profileForm.twitter_url}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, twitter_url: e.target.value });
                      if (twitterError) setTwitterError(null);
                    }}
                    placeholder="https://x.com/yourusername"
                    className={`w-full px-3 py-2 bg-[#141414] border rounded-lg text-white text-sm focus:outline-none ${
                      twitterError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-[#d4a017]'
                    }`}
                  />
                  {twitterError ? (
                    <p className="text-xs text-red-400 mt-1">{twitterError}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Link your Twitter/X profile to show on your projects</p>
                  )}
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center gap-3 p-3 bg-[#141414] rounded-lg">
                  <input
                    type="checkbox"
                    id="is_anonymous"
                    checked={profileForm.is_anonymous}
                    onChange={(e) => setProfileForm({ ...profileForm, is_anonymous: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0d0d0d] text-[#d4a017] focus:ring-[#d4a017]"
                  />
                  <label htmlFor="is_anonymous" className="flex items-center gap-2 cursor-pointer">
                    <EyeOff size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-300">Stay Anonymous</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 -mt-2 ml-7">
                  Your profile won't be shown on your projects. Only the project details will be visible.
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setTwitterError(null);
                      // Reset form to current profile
                      setProfileForm({
                        display_name: profile?.display_name || '',
                        avatar_url: profile?.avatar_url || '',
                        twitter_url: profile?.twitter_url || '',
                        is_anonymous: profile?.is_anonymous || false,
                      });
                    }}
                    disabled={savingProfile}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative w-16 h-16 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url && !profile?.is_anonymous ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="text-gray-500" size={32} />
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {profile?.is_anonymous ? (
                        <span className="flex items-center gap-2 text-gray-400">
                          <EyeOff size={14} />
                          Anonymous
                        </span>
                      ) : profile?.display_name ? (
                        profile.display_name
                      ) : (
                        <span className="text-gray-500 italic">No display name set</span>
                      )}
                    </span>
                    {profile?.twitter_url && !profile?.is_anonymous && (
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-[#1DA1F2] transition-colors"
                        title="Twitter/X Profile"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm truncate">{userEmail}</div>
                  {!profile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Set up your profile to be featured on your Hall of Fame projects!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Important: Submit Your Idea Alert */}
        {ordersNeedingIdea.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-900/30 to-amber-900/30 border-2 border-orange-500 rounded-xl p-4 sm:p-6 animate-pulse-subtle">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 bg-orange-500/20 rounded-full">
                <AlertCircle className="text-orange-400 w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-orange-400 mb-2">
                  ⚠️ Action Required: Submit Your Project Idea!
                </h3>
                <p className="text-gray-200 mb-3 text-sm sm:text-base">
                  You have <span className="font-bold text-white">{ordersNeedingIdea.length}</span> completed order{ordersNeedingIdea.length > 1 ? 's' : ''} waiting for your project idea. 
                  <span className="font-semibold text-orange-300"> Your project cannot be built until you describe what you want!</span>
                </p>
                <div className="bg-black/30 rounded-lg p-3 text-sm text-gray-300">
                  <p className="font-semibold text-white mb-1">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Find your order below and click <span className="text-[#d4a017] font-medium">"Submit"</span> or <span className="text-[#d4a017] font-medium">"Edit"</span></li>
                    <li>Describe your project idea in detail (features, design preferences, etc.)</li>
                    <li>Save your idea — I'll review it and start building!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Package size={20} className="sm:w-6 sm:h-6" />
              My Orders
            </h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-400">
              <Package size={40} className="mx-auto mb-4 opacity-50 sm:w-12 sm:h-12" />
              <p className="mb-4 text-sm sm:text-base">No orders yet.</p>
              <button 
                onClick={() => setShowPricingModal(true)}
                className="btn-primary inline-block text-sm sm:text-base"
              >
                View Pricing
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {orders.map((order) => {
                const needsIdea = order.status === 'completed' && (!order.idea_description || !order.project_name);
                
                return (
                  <div 
                    key={order.id} 
                    className={`p-4 sm:p-6 transition-colors ${
                      needsIdea 
                        ? 'bg-orange-900/10 hover:bg-orange-900/20 border-l-4 border-l-orange-500' 
                        : 'hover:bg-[#141414]'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-start sm:items-center">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="capitalize text-white text-sm sm:text-base">{order.status}</span>
                      </div>
                      <div className="text-white text-sm sm:text-base">
                        {getTierLabel(order.amount)}
                      </div>
                      <div className="text-white font-semibold text-sm sm:text-base">
                        {formatAmount(order.amount)}
                      </div>
                      <div>
                        {order.hall_of_fame_position ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Trophy className="text-[#d4a017]" size={16} />
                            <span className="text-[#d4a017] font-bold text-sm sm:text-base">#{order.hall_of_fame_position}</span>
                            {order.status === 'completed' && (
                              <Link 
                                href="/hall-of-fame" 
                                className="text-xs sm:text-sm text-gray-400 hover:text-[#d4a017]"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </div>
                      <div className="text-gray-400 text-xs sm:text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Idea Submission Section */}
                    <div className={`mt-4 pt-4 border-t ${needsIdea ? 'border-orange-800/50' : 'border-gray-800'}`}>
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb size={16} className={needsIdea ? 'text-orange-400' : 'text-gray-400'} />
                          <h3 className={`text-xs sm:text-sm font-semibold ${needsIdea ? 'text-orange-400' : 'text-gray-300'}`}>
                            Project Idea
                            {needsIdea && <span className="ml-2 text-orange-300 animate-pulse">← Required!</span>}
                          </h3>
                        </div>
                        {editingOrderId !== order.id && order.status === 'completed' && (
                          <button
                            onClick={() => startEditingIdea(order)}
                            className={`text-xs sm:text-sm flex items-center gap-1 flex-shrink-0 ${
                              needsIdea 
                                ? 'text-orange-400 hover:text-orange-300 font-semibold' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <Edit2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                            {order.idea_description && order.project_name ? 'Edit' : 'Submit Idea'}
                          </button>
                        )}
                      </div>
                      
                      {editingOrderId === order.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                              Project Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={projectNames[order.id] || ''}
                              onChange={(e) => setProjectNames({
                                ...projectNames,
                                [order.id]: e.target.value,
                              })}
                              placeholder="e.g., TaskFlow, BudgetBuddy, FitTracker..."
                              className="w-full bg-[#141414] border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                              disabled={saving === order.id}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">
                              Project Description
                            </label>
                            <textarea
                              value={ideaDescriptions[order.id] || ''}
                              onChange={(e) => setIdeaDescriptions({
                                ...ideaDescriptions,
                                [order.id]: e.target.value,
                              })}
                              placeholder="Describe your project idea here... What do you want built? What features should it have? Any specific design preferences? The more detail you provide, the better I can build it for you!"
                              className="w-full bg-[#141414] border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a017] min-h-[120px] resize-y text-sm sm:text-base"
                              disabled={saving === order.id}
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => saveIdea(order.id)}
                              disabled={saving === order.id}
                              className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                            >
                              <Save size={12} className="sm:w-[14px] sm:h-[14px]" />
                              {saving === order.id ? 'Saving...' : 'Save Idea'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={saving === order.id}
                              className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                            >
                              <X size={12} className="sm:w-[14px] sm:h-[14px]" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs sm:text-sm">
                          {order.idea_description && order.project_name ? (
                            <div>
                              <div className="mb-2">
                                <span className="text-gray-500 text-xs">Project Name:</span>
                                <p className="text-white font-medium">{order.project_name}</p>
                              </div>
                              <div>
                                <span className="text-gray-500 text-xs">Description:</span>
                                <p className="whitespace-pre-wrap break-words text-gray-300">{order.idea_description}</p>
                              </div>
                              <p className="mt-3 text-green-400 text-xs flex items-center gap-1">
                                <CheckCircle size={12} />
                                Idea submitted — I'll review it and start building soon!
                              </p>
                            </div>
                          ) : order.status === 'completed' ? (
                            <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3">
                              <p className="text-orange-300 font-medium mb-1">⚠️ No idea submitted yet!</p>
                              <p className="text-gray-400">
                                Click <span className="text-orange-400 font-medium">"Submit Idea"</span> above to describe what you want built. 
                                Your project won't be started until you submit your idea.
                              </p>
                            </div>
                          ) : (
                            <p className="italic text-gray-500">Complete your payment to submit an idea.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {orders.some(o => o.status === 'completed' && o.hall_of_fame_position) && (
          <div className="mt-4 sm:mt-6 bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="text-[#d4a017]" size={18} />
              Your Hall of Fame Spot
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Your project will appear in the Hall of Fame once it's been created and deployed by the admin.
            </p>
          </div>
        )}
      </div>

      <AllPricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </div>
  );
}
