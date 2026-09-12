import React from 'react';
import { Outlet } from 'react-router-dom';
import SellerSidebar from '../components/seller/SellerSidebar';

export const SellerLayout: React.FC = () => {
  return (
    <div className="flex min-h-full">
      <SellerSidebar />
      <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
        <Outlet />
      </div>
    </div>
  );
};

export default SellerLayout;
