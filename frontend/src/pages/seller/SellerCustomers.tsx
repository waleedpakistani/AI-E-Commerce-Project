import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sellerCustomersApi } from '../../api/services';
import type { Customer, PaginatedResponse } from '../../types';
import { Search, Users, Mail, Phone, Calendar, ShoppingBag, Loader2, Store, ChevronLeft, ChevronRight } from 'lucide-react';

export const SellerCustomers: React.FC = () => {
  const { currentStore } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCustomers = async () => {
    if (!currentStore?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await sellerCustomersApi.getStoreCustomers(currentStore.id, {
        page,
        limit: 9,
        search: search || undefined,
      });
      const data: PaginatedResponse<Customer> = res.data;
      setCustomers(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load store customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentStore?.id, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  if (!currentStore) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
        <Store className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Store</h2>
        <p className="text-sm">Please register or configure a store first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Users className="w-6 h-6 text-purple-400" />
          <span>Store Customer Insights</span>
        </h1>
        <p className="text-slate-400 text-sm">Customers for store: <span className="text-purple-400 font-semibold">{currentStore.name}</span></p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button type="submit" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 transition">
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
          <p className="text-sm">Loading store customer insights...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-lg font-bold text-slate-200 mb-1">No customers found</p>
          <p className="text-sm text-slate-500">Customers who place orders in your store will be aggregated here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {customers.map((c, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-purple-500/40 transition shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-full flex items-center justify-center text-purple-300 font-bold text-base">
                  {(c.customerName || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{c.customerName || 'Customer'}</h3>
                  <span className="text-xs text-slate-500">Verified Buyer</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-b border-slate-800/80 py-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.customerEmail}</span>
                </div>
                {c.customerPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.customerPhone}</span>
                  </div>
                )}
                {c.lastOrderDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Last purchase: {new Date(c.lastOrderDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-1 text-slate-400">
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  <span>{c.totalOrders} order(s)</span>
                </div>
                <span className="text-sm font-bold text-purple-300">${Number(c.totalSpent).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <span className="text-xs text-slate-400 font-medium">Page {page} of {totalPages}</span>
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

export default SellerCustomers;
