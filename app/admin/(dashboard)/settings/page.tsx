'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield } from 'lucide-react';

export default function AdminSettings() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your admin account</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-[#d4a017]" />
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="text-white text-lg">{userEmail}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <div className="flex items-center gap-2 text-white">
                <Shield size={16} className="text-green-500" />
                <span>Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/40 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
            <p className="text-sm text-gray-500 mt-2">
              This will log you out of the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

