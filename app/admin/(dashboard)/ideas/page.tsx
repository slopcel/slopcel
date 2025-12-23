'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Idea, Category } from '@/types/database';
import IdeaCard from '@/components/admin/IdeaCard';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminIdeas() {
  const [ideas, setIdeas] = useState<(Idea & { categories?: Category | null })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    type: 'idea' | 'category' | null;
    id: string | null; 
    name: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: '',
  });
  const [deleting, setDeleting] = useState(false);
  const [ideaFormData, setIdeaFormData] = useState({
    title: '',
    description: '',
    emoji: '',
    category_id: '',
    status: 'plan_to_do' as 'plan_to_do' | 'done' | 'dropped',
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    color: '#d4a017',
  });
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ideasResult, categoriesResult] = await Promise.all([
      supabase
        .from('ideas')
        .select('*, categories(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);

    if (ideasResult.error) {
      console.error('Error fetching ideas:', ideasResult.error);
    } else {
      setIdeas(ideasResult.data || []);
    }

    if (categoriesResult.error) {
      console.error('Error fetching categories:', categoriesResult.error);
    } else {
      setCategories(categoriesResult.data || []);
    }

    setLoading(false);
  };

  const handleIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...ideaFormData,
      category_id: ideaFormData.category_id || null,
      emoji: ideaFormData.emoji || null,
    };

    if (editingIdea) {
      const { error } = await supabase
        .from('ideas')
        .update(data)
        .eq('id', editingIdea.id);

      if (error) {
        console.error('Error updating idea:', error);
        toast.error('Error updating idea');
      } else {
        fetchData();
        resetIdeaForm();
        toast.success('Idea updated successfully!');
      }
    } else {
      const { error } = await supabase.from('ideas').insert([data]);

      if (error) {
        console.error('Error creating idea:', error);
        toast.error('Error creating idea');
      } else {
        fetchData();
        resetIdeaForm();
        toast.success('Idea created successfully!');
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(categoryFormData)
        .eq('id', editingCategory.id);

      if (error) {
        console.error('Error updating category:', error);
        toast.error('Error updating category');
      } else {
        fetchData();
        resetCategoryForm();
        toast.success('Category updated successfully!');
      }
    } else {
      const { error } = await supabase.from('categories').insert([categoryFormData]);

      if (error) {
        console.error('Error creating category:', error);
        toast.error(`Error creating category: ${error.message}`);
      } else {
        fetchData();
        resetCategoryForm();
        toast.success('Category created successfully!');
      }
    }
  };

  const openDeleteModal = (type: 'idea' | 'category', id: string, name: string) => {
    setDeleteModal({ isOpen: true, type, id, name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
  };

  const handleDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    
    setDeleting(true);
    
    if (deleteModal.type === 'idea') {
      const { error } = await supabase.from('ideas').delete().eq('id', deleteModal.id);

      if (error) {
        console.error('Error deleting idea:', error);
        toast.error('Error deleting idea');
      } else {
        fetchData();
        toast.success('Idea deleted successfully!');
      }
    } else {
      const { error } = await supabase.from('categories').delete().eq('id', deleteModal.id);

      if (error) {
        console.error('Error deleting category:', error);
        toast.error('Error deleting category');
      } else {
        fetchData();
        toast.success('Category deleted successfully!');
      }
    }
    
    setDeleting(false);
    closeDeleteModal();
  };

  const handleStatusChange = async (idea: Idea, newStatus: 'plan_to_do' | 'done' | 'dropped') => {
    const { error } = await supabase
      .from('ideas')
      .update({ status: newStatus })
      .eq('id', idea.id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    } else {
      fetchData();
      toast.success('Status updated!');
    }
  };

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setIdeaFormData({
      title: idea.title,
      description: idea.description || '',
      emoji: idea.emoji || '',
      category_id: idea.category_id || '',
      status: idea.status,
    });
    setShowIdeaForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      color: category.color,
    });
    setShowCategoryForm(true);
  };

  const resetIdeaForm = () => {
    setIdeaFormData({
      title: '',
      description: '',
      emoji: '',
      category_id: '',
      status: 'plan_to_do',
    });
    setEditingIdea(null);
    setShowIdeaForm(false);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      color: '#d4a017',
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const filteredIdeas = ideas.filter((idea) => {
    const categoryMatch = selectedCategory === 'all' || idea.category_id === selectedCategory;
    const statusMatch = selectedStatus === 'all' || idea.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-400">Loading ideas...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Ideas</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your project ideas and categories</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => {
              resetCategoryForm();
              setShowCategoryForm(true);
            }}
            className="btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus size={18} />
            Add Category
          </button>
          <button
            onClick={() => {
              resetIdeaForm();
              setShowIdeaForm(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus size={18} />
            Add Idea
          </button>
        </div>
      </div>

      {/* Category Management Form */}
      {showCategoryForm && (
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>
            <button
              onClick={resetCategoryForm}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color *
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-20 h-10 rounded-lg border border-gray-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="flex-1 px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                  placeholder="#d4a017"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetCategoryForm}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {categories.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 bg-[#141414] border border-gray-800 rounded-lg px-3 sm:px-4 py-2"
              >
                <span
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-white text-sm sm:text-base">{category.name}</span>
                <button
                  onClick={() => handleEditCategory(category)}
                  className="ml-1 sm:ml-2 text-gray-400 hover:text-white text-xs sm:text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal('category', category.id, category.name)}
                  className="text-gray-400 hover:text-red-400 text-xs sm:text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Idea Form */}
      {showIdeaForm && (
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {editingIdea ? 'Edit Idea' : 'New Idea'}
            </h2>
            <button
              onClick={resetIdeaForm}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleIdeaSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={ideaFormData.title}
                onChange={(e) => setIdeaFormData({ ...ideaFormData, title: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={ideaFormData.description}
                onChange={(e) => setIdeaFormData({ ...ideaFormData, description: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={ideaFormData.emoji}
                  onChange={(e) => setIdeaFormData({ ...ideaFormData, emoji: e.target.value })}
                  maxLength={2}
                  className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                  placeholder="🎨"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={ideaFormData.category_id}
                  onChange={(e) => setIdeaFormData({ ...ideaFormData, category_id: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={ideaFormData.status}
                onChange={(e) => setIdeaFormData({ ...ideaFormData, status: e.target.value as 'plan_to_do' | 'done' | 'dropped' })}
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
              >
                <option value="plan_to_do">Plan to do</option>
                <option value="done">Done</option>
                <option value="dropped">Dropped</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                {editingIdea ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetIdeaForm}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 sm:px-4 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 sm:px-4 py-2 bg-[#0d0d0d] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
        >
          <option value="all">All Statuses</option>
          <option value="plan_to_do">Plan to do</option>
          <option value="done">Done</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-8 sm:p-12 text-center">
          <p className="text-gray-400 text-sm sm:text-base">No ideas found. Create your first idea!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              category={idea.categories || null}
              onEdit={handleEditIdea}
              onDelete={(id) => openDeleteModal('idea', id, idea.title)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title={`Delete ${deleteModal.type === 'idea' ? 'Idea' : 'Category'}`}
        message={
          deleteModal.type === 'category'
            ? `Are you sure you want to delete "${deleteModal.name}"? Ideas in this category will be unassigned.`
            : `Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
