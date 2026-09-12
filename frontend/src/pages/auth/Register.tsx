import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/services';
import { ShoppingBag, Store, User, Mail, Lock, Phone, AlertCircle, Loader2, ArrowRight, Building } from 'lucide-react';
import type { UserRole } from '../../types';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<UserRole>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Seller specific fields
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (role === 'SELLER' && !storeName) {
      setStoreName(`${val}'s Store`);
      setStoreSlug(`${val.toLowerCase().replace(/\s+/g, '-')}-store`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (role === 'SELLER') {
        const payload = {
          name,
          email,
          password,
          phone: phone || undefined,
          storeName: storeName || `${name}'s Store`,
          storeSlug: storeSlug || `${name.toLowerCase().replace(/\s+/g, '-')}-store-${Date.now()}`,
          description: 'Official Seller Store',
        };
        const res = await authApi.registerSeller(payload);
        const { accessToken, seller, store } = res.data;
        login(accessToken, seller, store);
        navigate('/seller/dashboard');
      } else {
        const payload = { name, email, password, phone: phone || undefined };
        const res = await authApi.registerBuyer(payload);
        const { accessToken, buyer } = res.data;
        login(accessToken, buyer);
        navigate('/buyer');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || 'Registration failed. Please check your input.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm">Join the AURA E-Commerce ecosystem</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setRole('BUYER'); setError(null); }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition ${
              role === 'BUYER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buyer Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('SELLER'); setError(null); }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition ${
              role === 'SELLER'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Seller Account</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Seller Store Information */}
          {role === 'SELLER' && (
            <div className="pt-2 border-t border-slate-800 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">Initial Store Setup</span>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="My Store Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Slug</label>
                <input
                  type="text"
                  required
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  placeholder="my-store-name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-xl ${
              role === 'SELLER'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Register as {role === 'SELLER' ? 'Seller' : 'Buyer'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline font-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
