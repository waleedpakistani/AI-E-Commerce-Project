import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Layouts
import RootLayout from '../layouts/RootLayout';
import BuyerLayout from '../layouts/BuyerLayout';
import SellerLayout from '../layouts/SellerLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Common Pages
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

// Buyer Pages
import BuyerHome from '../pages/buyer/BuyerHome';
import ProductCatalog from '../pages/buyer/ProductCatalog';
import ProductDetails from '../pages/buyer/ProductDetails';
import Cart from '../pages/buyer/Cart';
import Wishlist from '../pages/buyer/Wishlist';
import Checkout from '../pages/buyer/Checkout';
import BuyerOrders from '../pages/buyer/BuyerOrders';
import BuyerProfile from '../pages/buyer/BuyerProfile';

// Seller Pages
import SellerDashboard from '../pages/seller/SellerDashboard';
import SellerProducts from '../pages/seller/SellerProducts';
import SellerCategories from '../pages/seller/SellerCategories';
import SellerOrders from '../pages/seller/SellerOrders';
import SellerCustomers from '../pages/seller/SellerCustomers';
import SellerInventory from '../pages/seller/SellerInventory';
import SellerStoreSettings from '../pages/seller/SellerStoreSettings';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Main Root Layout */}
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Protected Buyer Portal Routes */}
            <Route element={<ProtectedRoute allowedRoles={['BUYER', 'ADMIN']} />}>
              <Route path="buyer" element={<BuyerLayout />}>
                <Route index element={<BuyerHome />} />
                <Route path="products" element={<ProductCatalog />} />
                <Route path="products/:id" element={<ProductDetails />} />
                <Route path="cart" element={<Cart />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<BuyerOrders />} />
                <Route path="profile" element={<BuyerProfile />} />
              </Route>
            </Route>

            {/* Protected Seller Hub Routes */}
            <Route element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN']} />}>
              <Route path="seller" element={<SellerLayout />}>
                <Route index element={<Navigate to="/seller/dashboard" replace />} />
                <Route path="dashboard" element={<SellerDashboard />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="categories" element={<SellerCategories />} />
                <Route path="inventory" element={<SellerInventory />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="customers" element={<SellerCustomers />} />
                <Route path="settings" element={<SellerStoreSettings />} />
              </Route>
            </Route>

            {/* 404 Catch-All Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
