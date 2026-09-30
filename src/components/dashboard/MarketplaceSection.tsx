'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Smartphone, Watch, Shirt, Home as HomeIcon } from 'lucide-react';

interface MarketplaceSectionProps {
  onSelectProduct: (product: { title: string; discount: string }) => void;
}

export default function MarketplaceSection({ onSelectProduct }: MarketplaceSectionProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-slate-900">MARKETPLACE</h3>
          <span className="bg-amber-100/90 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[9px] font-bold">
            COMING SOON
          </span>
        </div>
        <button
          onClick={() => router.push('/offers')}
          className="text-xs font-bold text-purple-600 flex items-center gap-0.5 hover:underline"
        >
          VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Cards Row */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {/* Mobiles */}
        <div
          onClick={() => onSelectProduct({ title: 'Mobiles & Smartphones', discount: 'Upto 10% Off' })}
          className="bg-white border border-slate-200 rounded-2xl p-2.5 min-w-[110px] text-center shadow-2xs flex flex-col items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center p-1 mb-1">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
          <span className="text-xs font-bold text-slate-900">Mobiles</span>
          <span className="text-[10px] font-bold text-purple-600 mt-0.5">Upto 10% Off</span>
        </div>

        {/* Electronics */}
        <div
          onClick={() => onSelectProduct({ title: 'Electronics & Gadgets', discount: 'Upto 12% Off' })}
          className="bg-white border border-slate-200 rounded-2xl p-2.5 min-w-[110px] text-center shadow-2xs flex flex-col items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center p-1 mb-1">
            <Watch className="w-8 h-8 text-slate-700" />
          </div>
          <span className="text-xs font-bold text-slate-900">Electronics</span>
          <span className="text-[10px] font-bold text-purple-600 mt-0.5">Upto 12% Off</span>
        </div>

        {/* Fashion */}
        <div
          onClick={() => onSelectProduct({ title: 'Fashion & Apparel', discount: 'Upto 15% Off' })}
          className="bg-white border border-slate-200 rounded-2xl p-2.5 min-w-[110px] text-center shadow-2xs flex flex-col items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center p-1 mb-1">
            <Shirt className="w-8 h-8 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-slate-900">Fashion</span>
          <span className="text-[10px] font-bold text-purple-600 mt-0.5">Upto 15% Off</span>
        </div>

        {/* Home & Kitchen */}
        <div
          onClick={() => onSelectProduct({ title: 'Home & Kitchen Appliances', discount: 'Upto 10% Off' })}
          className="bg-white border border-slate-200 rounded-2xl p-2.5 min-w-[110px] text-center shadow-2xs flex flex-col items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center p-1 mb-1">
            <HomeIcon className="w-8 h-8 text-amber-600" />
          </div>
          <span className="text-xs font-bold text-slate-900">Home & Kitchen</span>
          <span className="text-[10px] font-bold text-purple-600 mt-0.5">Upto 10% Off</span>
        </div>
      </div>
    </div>
  );
}

