import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4">
        <p>© {new Date().getFullYear()} AURA AI E-Commerce Platform. All rights reserved.</p>
        <p className="mt-1 text-xs text-slate-600">Built with React, TypeScript, Vite & Tailwind CSS</p>
      </div>
    </footer>
  );
};

export default Footer;
