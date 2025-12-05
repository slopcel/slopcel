'use client';

import { useState, useMemo } from 'react';
import { X, ExternalLink, User, CreditCard, Calendar, Trophy, Lightbulb, FolderPlus, CheckCircle, RefreshCw, Copy, Bell, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface OrderWithUser {
  id: string;
  user_id: string | null;
  dodo_payment_id: string | null;
  dodo_session_id: string | null;
  payer_email: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  project_id: string | null;
  hall_of_fame_position: number | null;
  idea_description: string | null;
  project_name: string | null;
  created_at: string;
  user_email?: string;
}

interface OrderDetailsModalProps {
  order: OrderWithUser;
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose, onProjectCreated }: OrderDetailsModalProps) {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [projectFormData, setProjectFormData] = useState({
    name: order.project_name || '',
    description: order.idea_description || '',
    image_url: '',
    live_url: '',
    github_url: '',
    featured: order.hall_of_fame_position !== null,
  });
  const supabase = useMemo(() => createClient(), []);

  if (!isOpen) return null;

  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getTierLabel = (amount: number) => {
    if (amount === 30000) return 'Premium';
    if (amount === 15000) return 'Standard';
    if (amount === 7500) return 'Hall of Famer';
    if (amount === 5000) return 'Bare Minimum';
    return formatAmount(amount);
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
    completed: 'bg-green-900/30 text-green-400 border-green-700',
    failed: 'bg-red-900/30 text-red-400 border-red-700',
  };

  const handleMarkCompleted = async () => {
    setUpdatingStatus(true);
    
    try {
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          status: 'completed',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error updating status:', data.error);
        toast.error('Failed to update status: ' + data.error);
      } else {
        setCurrentStatus('completed');
        toast.success('Order marked as completed!');
        onProjectCreated(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    }
    
    setUpdatingStatus(false);
  };

  const handleCreateProject = async () => {
    if (!projectFormData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setCreatingProject(true);

    try {
      // Create the project (this is allowed by RLS for authenticated users)
      // Include user_id from the order so the project is linked to the customer
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: projectFormData.name,
          description: projectFormData.description || null,
          image_url: projectFormData.image_url || null,
          live_url: projectFormData.live_url || null,
          github_url: projectFormData.github_url || null,
          featured: projectFormData.featured,
          user_id: order.user_id, // Link project to the customer who purchased
        }])
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        toast.error('Error creating project: ' + projectError.message);
        setCreatingProject(false);
        return;
      }

      // Use secure API route to link project to order
      const response = await fetch('/api/admin/orders/link-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          projectId: project.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error linking project to order:', data.error);
        toast.error('Project created but failed to link to order: ' + data.error);
      } else {
        toast.success('Project created and linked to order successfully!');
        setShowProjectForm(false);
        onProjectCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }

    setCreatingProject(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0d0d0d] border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Order Details</h2>
            <p className="text-gray-400 text-sm mt-1">ID: {order.id.slice(0, 12)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Status & Amount Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#141414] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <CreditCard size={16} />
                <span>Amount</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatAmount(order.amount)}</div>
              <div className="text-gray-400 text-sm">{getTierLabel(order.amount)}</div>
            </div>
            <div className="bg-[#141414] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <CheckCircle size={16} />
                <span>Status</span>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusColors[currentStatus]}`}>
                {currentStatus}
              </span>
              {currentStatus === 'pending' && (
                <button
                  onClick={handleMarkCompleted}
                  disabled={updatingStatus}
                  className="mt-2 w-full text-xs text-[#d4a017] hover:text-[#e5b030] flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={updatingStatus ? 'animate-spin' : ''} />
                  {updatingStatus ? 'Updating...' : 'Mark as Completed'}
                </button>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-[#141414] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <User size={16} />
                <span>Customer</span>
              </div>
              {order.user_email && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(order.user_email!);
                      toast.success('Email copied to clipboard!');
                    }}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Copy email"
                  >
                    <Copy size={14} />
                  </button>
                  <a
                    href={`mailto:${order.user_email}?subject=Your Slopcel Order Update&body=Hi,%0A%0AYour order has been completed!%0A%0AOrder Details:%0A- Amount: ${formatAmount(order.amount)}%0A- Hall of Fame Position: ${order.hall_of_fame_position || 'N/A'}%0A${order.project_name ? `- Project: ${order.project_name}` : ''}%0A%0AThank you for using Slopcel!`}
                    className="p-1.5 text-gray-400 hover:text-[#d4a017] hover:bg-[#d4a017]/10 rounded transition-colors"
                    title="Send email notification"
                  >
                    <Mail size={14} />
                  </a>
                </div>
              )}
            </div>
            <div className="text-white">
              {order.user_email ? (
                <div className="flex items-center gap-2">
                  <span>{order.user_email}</span>
                </div>
              ) : order.payer_email ? (
                <span>{order.payer_email}</span>
              ) : order.user_id ? (
                <span className="text-gray-500 font-mono text-sm">User ID: {order.user_id}</span>
              ) : (
                <span className="text-gray-500">Guest (no email)</span>
              )}
            </div>
          </div>

          {/* Hall of Fame & Date */}
          <div className="grid grid-cols-2 gap-4">
            {order.hall_of_fame_position && (
              <div className="bg-[#141414] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Trophy size={16} className="text-[#d4a017]" />
                  <span>Hall of Fame</span>
                </div>
                <div className="text-2xl font-bold text-[#d4a017]">#{order.hall_of_fame_position}</div>
              </div>
            )}
            <div className={`bg-[#141414] rounded-lg p-4 ${!order.hall_of_fame_position ? 'col-span-2' : ''}`}>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Calendar size={16} />
                <span>Order Date</span>
              </div>
              <div className="text-white">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Dodo Payment ID */}
          {order.dodo_payment_id && (
            <div className="bg-[#141414] rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-2">Dodo Payment</div>
              <div className="flex items-center gap-2">
                <code className="text-white bg-black/30 px-2 py-1 rounded text-sm font-mono">
                  {order.dodo_payment_id}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.dodo_payment_id!);
                    toast.success('Payment ID copied!');
                  }}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  title="Copy Payment ID"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Idea Description */}
          <div className="bg-[#141414] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Lightbulb size={16} />
              <span>Customer's Project Idea</span>
            </div>
            {order.project_name || order.idea_description ? (
              <div className="space-y-3">
                {order.project_name && (
                  <div>
                    <span className="text-gray-500 text-xs block mb-1">Project Name</span>
                    <p className="text-white font-semibold">{order.project_name}</p>
                  </div>
                )}
                {order.idea_description && (
                  <div>
                    <span className="text-gray-500 text-xs block mb-1">Description</span>
                    <div className="text-gray-300 whitespace-pre-wrap bg-black/30 rounded-lg p-3 text-sm">
                      {order.idea_description}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Customer hasn't submitted their idea yet.</p>
            )}
          </div>

          {/* Project Status / Creation */}
          <div className="bg-[#141414] rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <FolderPlus size={16} />
              <span>Project</span>
            </div>

            {order.project_id ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={18} />
                <span>Project has been created</span>
              </div>
            ) : !showProjectForm ? (
              <button
                onClick={() => setShowProjectForm(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <FolderPlus size={18} />
                Create Project from this Order
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                    placeholder="Project description..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Live URL
                    </label>
                    <input
                      type="url"
                      value={projectFormData.live_url}
                      onChange={(e) => setProjectFormData({ ...projectFormData, live_url: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={projectFormData.github_url}
                      onChange={(e) => setProjectFormData({ ...projectFormData, github_url: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={projectFormData.image_url}
                    onChange={(e) => setProjectFormData({ ...projectFormData, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d0d0d] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4a017]"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured-modal"
                    checked={projectFormData.featured}
                    onChange={(e) => setProjectFormData({ ...projectFormData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-700 bg-[#0d0d0d] text-[#d4a017] focus:ring-[#d4a017]"
                  />
                  <label htmlFor="featured-modal" className="text-xs text-gray-400">
                    Featured (Hall of Fame)
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateProject}
                    disabled={creatingProject}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {creatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    onClick={() => setShowProjectForm(false)}
                    disabled={creatingProject}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notify Customer Section */}
          {currentStatus === 'completed' && order.user_email && (
            <div className="bg-gradient-to-r from-[#d4a017]/10 to-[#d4a017]/5 border border-[#d4a017]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#d4a017] text-sm font-medium mb-3">
                <Bell size={16} />
                <span>Notify Customer</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Send an email to let the customer know their order is complete.
              </p>
              <a
                href={`mailto:${order.user_email}?subject=${encodeURIComponent(`Your Slopcel Project${order.project_name ? ` "${order.project_name}"` : ''} is Ready!`)}&body=${encodeURIComponent(`Hi there!\n\nGreat news! Your Slopcel order has been completed.\n\nOrder Details:\n- Amount: ${formatAmount(order.amount)}\n- Tier: ${getTierLabel(order.amount)}${order.hall_of_fame_position ? `\n- Hall of Fame Position: #${order.hall_of_fame_position}` : ''}${order.project_name ? `\n- Project Name: ${order.project_name}` : ''}\n\nYou can view your project on the Hall of Fame page: ${typeof window !== 'undefined' ? window.location.origin : ''}/hall-of-fame\n\nThank you for using Slopcel!\n\nBest,\nMadiou`)}`}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Open Email to Notify
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
