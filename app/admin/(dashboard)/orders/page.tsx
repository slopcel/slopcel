'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types/database';
import { Lightbulb, Eye, Trash2 } from 'lucide-react';
import OrderDetailsModal from '@/components/admin/OrderDetailsModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

interface OrderWithUser extends Order {
  user_email?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; orderId: string | null; orderInfo: string }>({
    isOpen: false,
    orderId: null,
    orderInfo: '',
  });
  const [deleting, setDeleting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((ordersData || []).map(o => o.user_id))];

    const userEmails: Record<string, string> = {};
    for (const userId of userIds) {
      try {
        const res = await fetch(`/api/admin/user-email?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            userEmails[userId] = data.email;
          }
        }
      } catch (e) {
        console.error('Error fetching user email:', e);
      }
    }

    const ordersWithUsers = (ordersData || []).map(order => ({
      ...order,
      user_email: order.user_id ? userEmails[order.user_id] : undefined,
    }));

    setOrders(ordersWithUsers);
    setLoading(false);
  };

  const filteredOrders = orders.filter((order) =>
    statusFilter === 'all' || order.status === statusFilter
  );

  const openDeleteModal = (order: OrderWithUser) => {
    const orderInfo = `${formatAmount(order.amount)} - ${order.user_email || order.payer_email || 'Guest'}`;
    setDeleteModal({ isOpen: true, orderId: order.id, orderInfo });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, orderId: null, orderInfo: '' });
  };

  const handleDeleteOrder = async () => {
    if (!deleteModal.orderId) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', deleteModal.orderId);

    if (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted successfully');
      fetchOrders();
    }
    
    setDeleting(false);
    closeDeleteModal();
  };

  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getTierLabel = (amount: number) => {
    if (amount === 30000) return 'Premium';
    if (amount === 15000) return 'Standard';
    if (amount === 7500) return 'Hall of Famer';
    if (amount === 5000) return 'Bare Minimum';
    return formatAmount(amount);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900/20 text-yellow-400 border-yellow-800',
    completed: 'bg-green-900/20 text-green-400 border-green-800',
    failed: 'bg-red-900/20 text-red-400 border-red-800',
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-400">Loading orders...</div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);

  const ordersNeedingProject = orders.filter(
    (o) => o.status === 'completed' && !o.project_id && o.idea_description
  );

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Orders</h1>
        <p className="text-gray-400 text-sm sm:text-base">View and manage customer orders</p>
      </div>

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6">
          <div className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Total Orders</div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{orders.length}</div>
        </div>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6">
          <div className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Completed</div>
          <div className="text-2xl sm:text-3xl font-bold text-green-400">
            {orders.filter((o) => o.status === 'completed').length}
          </div>
        </div>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6">
          <div className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Revenue</div>
          <div className="text-2xl sm:text-3xl font-bold text-[#d4a017]">{formatAmount(totalRevenue)}</div>
        </div>
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6">
          <div className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">Needs Project</div>
          <div className="text-2xl sm:text-3xl font-bold text-orange-400">
            {ordersNeedingProject.length}
          </div>
        </div>
      </div>

      {/* Alert for orders needing projects */}
      {ordersNeedingProject.length > 0 && (
        <div className="mb-4 sm:mb-6 bg-orange-900/20 border border-orange-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 text-orange-400 text-sm sm:text-base">
            <Lightbulb size={18} className="flex-shrink-0" />
            <span className="font-semibold">
              {ordersNeedingProject.length} order{ordersNeedingProject.length > 1 ? 's' : ''} with ideas ready for project creation
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 sm:mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 sm:px-4 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-8 text-center text-gray-400">
            {statusFilter !== 'all' ? 'No orders found with this status.' : 'No orders yet.'}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 cursor-pointer hover:bg-[#141414] transition-colors active:scale-[0.99]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-semibold">{formatAmount(order.amount)}</div>
                  <div className="text-gray-400 text-sm">{getTierLabel(order.amount)}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="text-gray-400 text-sm mb-2 truncate">
                {order.user_email || order.payer_email || (order.user_id ? `User: ${order.user_id.slice(0, 8)}...` : 'Guest')}
              </div>
              
                <div className="flex items-center justify-between">
                <div className="text-gray-500 text-xs">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  {order.hall_of_fame_position && (
                    <span className="text-[#d4a017] text-xs font-bold">HOF #{order.hall_of_fame_position}</span>
                  )}
                  {order.status === 'completed' && !order.project_id && order.idea_description && (
                    <span className="text-orange-400 text-xs">Needs project</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(order);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded transition-colors"
                    title="Delete order"
                  >
                    <Trash2 size={16} />
                  </button>
                  <Eye size={16} className="text-gray-500" />
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
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {statusFilter !== 'all' ? 'No orders found with this status.' : 'No orders yet.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-[#141414] cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white text-sm">
                        {order.user_email || order.payer_email || (
                          order.user_id 
                            ? <span className="text-gray-500 font-mono text-xs">{order.user_id.slice(0, 12)}...</span>
                            : <span className="text-gray-500">Guest</span>
                        )}
                      </div>
                      {order.hall_of_fame_position && (
                        <div className="text-[#d4a017] text-xs">HOF #{order.hall_of_fame_position}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-semibold">{formatAmount(order.amount)}</div>
                      <div className="text-gray-400 text-xs">{getTierLabel(order.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.project_id ? (
                        <span className="text-green-400 text-sm">Created</span>
                      ) : order.idea_description ? (
                        <span className="text-orange-400 text-sm">Idea submitted</span>
                      ) : (
                        <span className="text-gray-500 text-sm">No idea yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(order);
                          }}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                          title="Delete order"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onProjectCreated={fetchOrders}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteOrder}
        title="Delete Order"
        message={`Are you sure you want to delete this order (${deleteModal.orderInfo})? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
