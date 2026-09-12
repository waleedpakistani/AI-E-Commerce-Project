import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sellerDashboardApi, sellerProductsApi } from '../../api/services';
import type { Product } from '../../types';
import { Layers, AlertTriangle, RefreshCw, Loader2, Store } from 'lucide-react';

export const SellerInventory: React.FC = () => {
  const { currentStore } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockList, setLowStockList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchInventoryData = async () => {
    if (!currentStore?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [allProdRes, lowStockRes] = await Promise.all([
        sellerProductsApi.getStoreProducts(currentStore.id, { limit: 100 }).catch(() => null),
        sellerDashboardApi.getLowStock(currentStore.id).catch(() => null),
      ]);

      if (allProdRes) setProducts(allProdRes.data.data || []);
      if (lowStockRes) setLowStockList(lowStockRes.data || []);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [currentStore?.id]);

  if (!currentStore) {
    return (
      <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4 max-w-xl mx-auto">
        <Store className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Store</h2>
        <p className="text-sm">Please register or configure a store first.</p>
      </div>
    );
  }

  const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-6 h-6 text-purple-400" />
            <span>Store Inventory & Stock</span>
          </h1>
          <p className="text-slate-400 text-sm">Managing stock for: <span className="text-purple-400 font-semibold">{currentStore.name}</span></p>
        </div>

        <button
          onClick={fetchInventoryData}
          className="flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
          <p className="text-sm">Loading store inventory...</p>
        </div>
      ) : (
        <>
          {/* Inventory Overview Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Stock Quantity</span>
              <h3 className="text-3xl font-bold text-white mt-2">{totalStock} units</h3>
            </div>
            <div className="bg-amber-900/10 border border-amber-500/20 p-6 rounded-2xl">
              <span className="text-xs text-amber-400 font-semibold uppercase flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock Threshold (&le;5)</span>
              </span>
              <h3 className="text-3xl font-bold text-amber-300 mt-2">{lowStockList.length} products</h3>
            </div>
            <div className="bg-red-900/10 border border-red-500/20 p-6 rounded-2xl">
              <span className="text-xs text-red-400 font-semibold uppercase">Out of Stock Items</span>
              <h3 className="text-3xl font-bold text-red-400 mt-2">{outOfStockCount} products</h3>
            </div>
          </div>

          {/* Low Stock Items List */}
          {lowStockList.length > 0 && (
            <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Low Stock Action Items</span>
              </h3>
              <div className="divide-y divide-slate-800/60">
                {lowStockList.map((prod) => (
                  <div key={prod.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-sm">{prod.name}</h4>
                      <p className="text-xs text-slate-400">Current Stock: <strong className="text-amber-400">{prod.stockQuantity} units</strong></p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30">
                      Restock Recommended
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerInventory;
