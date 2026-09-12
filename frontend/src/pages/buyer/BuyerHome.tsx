import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Grid, Star } from 'lucide-react';

export const BuyerHome: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
            Buyer Marketplace Portal
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Discover Trending Products & Multi-Store Deals
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Explore products across multiple stores, add items to your cart, manage your wishlist, and place seamless orders.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              to="/buyer/products"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              <Grid className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>
            <Link
              to="/buyer/orders"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition border border-slate-700"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Orders</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Categories Placeholder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Featured Categories</h2>
          <Link to="/buyer/products" className="text-indigo-400 text-sm hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['Electronics', 'Fashion', 'Home & Living', 'Accessories'].map((cat, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 text-center group cursor-pointer transition"
            >
              <div className="w-12 h-12 bg-indigo-600/10 rounded-xl mx-auto flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">{cat}</h3>
              <p className="text-xs text-slate-500 mt-1">Explore Products</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerHome;
