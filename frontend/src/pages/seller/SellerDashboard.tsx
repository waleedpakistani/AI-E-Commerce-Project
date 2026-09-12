import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sellerDashboardApi, sellerOrdersApi } from '../../api/services';
import type { DashboardStats, Order, Product } from '../../types';
import { DollarSign, ShoppingBag, Package, AlertTriangle, ArrowUpRight, Loader2, Store as StoreIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SellerDashboard: React.FC = () => {
  const { currentStore } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    if (!currentStore?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        sellerDashboardApi.getStats(currentStore.id).catch(() => null),
        sellerOrdersApi.getStoreOrders(currentStore.id, { limit: 5 }).catch(() => null),
        sellerDashboardApi.getLowStock(currentStore.id).catch(() => null),
      ]);

      if (statsRes) setStats(statsRes.data);
      if (ordersRes) setRecentOrders(ordersRes.data.data || []);
      if (lowStockRes) setLowStockProducts(lowStockRes.data || []);
    } catch (err) {
      console.error('Failed to load seller dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentStore?.id]);

  if (!currentStore) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
        <StoreIcon className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Store Found</h2>
        <p className="text-sm text-slate-400">Please select or register a store to access your seller analytics.</p>
        <Link to="/seller/settings" className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold">
          Create / Configure Store
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
        <p className="text-sm">Loading seller dashboard analytics...</p>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 text-purple-400' },
    { title: 'Active Products', value: stats?.activeProducts || 0, icon: Package, color: 'from-indigo-600/20 to-indigo-900/10 border-indigo-500/30 text-indigo-400' },
    { title: 'Low Stock Alerts', value: `${stats?.lowStockAlerts || 0} items`, icon: AlertTriangle, color: 'from-amber-600/20 to-amber-900/10 border-amber-500/30 text-amber-400' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Seller Analytics Dashboard</h1>
        <p className="text-slate-400 text-sm">Store context: <span className="text-purple-400 font-semibold">{currentStore.name}</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className={`bg-gradient-to-br ${st.color} border rounded-2xl p-6 shadow-xl`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{st.title}</span>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-white">{st.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Warning Banner if applicable */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Warning: {lowStockProducts.length} product(s) in your store are running low on stock!</span>
          </div>
          <Link to="/seller/inventory" className="font-bold underline hover:text-amber-200">
            View Inventory
          </Link>
        </div>
      )}

      {/* Recent Orders Overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">Recent Orders Overview</h2>
          <Link to="/seller/orders" className="text-xs text-purple-400 hover:underline flex items-center space-x-1">
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No recent orders placed for this store.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">#{row.orderNumber}</td>
                    <td className="py-3 px-4">{row.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">${Number(row.totalAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
