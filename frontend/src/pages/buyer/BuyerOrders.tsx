import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buyerOrdersApi } from '../../api/services';
import type { Order } from '../../types';
import { Package, Clock, CheckCircle2, Truck, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export const BuyerOrders: React.FC = () => {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(
    !!(location.state as any)?.orderSuccess
  );

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await buyerOrdersApi.getOrders({ page, limit: 10 });
      const data = res.data as any;
      const list = data.items || data.data || [];
      const totalP = data.pagination?.totalPages || data.totalPages || 1;
      setOrders(list);
      setTotalPages(totalP);
    } catch (err) {
      console.error('Failed to load buyer orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await buyerOrdersApi.cancelOrder(orderId);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /><span>Delivered</span></span>;
      case 'SHIPPED':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium"><Truck className="w-3 h-3" /><span>Shipped</span></span>;
      case 'PENDING':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium"><Clock className="w-3 h-3" /><span>Pending</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium"><XCircle className="w-3 h-3" /><span>{status}</span></span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {showSuccessBanner && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-300 text-sm shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-200">Order Placed Successfully!</p>
              <p className="text-xs text-emerald-400/90">
                Your order has been confirmed and placed with the seller(s).
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-xs text-emerald-400 hover:text-white font-semibold underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
        <Package className="w-6 h-6 text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Order History</h1>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          <p className="text-sm">Loading order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-lg font-bold text-slate-200 mb-1">No orders found</p>
          <p className="text-sm text-slate-500">Orders placed on the marketplace will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/30 transition">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-white text-base">#{ord.orderNumber}</span>
                  {getStatusBadge(ord.status)}
                </div>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(ord.createdAt).toLocaleDateString()} • Payment: {ord.paymentMethod} ({ord.paymentStatus})
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-6">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Amount</span>
                  <span className="text-lg font-bold text-indigo-400">${Number(ord.totalAmount).toFixed(2)}</span>
                </div>

                {ord.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelOrder(ord.id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 transition"
                  >
                    Cancel Order
                  </button>
                )}
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
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {totalPages}
          </span>
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

export default BuyerOrders;
