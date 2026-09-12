import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cartApi } from '../../api/services';
import type { Cart as CartType } from '../../types';
import { ArrowRight, Trash2, Plus, Minus, Loader2, ShoppingBag } from 'lucide-react';

export const Cart: React.FC = () => {
  const [cart, setCart] = useState<CartType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const res = await cartApi.getCart();
      setCart(res.data);
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      const res = await cartApi.updateQuantity(itemId, newQty);
      setCart(res.data);
    } catch (err) {
      console.error('Failed to update quantity', err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const res = await cartApi.removeItem(itemId);
      setCart(res.data);
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const handleClearCart = async () => {
    try {
      await cartApi.clearCart();
      setCart(null);
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm">Loading shopping cart...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <ShoppingBag className="w-6 h-6 text-indigo-400" />
          <span>Shopping Cart</span>
        </h1>

        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-xs text-red-400 hover:underline flex items-center space-x-1"
          >
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
          <p className="text-lg font-bold text-slate-200">Your cart is empty</p>
          <p className="text-sm text-slate-500">Explore products from sellers and add items to your cart.</p>
          <Link
            to="/buyer/products"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 shrink-0 overflow-hidden">
                  {item.product?.images && item.product.images[0] ? (
                    <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>Thumb</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">
                    {item.product?.name || `Product #${item.productId}`}
                  </h3>
                  <p className="text-sm font-bold text-indigo-400 mt-1">${Number(item.price).toFixed(2)}</p>
                </div>

                <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-semibold px-2 text-white">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 h-fit">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Order Summary</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-white text-base border-t border-slate-800 pt-3">
                <span>Total Amount</span>
                <span className="text-indigo-400">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/buyer/checkout"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/30"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
