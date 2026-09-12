import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sellerOrdersApi } from '../../api/services';
import type { Order, PaginatedResponse } from '../../types';
import { Search, Eye, Loader2, ChevronLeft, ChevronRight, Store, X } from 'lucide-react';

export const SellerOrders: React.FC = () => {
  const { currentStore } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!currentStore?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await sellerOrdersApi.getStoreOrders(currentStore.id, {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const data: PaginatedResponse<Order> = res.data;
      setOrders(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load store orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentStore?.id, page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!currentStore?.id) return;
    try {
      await sellerOrdersApi.updateOrderStatus(currentStore.id, orderId, newStatus);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleViewDetails = async (orderId: string) => {
    if (!currentStore?.id) return;
    try {
      const res = await sellerOrdersApi.getOrderDetails(currentStore.id, orderId);
      setSelectedOrder(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load order details');
    }
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
        <h1 className="text-2xl font-bold text-white">Store Orders Management</h1>
        <p className="text-slate-400 text-sm">Managing orders for: <span className="text-purple-400 font-semibold">{currentStore.name}</span></p>
      </div>

      {/* Controls Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
          Search
        </button>
      </form>

      {/* Orders Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
          <p className="text-sm">Loading store orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-lg font-bold text-slate-200 mb-1">No orders found</p>
          <p className="text-sm text-slate-500">Orders placed for your products will appear here.</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status Transition</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-white">#{ord.orderNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold block text-slate-200">{ord.customerName}</span>
                    <span className="text-xs text-slate-500">{ord.customerEmail}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-purple-300">${Number(ord.totalAmount).toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {ord.paymentMethod} ({ord.paymentStatus})
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleViewDetails(ord.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Order Details Drawer/Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Order #{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-white">Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})</p>
              <p><strong className="text-white">Order Status:</strong> {selectedOrder.status}</p>
              <p><strong className="text-white">Payment:</strong> {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}</p>
              <p><strong className="text-white">Date Placed:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Ordered Items</h4>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl text-xs">
                  <div>
                    <span className="font-semibold text-white block">{item.productName}</span>
                    <span className="text-slate-500">Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</span>
                  </div>
                  <span className="font-bold text-purple-300">${Number(item.totalPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Amount:</span>
              <span className="text-purple-400">${Number(selectedOrder.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
