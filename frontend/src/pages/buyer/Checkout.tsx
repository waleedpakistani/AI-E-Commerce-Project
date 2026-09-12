import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartApi, buyerOrdersApi, buyerProfileApi } from '../../api/services';
import type { Cart } from '../../types';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Banknote,
  Smartphone,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();

  // Cart & Order State
  const [cart, setCart] = useState<Cart | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('NEW');

  // Shipping Form Fields (mapping to DTO: recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country)
  const [name, setName] = useState(''); // Recipient Name
  const [contactNumber, setContactNumber] = useState(''); // Phone / Contact Number
  const [street, setStreet] = useState(''); // Address Line 1 / Street
  const [addressLine2, setAddressLine2] = useState(''); // Address Line 2 (Optional)
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Pakistan');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'JAZZCASH' | 'EASYPAISA' | 'CARD'>('COD');

  // Mobile Wallet Specific Fields (JazzCash / Easypaisa)
  const [walletPhone, setWalletPhone] = useState('');

  // Card Specific Fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Order Notes
  const [notes, setNotes] = useState('');

  // UI Flow & Validation State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Load Cart & Saved Addresses on Mount
  useEffect(() => {
    const loadCheckoutData = async () => {
      setIsCartLoading(true);
      try {
        const [cartRes, addrRes] = await Promise.allSettled([
          cartApi.getCart(),
          buyerProfileApi.getAddresses(),
        ]);

        if (cartRes.status === 'fulfilled') {
          setCart(cartRes.value.data);
        }

        if (addrRes.status === 'fulfilled' && Array.isArray(addrRes.value.data)) {
          const addrs: SavedAddress[] = addrRes.value.data;
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            populateAddressFields(defaultAddr);
          }
        }
      } catch (err) {
        console.error('Failed to load checkout data', err);
      } finally {
        setIsCartLoading(false);
      }
    };

    loadCheckoutData();
  }, []);

  const populateAddressFields = (addr: SavedAddress) => {
    setName(addr.recipientName || '');
    setContactNumber(addr.phone || '');
    setStreet(addr.addressLine1 || '');
    setAddressLine2(addr.addressLine2 || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPostalCode(addr.postalCode || '');
    setCountry(addr.country || 'Pakistan');
  };

  const handleSavedAddressChange = (addrId: string) => {
    setSelectedAddressId(addrId);
    if (addrId === 'NEW') {
      setName('');
      setContactNumber('');
      setStreet('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('Pakistan');
    } else {
      const addr = savedAddresses.find((a) => a.id === addrId);
      if (addr) populateAddressFields(addr);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (selectedAddressId === 'NEW') {
      if (!name.trim()) errors.name = 'Recipient Name is required';
      if (!street.trim()) errors.street = 'Street Address (Address Line 1) is required';
      if (!city.trim()) errors.city = 'City is required';
      if (!postalCode.trim()) errors.postalCode = 'Postal Code is required';
      if (!contactNumber.trim()) errors.contactNumber = 'Contact Phone Number is required';
    }

    if (paymentMethod === 'JAZZCASH') {
      if (!walletPhone.trim()) {
        errors.walletPhone = 'JazzCash Mobile Account Number is required';
      } else if (!/^03\d{9}$/.test(walletPhone.replace(/\s+/g, ''))) {
        errors.walletPhone = 'Enter valid 11-digit JazzCash mobile number (e.g., 03001234567)';
      }
    } else if (paymentMethod === 'EASYPAISA') {
      if (!walletPhone.trim()) {
        errors.walletPhone = 'Easypaisa Mobile Account Number is required';
      } else if (!/^03\d{9}$/.test(walletPhone.replace(/\s+/g, ''))) {
        errors.walletPhone = 'Enter valid 11-digit Easypaisa mobile number (e.g., 03451234567)';
      }
    } else if (paymentMethod === 'CARD') {
      if (!cardName.trim()) errors.cardName = 'Cardholder Name is required';
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (!cleanCard) errors.cardNumber = 'Card Number is required';
      else if (!/^\d{15,16}$/.test(cleanCard)) errors.cardNumber = 'Card Number must be 15 or 16 digits';
      if (!cardExpiry.trim()) errors.cardExpiry = 'Expiry Date is required';
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) errors.cardExpiry = 'Format must be MM/YY';
      if (!cardCvv.trim()) errors.cardCvv = 'CVV is required';
      else if (!/^\d{3,4}$/.test(cardCvv.trim())) errors.cardCvv = 'CVV must be 3 or 4 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError('Please fix the validation errors in the form before submitting.');
      return;
    }

    setIsLoading(true);

    // Map shipping details to Backend DTO (ShippingAddressDto)
    const shippingAddressPayload = {
      recipientName: name.trim(),
      phone: contactNumber.trim(),
      addressLine1: street.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim() || undefined,
      postalCode: postalCode.trim(),
      country: country.trim() || 'Pakistan',
    };

    // Construct additional payment note reference if applicable
    let paymentRefNote = notes.trim();
    if (paymentMethod === 'JAZZCASH') {
      paymentRefNote = `JazzCash Account: ${walletPhone.trim()}${paymentRefNote ? ` | ${paymentRefNote}` : ''}`;
    } else if (paymentMethod === 'EASYPAISA') {
      paymentRefNote = `Easypaisa Account: ${walletPhone.trim()}${paymentRefNote ? ` | ${paymentRefNote}` : ''}`;
    } else if (paymentMethod === 'CARD') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      const last4 = cleanCard.slice(-4);
      paymentRefNote = `Paid via Card ending in ${last4} (${cardName.trim()})${paymentRefNote ? ` | ${paymentRefNote}` : ''}`;
    }

    // Build final DTO
    const checkoutPayload: any = {
      paymentMethod,
      notes: paymentRefNote || undefined,
    };

    if (selectedAddressId !== 'NEW') {
      checkoutPayload.addressId = selectedAddressId;
    } else {
      checkoutPayload.shippingAddress = shippingAddressPayload;
    }

    try {
      await buyerOrdersApi.checkout(checkoutPayload);
      navigate('/buyer/orders', { state: { orderSuccess: true } });
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err.response?.data?.message || 'Checkout failed. Please ensure your cart is not empty.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCartLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
        <p className="text-sm font-medium">Preparing checkout details...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl mx-auto flex items-center justify-center text-indigo-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Your Cart is Empty</h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          You don't have any items in your shopping cart to checkout. Browse our catalog and add items to your cart first.
        </p>
        <Link
          to="/buyer/products"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-2">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
            <span>Secure Order Checkout</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete your order by providing shipping address and selecting your preferred payment method.
          </p>
        </div>
        <Link
          to="/buyer/cart"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shopping Cart</span>
        </Link>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-400 text-sm animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Section: Shipping & Payment (Col 7) */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION 1: Shipping Address */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2.5">
                <Truck className="w-5 h-5 text-indigo-400" />
                <span>1. Shipping Details</span>
              </h2>
              <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-300 font-semibold rounded-full border border-indigo-500/20">
                Step 1 of 2
              </span>
            </div>

            {/* Saved Address Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Select Saved Address</label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => handleSavedAddressChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="NEW">+ Enter New Shipping Address</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.recipientName} - {addr.addressLine1}, {addr.city} ({addr.phone})
                      {addr.isDefault ? ' [Default]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Address Input Form */}
            <div className="space-y-4">
              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Full Recipient Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Ahmed"
                    className={`w-full bg-slate-950 border ${
                      validationErrors.name ? 'border-red-500' : 'border-slate-800'
                    } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500`}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Contact Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className={`w-full bg-slate-950 border ${
                      validationErrors.contactNumber ? 'border-red-500' : 'border-slate-800'
                    } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500`}
                  />
                  {validationErrors.contactNumber && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.contactNumber}</p>
                  )}
                </div>
              </div>

              {/* Street Address Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Street Address (Address Line 1) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. House #12, Block B, Main Boulevard"
                  className={`w-full bg-slate-950 border ${
                    validationErrors.street ? 'border-red-500' : 'border-slate-800'
                  } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500`}
                />
                {validationErrors.street && (
                  <p className="text-xs text-red-400 mt-1">{validationErrors.street}</p>
                )}
              </div>

              {/* Address Line 2 (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Apartment, Suite, Unit (Optional Address Line 2)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="e.g. Apt 402, 4th Floor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className={`w-full bg-slate-950 border ${
                      validationErrors.city ? 'border-red-500' : 'border-slate-800'
                    } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500`}
                  />
                  {validationErrors.city && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Punjab"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Postal Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 54000"
                    className={`w-full bg-slate-950 border ${
                      validationErrors.postalCode ? 'border-red-500' : 'border-slate-800'
                    } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500`}
                  />
                  {validationErrors.postalCode && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.postalCode}</p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pakistan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Payment Options */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2.5">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <span>2. Payment Option</span>
              </h2>
              <span className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-300 font-semibold rounded-full border border-purple-500/20">
                Step 2 of 2
              </span>
            </div>

            {/* Payment Method Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Cash on Delivery */}
              <label
                className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'COD'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-indigo-500"
                />
                <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-slate-400">Pay cash upon item delivery</p>
                </div>
              </label>

              {/* Option 2: JazzCash */}
              <label
                className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'JAZZCASH'
                    ? 'bg-red-600/10 border-red-500 text-white shadow-md shadow-red-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="JAZZCASH"
                  checked={paymentMethod === 'JAZZCASH'}
                  onChange={() => setPaymentMethod('JAZZCASH')}
                  className="accent-red-500"
                />
                <Smartphone className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">JazzCash</p>
                  <p className="text-[11px] text-slate-400">Mobile Wallet Payment</p>
                </div>
              </label>

              {/* Option 3: Easypaisa */}
              <label
                className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'EASYPAISA'
                    ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="EASYPAISA"
                  checked={paymentMethod === 'EASYPAISA'}
                  onChange={() => setPaymentMethod('EASYPAISA')}
                  className="accent-emerald-500"
                />
                <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Easypaisa</p>
                  <p className="text-[11px] text-slate-400">Mobile Wallet Payment</p>
                </div>
              </label>

              {/* Option 4: Debit/Credit Card */}
              <label
                className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'CARD'
                    ? 'bg-purple-600/10 border-purple-500 text-white shadow-md shadow-purple-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="accent-purple-500"
                />
                <CreditCard className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Debit / Credit Card</p>
                  <p className="text-[11px] text-slate-400">Visa, MasterCard, UnionPay</p>
                </div>
              </label>
            </div>

            {/* Dynamic UI depending on selected Payment Method */}
            {paymentMethod === 'COD' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start space-x-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-emerald-200 mb-1">Cash on Delivery Selected</p>
                  <p>
                    No upfront online payment required. Simply pay in cash to the delivery rider when your order arrives.
                  </p>
                </div>
              </div>
            )}

            {(paymentMethod === 'JAZZCASH' || paymentMethod === 'EASYPAISA') && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Easypaisa'} Wallet Details
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Mobile Wallet Account Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    placeholder="03001234567"
                    className={`w-full bg-slate-900 border ${
                      validationErrors.walletPhone ? 'border-red-500' : 'border-slate-800'
                    } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500`}
                  />
                  {validationErrors.walletPhone && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors.walletPhone}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    An OTP request / prompt will be sent to your mobile wallet for approval upon order dispatch.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Card Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Cardholder Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className={`w-full bg-slate-900 border ${
                        validationErrors.cardName ? 'border-red-500' : 'border-slate-800'
                      } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500`}
                    />
                    {validationErrors.cardName && (
                      <p className="text-xs text-red-400 mt-1">{validationErrors.cardName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Card Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className={`w-full bg-slate-900 border ${
                        validationErrors.cardNumber ? 'border-red-500' : 'border-slate-800'
                      } rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-purple-500`}
                    />
                    {validationErrors.cardNumber && (
                      <p className="text-xs text-red-400 mt-1">{validationErrors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Expiry Date (MM/YY) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className={`w-full bg-slate-900 border ${
                          validationErrors.cardExpiry ? 'border-red-500' : 'border-slate-800'
                        } rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500`}
                      />
                      {validationErrors.cardExpiry && (
                        <p className="text-xs text-red-400 mt-1">{validationErrors.cardExpiry}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        CVV Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className={`w-full bg-slate-900 border ${
                          validationErrors.cardCvv ? 'border-red-500' : 'border-slate-800'
                        } rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-purple-500`}
                      />
                      {validationErrors.cardCvv && (
                        <p className="text-xs text-red-400 mt-1">{validationErrors.cardCvv}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Order Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Special delivery instructions, gate codes, preferred time..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Section: Order Summary & Place Order Button (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-indigo-400">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
            </h2>

            {/* Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between space-x-3 text-xs border-b border-slate-800/60 pb-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-slate-500">
                    {item.product?.images && item.product.images[0] ? (
                      <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>Thumb</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{item.product?.name || `Product #${item.productId}`}</p>
                    <p className="text-slate-400 mt-0.5">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="font-bold text-indigo-400 shrink-0">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-2 text-sm text-slate-300 border-t border-slate-800 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Shipping Fee</span>
                <span className="text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Estimated Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-white text-lg border-t border-slate-800 pt-3">
                <span>Total Amount</span>
                <span className="text-indigo-400">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Order Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 text-base cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Place Order (${subtotal.toFixed(2)})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs text-center pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Protected by 256-bit SSL Data Encryption</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
