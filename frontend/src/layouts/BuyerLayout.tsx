import React from 'react';
import { Outlet } from 'react-router-dom';
import BuyerNavbar from '../components/buyer/BuyerNavbar';

export const BuyerLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-full">
      <BuyerNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default BuyerLayout;
