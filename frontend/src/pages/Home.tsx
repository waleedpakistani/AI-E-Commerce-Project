import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>E-Commerce Platform Multi-Portal</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Next-Gen AI Powered <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            E-Commerce Ecosystem
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Select a portal to explore the platform architecture. Seamlessly switch between the Buyer Marketplace and the Seller Hub.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 max-w-3xl mx-auto">
          {/* Buyer Portal Card */}
          <div className="group relative bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-left hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Buyer Portal</h2>
            <p className="text-slate-400 text-sm mb-6">
              Browse products, add items to cart/wishlist, place orders with transaction safety, and track order status.
            </p>
            <Link
              to="/buyer"
              className="inline-flex items-center space-x-2 text-indigo-400 font-semibold group-hover:text-indigo-300 transition"
            >
              <span>Enter Marketplace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Seller Hub Card */}
          <div className="group relative bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-left hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/10">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Seller Hub</h2>
            <p className="text-slate-400 text-sm mb-6">
              Manage store inventory, process orders, update shipping status, track stock levels, and view customer metrics.
            </p>
            <Link
              to="/seller"
              className="inline-flex items-center space-x-2 text-purple-400 font-semibold group-hover:text-purple-300 transition"
            >
              <span>Manage Store Hub</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/80 text-slate-400 text-sm max-w-3xl mx-auto">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>React + TypeScript + Vite</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Tailwind CSS Styling</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Store className="w-4 h-4 text-pink-400" />
            <span>Scalable Modular Routes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
