import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Layers, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SellerSidebar: React.FC = () => {
  const { currentStore } = useAuth();

  const sellerLinks = [
    { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seller/products', label: 'Products', icon: Package },
    { to: '/seller/categories', label: 'Categories', icon: FolderTree },
    { to: '/seller/inventory', label: 'Inventory', icon: Layers },
    { to: '/seller/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/seller/customers', label: 'Customers', icon: Users },
    { to: '/seller/settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="px-3 py-2 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-xl">
          <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Store Context</p>
          <h3 className="font-bold text-slate-100 text-sm mt-0.5 truncate">
            {currentStore?.name || 'No Store Active'}
          </h3>
        </div>

        <nav className="space-y-1">
          {sellerLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="text-xs text-slate-500 border-t border-slate-800 pt-4 px-2">
        <p>Seller Portal v1.0</p>
      </div>
    </aside>
  );
};

export default SellerSidebar;
