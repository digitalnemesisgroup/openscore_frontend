'use client';

import React from 'react';
import { Tag, Shield, ArrowLeftRight, Percent } from 'lucide-react';

export default function TrustBadgesRow() {
  return (
    <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-center">
      <div>
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
          <Tag className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-slate-800">Top Brands</p>
      </div>
      <div>
        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-1">
          <Shield className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-slate-800">Secure Shopping</p>
        <p className="text-[8px] text-slate-400">100% Safe</p>
      </div>
      <div>
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
          <ArrowLeftRight className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-slate-800">Easy Returns</p>
        <p className="text-[8px] text-slate-400">Hassle Free</p>
      </div>
      <div>
        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1">
          <Percent className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-slate-800">Extra Cashback</p>
        <p className="text-[8px] text-slate-400">On Every Order</p>
      </div>
    </div>
  );
}

