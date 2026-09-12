import React, { useState, useEffect } from 'react';
import { buyerProfileApi } from '../../api/services';
import { MapPin, Mail, Phone, Plus, Loader2, User as UserIcon } from 'lucide-react';

export const BuyerProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Address Modal form state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const [profRes, addrRes] = await Promise.all([
        buyerProfileApi.getProfile().catch(() => null),
        buyerProfileApi.getAddresses().catch(() => null),
      ]);
      if (profRes) setProfile(profRes.data);
      if (addrRes) setAddresses(addrRes.data || []);
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await buyerProfileApi.addAddress({ name, street, city, postalCode, phone });
      setShowModal(false);
      setName(''); setStreet(''); setCity(''); setPostalCode(''); setPhone('');
      fetchProfileData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add address');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm">Loading buyer profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white border-b border-slate-800 pb-4">Buyer Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:col-span-1 space-y-4 text-center">
          <div className="w-20 h-20 bg-indigo-600/20 border border-indigo-500/30 rounded-full mx-auto flex items-center justify-center text-indigo-400">
            <UserIcon className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{profile?.name || 'Registered Buyer'}</h2>
            <p className="text-xs text-slate-400 uppercase font-semibold">Buyer Account</p>
          </div>
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300 text-left">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{profile?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{profile?.phone || 'No phone provided'}</span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <span>Saved Shipping Addresses</span>
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No shipping addresses saved yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <h4 className="font-semibold text-white text-sm">{addr.name}</h4>
                  <p className="text-xs text-slate-400">{addr.street}</p>
                  <p className="text-xs text-slate-400">{addr.city}, {addr.postalCode}</p>
                  <p className="text-xs text-slate-500">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding address */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Add Shipping Address</h3>
            <form onSubmit={handleAddAddress} className="space-y-3">
              <input
                type="text" required placeholder="Address Name (e.g. Home)"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
              />
              <input
                type="text" required placeholder="Street Address"
                value={street} onChange={(e) => setStreet(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text" required placeholder="City"
                  value={city} onChange={(e) => setCity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
                />
                <input
                  type="text" required placeholder="Postal Code"
                  value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
                />
              </div>
              <input
                type="text" required placeholder="Phone Number"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerProfile;
