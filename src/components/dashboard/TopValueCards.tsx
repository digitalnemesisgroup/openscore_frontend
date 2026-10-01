'use client';

import React from 'react';
import { Info, Plus, Shield, Star, Lock } from 'lucide-react';

interface TopValueCardsProps {
  onOpenEliteValue: () => void;
  onOpenVaultCard: () => void;
  eliteValue?: number;
  vaultValue?: number;
}

export default function TopValueCards({
  onOpenEliteValue,
  onOpenVaultCard,
  eliteValue = 0,
  vaultValue = 0,
}: TopValueCardsProps) {
  const displayElite = Number(eliteValue) || 0;
  const displayVault = Number(vaultValue) || 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Card 1: ELITE VALUE */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 text-white rounded-2xl p-3.5 relative shadow-md overflow-hidden flex flex-col justify-between min-h-[140px]">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-200 flex items-center gap-1">
              ELITE VALUE <Info className="w-3 h-3 text-purple-300 cursor-pointer" onClick={onOpenEliteValue} />
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight my-1">
            ₹{displayElite.toLocaleString('en-IN')}
          </h2>
          <p className="text-[9px] font-bold tracking-widest text-purple-200 uppercase">
            TOTAL VALUE
          </p>
        </div>

        <div>
          <button
            onClick={onOpenEliteValue}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white text-[10px] font-bold rounded-full transition-all active:scale-95"
          >
            <Plus className="w-3 h-3" /> VALUE
          </button>
        </div>

        <div className="absolute right-1 bottom-1 w-16 h-16 pointer-events-none opacity-90">
          <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xs border border-white/20">
            <Shield className="w-10 h-10 text-purple-200 fill-purple-300/30" />
            <Star className="w-5 h-5 text-amber-300 fill-amber-300 absolute" />
          </div>
        </div>
      </div>

      {/* Card 2: VAULT CARD */}
      <div
        onClick={onOpenVaultCard}
        className="bg-white border border-slate-200 text-slate-900 rounded-2xl p-3.5 relative shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-purple-300 transition-colors"
      >
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-800">
            <span className="w-2 h-2 rounded-sm bg-purple-600 inline-block" />
            VAULT CARD
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            DIGITAL ASSET
          </p>
        </div>

        <div className="my-1">
          <p className="text-[9px] font-semibold text-slate-400 uppercase">ASSET VALUE</p>
          <p className="text-xl font-black text-slate-900">
            ₹{displayVault.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="absolute right-2 bottom-2 w-14 h-14 pointer-events-none">
          <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 border-2 border-slate-700 shadow-md">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}


