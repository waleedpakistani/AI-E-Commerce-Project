import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storesApi } from '../../api/services';
import { Settings, Store, Save, Loader2, CheckCircle } from 'lucide-react';

export const SellerStoreSettings: React.FC = () => {
  const { currentStore, setCurrentStore, refreshSellerStores } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (currentStore) {
      setName(currentStore.name || '');
      setDescription(currentStore.description || '');
    }
  }, [currentStore]);

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore?.id) return;
    setIsLoading(true);
    try {
      const res = await storesApi.updateStore(currentStore.id, { name, description });
      setCurrentStore(res.data);
      setNotification('Store settings saved successfully!');
      setTimeout(() => setNotification(null), 3000);
      refreshSellerStores();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update store details');
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce text-sm font-semibold">
          <CheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-purple-400" />
          <span>Store Settings</span>
        </h1>
        <p className="text-slate-400 text-sm">Configure store profile, branding, and details</p>
      </div>

      <form onSubmit={handleSaveStore} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Store className="w-5 h-5 text-indigo-400" />
            <span>General Store Profile</span>
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Store Slug (Immutable)</label>
              <input
                type="text"
                disabled
                value={currentStore.slug}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 font-mono text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Store Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your store and products..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-purple-600/30"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerStoreSettings;
