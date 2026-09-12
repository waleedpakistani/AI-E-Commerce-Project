import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buyerProductsApi, cartApi, wishlistApi } from '../../api/services';
import type { Product } from '../../types';
import { ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Loader2, ArrowLeft, CheckCircle, Tag } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      buyerProductsApi
        .getProductDetails(id)
        .then((res) => setProduct(res.data))
        .catch((err) => console.error('Failed to load product details', err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

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
      await cartApi.addItem(product.id, quantity);
      setNotification('Item added to cart!');
      navigate('/buyer/cart');
    } catch (err: any) {
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

  const handleAddToWishlist = async () => {
    if (!product) return;

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
      await wishlistApi.addItem(product.id);
      setNotification('Item added to wishlist!');
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

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-xl font-bold text-white">Product Not Found</p>
        <button
          onClick={() => navigate('/buyer/products')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce text-sm font-semibold">
          <CheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
        {/* Image Placeholder */}
        <div className="h-80 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-400 font-medium border border-slate-700/50 overflow-hidden">
          {product.images && product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span>No Image Available</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {product.category?.name && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-lg">
                  <Tag className="w-3 h-3" />
                  <span>{product.category.name}</span>
                </span>
              )}
              <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-lg">
                Stock Available: {product.stockQuantity} units
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            <p className="text-3xl font-extrabold text-indigo-400">${Number(product.price).toFixed(2)}</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {product.description || 'Verified product listing on the store platform.'}
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-6">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-slate-400">Quantity:</label>
              <input
                type="number"
                min={1}
                max={product.stockQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-center text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/30"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleAddToWishlist}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-400 pt-4">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <Truck className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                <span>Fast Delivery</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <span>Verified Seller</span>
              </div>
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                <RotateCcw className="w-4 h-4 mx-auto mb-1 text-pink-400" />
                <span>Return Safety</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
