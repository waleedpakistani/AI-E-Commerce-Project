import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistApi, cartApi } from '../../api/services';
import type { WishlistItem } from '../../types';
import { Heart, ShoppingCart, Trash2, Loader2, CheckCircle } from 'lucide-react';

export const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    try {
      const res = await wishlistApi.getWishlist();
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveItem = async (productId: string) => {
    try {
      await wishlistApi.removeItem(productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const handleAddToCart = async (productId: string, itemId: string) => {
    try {
      await cartApi.addItem(productId, 1);
      await wishlistApi.removeItem(productId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setNotification('Moved item to cart!');
      navigate('/buyer/cart');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce text-sm font-semibold">
          <CheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Heart className="w-6 h-6 text-pink-500" />
        <h1 className="text-2xl font-bold text-white">My Saved Wishlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-lg font-bold text-slate-200 mb-1">Your wishlist is empty</p>
          <p className="text-sm text-slate-500">Save items while browsing to view them later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((w) => (
            <div key={w.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="h-36 bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-xs text-slate-500 overflow-hidden">
                  {w.product?.images && w.product.images[0] ? (
                    <img src={w.product.images[0]} alt={w.product?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>Wishlist Image</span>
                  )}
                </div>
                <h3 className="font-semibold text-white text-sm truncate">
                  {w.product?.name || `Product #${w.productId}`}
                </h3>
                <p className="text-sm font-bold text-indigo-400 mt-1">
                  ${w.product?.price ? Number(w.product.price).toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleAddToCart(w.productId, w.id)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => handleRemoveItem(w.productId)}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition border border-slate-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
