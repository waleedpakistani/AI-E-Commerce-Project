import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sellerProductsApi, categoriesApi } from '../../api/services';
import type { Product, Category } from '../../types';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Store,
  Tag,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

export const SellerProducts: React.FC = () => {
  const { currentStore } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Add / Edit Product
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Stock Edit State
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  const fetchCategories = async () => {
    if (!currentStore?.id) return;
    try {
      const res = await categoriesApi.getStoreCategories(currentStore.id);
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load store categories', err);
    }
  };

  const fetchProducts = async () => {
    if (!currentStore?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await sellerProductsApi.getStoreProducts(currentStore.id, {
        page,
        limit: 10,
        search: search || undefined,
        categoryId: selectedCategoryFilter || undefined,
      });

      const responseData: any = res.data;
      if (Array.isArray(responseData)) {
        setProducts(responseData);
        setTotalPages(1);
      } else if (responseData && Array.isArray(responseData.data || responseData.items)) {
        setProducts(responseData.data || responseData.items || []);
        setTotalPages(responseData.totalPages || responseData.pagination?.totalPages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('Failed to load store products', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentStore?.id]);

  useEffect(() => {
    fetchProducts();
  }, [currentStore?.id, page, selectedCategoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId('');
    setPrice('');
    setStockQuantity('');
    setDescription('');
    setImageUrl('');
    setStatus('ACTIVE');
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.categoryId || p.category?.id || '');
    setPrice(p.price.toString());
    setStockQuantity(p.stockQuantity.toString());
    setDescription(p.description || '');
    setImageUrl(p.images && p.images[0] ? p.images[0] : '');
    setStatus(p.status || 'ACTIVE');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore?.id) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        categoryId: categoryId || undefined,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity),
        description: description.trim() || undefined,
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
        status,
      };

      if (editingProduct) {
        await sellerProductsApi.updateProduct(editingProduct.id, payload);
      } else {
        await sellerProductsApi.createProduct(currentStore.id, payload);
      }

      setShowProductModal(false);
      setName('');
      setCategoryId('');
      setPrice('');
      setStockQuantity('');
      setDescription('');
      setImageUrl('');
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStock = async (productId: string) => {
    try {
      await sellerProductsApi.updateStock(productId, newStockVal);
      setEditingStockId(null);
      await fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await sellerProductsApi.deleteProduct(productId);
      await fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (!currentStore) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
        <Store className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Store Selected</h2>
        <p className="text-sm">Please register or configure a store first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Store Products Management</h1>
          <p className="text-slate-400 text-sm">
            Managing products for: <span className="text-purple-400 font-semibold">{currentStore.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchProducts}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition"
            title="Refresh Products"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title or description..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 transition"
          >
            Search
          </button>
        </form>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => {
              setSelectedCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
          <p className="text-sm">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-lg font-bold text-slate-200 mb-1">No products found</p>
          <p className="text-sm text-slate-500">
            {search || selectedCategoryFilter
              ? 'No products match your search or filter.'
              : 'Click "Add New Product" to list your first item.'}
          </p>
          {!search && !selectedCategoryFilter && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Product</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => {
                const categoryName =
                  p.category?.name ||
                  categories.find((c) => c.id === p.categoryId)?.name ||
                  'Uncategorized';

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    {/* Image & Title & Description */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-700/50">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm line-clamp-1">{p.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                            {p.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-800/30">
                        <Tag className="w-3 h-3" />
                        <span>{categoryName}</span>
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-purple-300">
                      ${Number(p.price).toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4">
                      {editingStockId === p.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={newStockVal}
                            onChange={(e) => setNewStockVal(parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-950 border border-purple-500 rounded px-2 py-1 text-xs text-white"
                          />
                          <button
                            onClick={() => handleSaveStock(p.id)}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              p.stockQuantity <= 5
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {p.stockQuantity} units
                          </span>
                          <button
                            onClick={() => {
                              setEditingStockId(p.id);
                              setNewStockVal(p.stockQuantity);
                            }}
                            className="text-[10px] text-purple-400 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : p.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center space-x-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center space-x-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Noise-Canceling Headphones"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Category Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
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
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
