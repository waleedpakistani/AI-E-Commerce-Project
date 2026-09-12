import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { categoriesApi } from '../../api/services';
import type { Category } from '../../types';
import { Plus, Search, Trash2, Edit3, Loader2, Store, FolderTree, AlertCircle, RefreshCw } from 'lucide-react';

export const SellerCategories: React.FC = () => {
  const { currentStore } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    if (!currentStore?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.getStoreCategories(currentStore.id);
      setCategories(res.data || []);
    } catch (err: any) {
      console.error('Failed to load store categories', err);
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentStore?.id]);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore?.id) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      };

      if (editingCategory) {
        await categoriesApi.updateCategory(editingCategory.id, payload);
      } else {
        await categoriesApi.createCategory(currentStore.id, payload);
      }

      setShowModal(false);
      setName('');
      setSlug('');
      setDescription('');
      setEditingCategory(null);
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Products associated with it might be uncategorized.')) {
      return;
    }
    try {
      await categoriesApi.deleteCategory(categoryId);
      await fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  if (!currentStore) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
        <Store className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Store Selected</h2>
        <p className="text-sm">Please create or select a store to manage categories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FolderTree className="w-6 h-6 text-purple-400" />
            <span>Category Management</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Managing categories for: <span className="text-purple-400 font-semibold">{currentStore.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
          <p className="text-sm">Loading categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <FolderTree className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-lg font-bold text-slate-200">No categories found</p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {search ? 'No categories match your search criteria.' : 'Get started by creating your first product category.'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>{cat.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-purple-300 bg-purple-950/20 px-2 py-1 rounded w-fit">
                    {cat.slug}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                    {cat.description || <span className="text-slate-600 italic">No description</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                      title="Edit Category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electronics, Clothing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. electronics (auto-generated if left blank)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCategories;
