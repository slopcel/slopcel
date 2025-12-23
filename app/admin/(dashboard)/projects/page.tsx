'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types/database';
import { Plus, Edit, Trash2, Star, StarOff, ExternalLink, Github } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ImageUpload from '@/components/admin/ImageUpload';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; projectId: string | null; projectName: string }>({
    isOpen: false,
    projectId: null,
    projectName: '',
  });
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    live_url: '',
    github_url: '',
    featured: false,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      const { error } = await supabase
        .from('projects')
        .update(formData)
        .eq('id', editingProject.id);

      if (error) {
        console.error('Error updating project:', error);
        toast.error('Error updating project');
      } else {
        fetchProjects();
        resetForm();
        toast.success('Project updated successfully!');
      }
    } else {
      const { error } = await supabase.from('projects').insert([formData]);

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Error creating project');
      } else {
        fetchProjects();
        resetForm();
        toast.success('Project created successfully!');
      }
    }
  };

  const openDeleteModal = (project: Project) => {
    setDeleteModal({
      isOpen: true,
      projectId: project.id,
      projectName: project.name,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, projectId: null, projectName: '' });
  };

  const handleDelete = async () => {
    if (!deleteModal.projectId) return;
    
    setDeleting(true);
    const { error } = await supabase.from('projects').delete().eq('id', deleteModal.projectId);

    if (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project');
    } else {
      fetchProjects();
      toast.success('Project deleted successfully!');
    }
    setDeleting(false);
    closeDeleteModal();
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      image_url: project.image_url || '',
      live_url: project.live_url || '',
      github_url: project.github_url || '',
      featured: project.featured,
    });
    setShowForm(true);
  };

  const toggleFeatured = async (project: Project) => {
    const { error } = await supabase
      .from('projects')
      .update({ featured: !project.featured })
      .eq('id', project.id);

    if (error) {
      console.error('Error updating featured status:', error);
      toast.error('Error updating featured status');
    } else {
      fetchProjects();
      toast.success(project.featured ? 'Removed from homepage!' : 'Featured on homepage!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      live_url: '',
      github_url: '',
      featured: false,
    });
    setEditingProject(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-400">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Projects</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your projects and hall of fame</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          Add Project
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            {editingProject ? 'Edit Project' : 'New Project'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
              />
            </div>
            {/* Image Upload */}
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="project-images"
              label="Project Image"
              aspectRatio="video"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Live URL
                </label>
                <input
                  type="url"
                  value={formData.live_url}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-800 bg-[#141414] text-[#d4a017] focus:ring-[#d4a017]"
                />
                <label htmlFor="featured" className="text-sm font-medium text-gray-300">
                  Featured on Homepage
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Shows this project in the "Featured Slop" section on the homepage. Does NOT add to Hall of Fame.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                {editingProject ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {projects.length === 0 ? (
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-8 text-center text-gray-400">
            No projects yet. Create your first project!
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {project.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleFeatured(project)}
                  className={`p-2 rounded-lg shrink-0 ml-2 ${
                    project.featured
                      ? 'text-[#d4a017] bg-[#d4a017]/10'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  title={project.featured ? 'Remove from Homepage' : 'Feature on Homepage'}
                >
                  {project.featured ? <Star size={18} /> : <StarOff size={18} />}
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    <Github size={16} />
                  </a>
                )}
                <span className="text-gray-500 text-xs">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                  onClick={() => handleEdit(project)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg text-sm"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => openDeleteModal(project)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg text-sm"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No projects yet. Create your first project!
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-[#141414]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-400 truncate max-w-md">
                          {project.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleFeatured(project)}
                        className={`p-2 rounded-lg ${
                          project.featured
                            ? 'text-[#d4a017] bg-[#d4a017]/10'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        title={project.featured ? 'Remove from Homepage' : 'Feature on Homepage'}
                      >
                        {project.featured ? <Star size={20} /> : <StarOff size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(project)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg"
                          title="Delete"
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

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteModal.projectName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
