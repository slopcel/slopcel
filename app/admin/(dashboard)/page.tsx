import { createClient } from '@/lib/supabase/server';
import { LayoutDashboard, FolderKanban, Lightbulb, Users, ShoppingCart } from 'lucide-react';

export default async function AdminOverview() {
  const supabase = await createClient();

  // Fetch metrics
  const [projectsResult, ideasResult, ordersResult, usersResult] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('ideas').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('user_id').then(({ data }) => {
      const uniqueUsers = new Set(data?.map(o => o.user_id) || []);
      return { count: uniqueUsers.size };
    }),
  ]);

  const metrics = [
    {
      label: 'Total Projects',
      value: projectsResult.count || 0,
      icon: FolderKanban,
      color: 'text-blue-400',
    },
    {
      label: 'Total Ideas',
      value: ideasResult.count || 0,
      icon: Lightbulb,
      color: 'text-yellow-400',
    },
    {
      label: 'Total Users',
      value: usersResult.count || 0,
      icon: Users,
      color: 'text-green-400',
    },
    {
      label: 'Total Orders',
      value: ordersResult.count || 0,
      icon: ShoppingCart,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Overview</h1>
        <p className="text-gray-400 text-sm sm:text-base">Welcome to your admin dashboard</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Icon className={`${metric.color} w-6 h-6 sm:w-8 sm:h-8`} />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-gray-400 text-xs sm:text-sm">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="text-gray-400 text-sm sm:text-base">
          Recent activity will be displayed here. This can be extended to show recent orders, projects, or ideas.
        </div>
      </div>
    </div>
  );
}
