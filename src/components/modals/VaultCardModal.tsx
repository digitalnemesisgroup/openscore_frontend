'use client';

import React from 'react';
import { CreditCard, X, Lock } from 'lucide-react';

interface VaultCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export default function VaultCardModal({ isOpen, onClose, userName }: VaultCardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-800 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" /> OpenScore Vault Digital Card
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Virtual Card Representation */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 border border-white/20 p-4 rounded-2xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-amber-400">VAULT DIGITAL ASSET</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Card Number</span>
            <p className="font-mono text-sm tracking-widest text-white">4532 •••• •••• 9812</p>
          </div>

          <div className="flex justify-between text-[10px] font-mono">
            <div>
              <span className="text-slate-400 block">CARD HOLDER</span>
              <span className="font-bold text-white uppercase">{userName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">EXPIRES</span>
              <span className="font-bold text-white">12/28</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-purple-600 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          Close Vault Card
        </button>
      </div>
    </div>
  );
}

