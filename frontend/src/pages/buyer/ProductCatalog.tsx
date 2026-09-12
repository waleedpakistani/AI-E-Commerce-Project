import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buyerProductsApi, cartApi, wishlistApi } from '../../api/services';
import type { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingCart, Heart, Loader2, ChevronLeft, ChevronRight, CheckCircle, Tag } from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await buyerProductsApi.getProducts({ page, limit: 12, search: search || undefined });
      const responseData: any = res.data;
      if (Array.isArray(responseData)) {
        setProducts(responseData);
        setTotalPages(1);
      } else if (responseData && Array.isArray(responseData.items || responseData.data)) {
        setProducts(responseData.items || responseData.data || []);
        setTotalPages(responseData.pagination?.totalPages || responseData.totalPages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch buyer products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in as a buyer to add items to your cart.');
      navigate('/login');
      return;
    }

    if (role !== 'BUYER') {
      alert('Only buyer accounts can add items to the cart. Please sign in with a buyer account.');
      return;
    }

    try {
      await cartApi.addItem(productId, 1);
      setNotification('Item added to cart!');
      navigate('/buyer/cart');
    } catch (err: any) {
      console.error('Failed to add item to cart', err);
      if (err.response?.status === 401) {
        alert('Please sign in as a buyer to add items to your cart.');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('Only buyer accounts can add items to the cart.');
      } else {
        const msg = err.response?.data?.message || 'Failed to add item to cart.';
        alert(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      alert('Please sign in as a buyer to save items to your wishlist.');
      navigate('/login');
      return;
    }

    if (role !== 'BUYER') {
      alert('Only buyer accounts can save items to wishlist.');
      return;
    }

    try {
      await wishlistApi.addItem(productId);
      setNotification('Item saved to wishlist!');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      if (err.response?.status === 401) {
        alert('Please sign in as a buyer to save items to your wishlist.');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('Only buyer accounts can save items to wishlist.');
      } else {
        const msg = err.response?.data?.message || 'Failed to add item to wishlist.';
        alert(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce text-sm font-semibold">
          <CheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace Catalog</h1>
          <p className="text-slate-400 text-sm">Explore verified products from active stores</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          <p className="text-sm">Loading products from stores...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-lg font-bold text-slate-200 mb-1">No products found</p>
          <p className="text-sm text-slate-500">Try adjusting your search criteria or explore other categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/40 transition group shadow-lg"
            >
              <div>
                <Link to={`/buyer/products/${prod.id}`}>
                  <div className="h-44 bg-slate-800/80 rounded-xl mb-4 flex items-center justify-center text-slate-400 font-medium text-xs overflow-hidden relative group-hover:scale-98 transition-transform">
                    {prod.images && prod.images[0] ? (
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>No Image</span>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {prod.category?.name && (
                    <span className="inline-flex items-center space-x-1 text-[10px] text-purple-300 font-semibold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      <Tag className="w-2.5 h-2.5" />
                      <span>{prod.category.name}</span>
                    </span>
                  )}
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    In Stock ({prod.stockQuantity})
                  </span>
                </div>

                <Link to={`/buyer/products/${prod.id}`}>
                  <h3 className="font-semibold text-slate-100 text-base group-hover:text-indigo-300 transition line-clamp-1">
                    {prod.name}
                  </h3>
                </Link>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {prod.description || 'Quality product available in store.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Price</span>
                  <span className="text-lg font-bold text-white">${Number(prod.price).toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddToWishlist(prod.id)}
                    title="Add to Wishlist"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAddToCart(prod.id)}
                    title="Add to Cart"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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
    </div>
  );
};

export default ProductCatalog;
