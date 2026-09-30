'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, X } from 'lucide-react';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: { title: string; discount: string } | null;
}

export default function MarketplaceModal({ isOpen, onClose, product }: MarketplaceModalProps) {
  const router = useRouter();

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 text-center animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7" strokeWidth={2.5} />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full uppercase">
            {product.discount}
          </span>
          <h3 className="text-base font-black text-slate-900 pt-1">{product.title}</h3>
          <p className="text-xs text-slate-500">
            Exclusive marketplace deals with zero EMI financing option coming soon for OpenScore users!
          </p>
        </div>

        <button
          onClick={() => {
            onClose();
            router.push('/offers');
          }}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
        >
          Explore All Offers →
        </button>
      </div>
    </div>
  );
}

