import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, Heart, Package, User, Grid } from 'lucide-react';

export const BuyerNavbar: React.FC = () => {
  const navItems = [
    { to: '/buyer/products', label: 'Explore Products', icon: Grid },
    { to: '/buyer/cart', label: 'Cart', icon: ShoppingCart },
    { to: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/buyer/orders', label: 'My Orders', icon: Package },
    { to: '/buyer/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="bg-slate-900/60 border-b border-slate-800 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 overflow-x-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BuyerNavbar;
