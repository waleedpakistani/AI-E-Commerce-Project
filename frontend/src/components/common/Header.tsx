import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, Sparkles, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, role, logout, currentStore } = useAuth();

  const isSellerRoute = location.pathname.startsWith('/seller');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-indigo-400 font-bold text-xl hover:opacity-90 transition">
          <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AURA E-Commerce
          </span>
        </Link>

        <nav className="flex items-center space-x-4">
          <Link
            to="/buyer"
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              !isSellerRoute
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buyer Marketplace</span>
          </Link>

          {(role === 'SELLER' || role === 'ADMIN' || !isAuthenticated) && (
            <Link
              to="/seller"
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isSellerRoute
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Seller Hub</span>
            </Link>
          )}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{user.name}</span>
                <span className="text-[10px] text-indigo-400 uppercase font-semibold">
                  {role} {currentStore ? `• ${currentStore.name}` : ''}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-md shadow-indigo-600/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
