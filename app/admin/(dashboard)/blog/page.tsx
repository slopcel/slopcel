'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BlogPost } from '@/types/database';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Image as ImageIcon, ExternalLink, Star, StarOff } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import MarkdownEditor from '@/components/admin/MarkdownEditor';

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postId: string | null; postTitle: string }>({
    isOpen: false,
    postId: null,
    postTitle: '',
  });
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnail_url: '',
    published: false,
    featured: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load blog posts');
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : generateSlug(title),
    }));
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `blog-${Date.now()}.${fileExt}`;
      const filePath = `blog-thumbnails/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // If bucket doesn't exist, try creating it or provide helpful error
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage bucket not configured. Please create a "public" bucket in Supabase Storage.');
        } else {
          throw uploadError;
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        thumbnail_url: urlData.publicUrl,
      }));

      toast.success('Thumbnail uploaded!');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeThumbnail = () => {
    setFormData(prev => ({
      ...prev,
      thumbnail_url: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Title, slug, and content are required');
      return;
    }

    const postData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt || null,
      content: formData.content,
      thumbnail_url: formData.thumbnail_url || null,
      published: formData.published,
      featured: formData.featured,
      published_at: formData.published ? new Date().toISOString() : null,
    };

    if (editingPost) {
      const { error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', editingPost.id);

      if (error) {
        console.error('Error updating post:', error);
        toast.error('Error updating post');
      } else {
        fetchPosts();
        resetForm();
        toast.success('Post updated successfully!');
      }
    } else {
      const { error } = await supabase.from('blog_posts').insert([postData]);

      if (error) {
        console.error('Error creating post:', error);
        if (error.code === '23505') {
          toast.error('A post with this slug already exists');
        } else {
          toast.error('Error creating post');
        }
      } else {
        fetchPosts();
        resetForm();
        toast.success('Post created successfully!');
      }
    }
  };

  const openDeleteModal = (post: BlogPost) => {
    setDeleteModal({
      isOpen: true,
      postId: post.id,
      postTitle: post.title,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, postId: null, postTitle: '' });
  };

  const handleDelete = async () => {
    if (!deleteModal.postId) return;

    setDeleting(true);
    const { error } = await supabase.from('blog_posts').delete().eq('id', deleteModal.postId);

    if (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    } else {
      fetchPosts();
      toast.success('Post deleted successfully!');
    }
    setDeleting(false);
    closeDeleteModal();
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      thumbnail_url: post.thumbnail_url || '',
      published: post.published,
      featured: post.featured,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFeatured = async (post: BlogPost) => {
    const newFeatured = !post.featured;
    const { error } = await supabase
      .from('blog_posts')
      .update({ featured: newFeatured })
      .eq('id', post.id);

    if (error) {
      console.error('Error updating featured status:', error);
      toast.error('Error updating featured status');
    } else {
      fetchPosts();
      toast.success(newFeatured ? 'Post featured on homepage!' : 'Post removed from homepage!');
    }
  };

  const togglePublished = async (post: BlogPost) => {
    const newPublished = !post.published;
    const { error } = await supabase
      .from('blog_posts')
      .update({ 
        published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
      })
      .eq('id', post.id);

    if (error) {
      console.error('Error updating published status:', error);
      toast.error('Error updating status');
    } else {
      fetchPosts();
      toast.success(newPublished ? 'Post published!' : 'Post unpublished!');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      thumbnail_url: '',
      published: false,
      featured: false,
    });
    setEditingPost(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="text-gray-400">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Blog</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your blog posts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {editingPost ? 'Edit Post' : 'New Post'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                placeholder="My Awesome Blog Post"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base font-mono"
                placeholder="my-awesome-blog-post"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL: /blog/{formData.slug || 'your-slug'}
              </p>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Thumbnail
              </label>
              
              {formData.thumbnail_url ? (
                <div className="relative inline-block">
                  <img
                    src={formData.thumbnail_url}
                    alt="Thumbnail preview"
                    className="w-48 h-32 object-cover rounded-lg border border-gray-800"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-[#d4a017] transition-colors ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-400">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-gray-400">Upload image</span>
                      </>
                    )}
                  </label>
                  
                  <span className="text-gray-500 text-sm self-center">or</span>
                  
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="flex-1 px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm"
                    placeholder="Paste image URL"
                  />
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
                className="w-full px-3 sm:px-4 py-2 bg-[#141414] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#d4a017] text-sm sm:text-base"
                placeholder="A brief summary of your post..."
              />
            </div>

            {/* Content with Markdown Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content *
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Write your blog post here... (Markdown supported)"
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded border-gray-800 bg-[#141414] text-[#d4a017] focus:ring-[#d4a017]"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-300">
                Publish immediately
              </label>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-gray-800 bg-[#141414] text-[#d4a017] focus:ring-[#d4a017]"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-300">
                Feature on Homepage
              </label>
            </div>
            <p className="text-xs text-gray-500 -mt-2 ml-7">
              Shows this post in the blog section on the homepage (max 3 posts)
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-800">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                {editingPost ? 'Update Post' : 'Create Post'}
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
        {posts.length === 0 ? (
          <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-8 text-center text-gray-400">
            No blog posts yet. Create your first post!
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-[#0d0d0d] border border-gray-800 rounded-lg overflow-hidden"
            >
              {post.thumbnail_url && (
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold line-clamp-2">{post.title}</h3>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => toggleFeatured(post)}
                      className={`p-2 rounded-lg ${
                        post.featured
                          ? 'text-[#d4a017] bg-[#d4a017]/20'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      title={post.featured ? 'Remove from Homepage' : 'Feature on Homepage'}
                    >
                      {post.featured ? <Star size={18} /> : <StarOff size={18} />}
                    </button>
                    <button
                      onClick={() => togglePublished(post)}
                      className={`p-2 rounded-lg ${
                        post.published
                          ? 'text-green-400 bg-green-900/20'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      title={post.published ? 'Unpublish' : 'Publish'}
                    >
                      {post.published ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                
                {post.excerpt && (
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                
                <div className="flex items-center flex-wrap gap-2 mb-3 text-xs text-gray-500">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded ${
                    post.published 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                  {post.featured && (
                    <span className="px-2 py-0.5 rounded bg-[#d4a017]/20 text-[#d4a017]">
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-gray-800">
                  {post.published && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg text-sm"
                    >
                      <ExternalLink size={16} />
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(post)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg text-sm"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(post)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
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
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Featured
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
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No blog posts yet. Create your first post!
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[#141414]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {post.thumbnail_url ? (
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-gray-800 rounded flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500 font-mono">/blog/{post.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(post)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          post.published
                            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {post.published ? <Eye size={14} /> : <EyeOff size={14} />}
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleFeatured(post)}
                        className={`p-2 rounded-lg ${
                          post.featured
                            ? 'text-[#d4a017] bg-[#d4a017]/10'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        title={post.featured ? 'Remove from Homepage' : 'Feature on Homepage'}
                      >
                        {post.featured ? <Star size={20} /> : <StarOff size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {post.published && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg"
                            title="View"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(post)}
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
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteModal.postTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

