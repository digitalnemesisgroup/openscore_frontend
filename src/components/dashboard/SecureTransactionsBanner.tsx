'use client';

import React from 'react';
import { Shield, Zap, Star } from 'lucide-react';

interface SecureTransactionsBannerProps {
  onOpenSecurity: () => void;
}

export default function SecureTransactionsBanner({ onOpenSecurity }: SecureTransactionsBannerProps) {
  return (
    <div
      onClick={onOpenSecurity}
      className="bg-slate-950 text-white rounded-2xl p-3 relative overflow-hidden shadow-md border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
    >
      <div className="relative z-10 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black tracking-wide text-white">Secure Transactions</h3>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold px-2 py-0.2 rounded-full">
            100% Safe & Protected
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-slate-300 font-medium">
          <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-indigo-400" /> End-to-End Security</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-purple-400" /> Instant Verification</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-amber-400" /> Trusted</span>
        </div>
      </div>
      <div className="w-8 h-8 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <Zap className="w-4 h-4 fill-slate-950" />
      </div>
    </div>
  );
}

