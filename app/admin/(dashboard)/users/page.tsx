'use client';

import { useEffect, useState } from 'react';
import { User, Mail, ShoppingBag, Calendar, Clock, Search } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  order_count: number;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    }
    
    setLoading(false);
  };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-400">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-red-400">Error: {error}</div>
        <button 
          onClick={fetchUsers}
          className="mt-4 btn-primary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Users</h1>
        <p className="text-gray-400 text-sm sm:text-base">
          {users.length} registered user{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-8 text-center text-gray-400">
            {searchTerm ? 'No users found matching your search.' : 'No users yet.'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4"
            >
              {/* User Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                  {user.profile?.avatar_url ? (
                    <img
                      src={user.profile.avatar_url}
                      alt={user.profile.display_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-gray-500 w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate">
                    {user.profile?.display_name || 'No name'}
                  </div>
                  <div className="text-gray-400 text-sm truncate flex items-center gap-1">
                    <Mail size={12} />
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#141414] rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingBag size={14} className="text-gray-500" />
                  </div>
                  <div className={`text-lg font-bold ${user.order_count > 0 ? 'text-[#d4a017]' : 'text-gray-400'}`}>
                    {user.order_count}
                  </div>
                  <div className="text-gray-500 text-xs">Orders</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar size={14} className="text-gray-500" />
                  </div>
                  <div className="text-white text-sm font-medium">
                    {formatDate(user.created_at).split(',')[0]}
                  </div>
                  <div className="text-gray-500 text-xs">Joined</div>
                </div>
                <div className="bg-[#141414] rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock size={14} className="text-gray-500" />
                  </div>
                  <div className="text-white text-sm font-medium">
                    {user.last_sign_in_at ? formatDate(user.last_sign_in_at).split(',')[0] : '-'}
                  </div>
                  <div className="text-gray-500 text-xs">Last login</div>
                </div>
              </div>

              {/* User ID */}
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="text-gray-500 text-xs font-mono truncate">
                  ID: {user.id}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-[#0d0d0d] border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#141414] border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Sign In
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    {searchTerm ? 'No users found matching your search.' : 'No users yet.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#141414]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                          {user.profile?.avatar_url ? (
                            <img
                              src={user.profile.avatar_url}
                              alt={user.profile.display_name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="text-gray-500 w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {user.profile?.display_name || 'No name'}
                          </div>
                          <div className="text-gray-500 text-xs font-mono">
                            {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail size={14} className="text-gray-500" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-gray-500" />
                        <span className={user.order_count > 0 ? 'text-[#d4a017]' : 'text-gray-400'}>
                          {user.order_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={14} className="text-gray-500" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-400 text-sm">
                        {user.last_sign_in_at ? (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            <div>
                              <div>{formatDate(user.last_sign_in_at)}</div>
                              <div className="text-xs text-gray-500">{formatTime(user.last_sign_in_at)}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
