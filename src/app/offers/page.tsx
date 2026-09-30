'use client';

import React from 'react';
import Link from 'next/link';
import MobileContainer from '@/components/MobileContainer';
import { Tag, Sparkles, Rocket, ArrowLeft } from 'lucide-react';

export default function OffersPage() {
  return (
    <MobileContainer>
      {/* Top Header */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-100 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
            OS
          </div>
          <h1 className="text-base font-black text-slate-900">Exclusive Offers</h1>
        </div>
      </div>

      {/* Coming Soon Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-3xl flex items-center justify-center shadow-xl relative border border-amber-300/30">
            <Rocket className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" /> Feature Preview
          </span>
          <h2 className="text-xl font-black text-slate-900 pt-1">Exclusive Offers — Coming Soon!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            We are crafting personalized loan offers, cashbacks, and fee discount rewards tailored to your credit profile. Stay tuned!
          </p>
        </div>

        <Link
          href="/dashboard"
          className="mt-4 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </MobileContainer>
  );
}
