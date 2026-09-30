'use client';

import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityModal({ isOpen, onClose }: SecurityModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bank Grade Encryption
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
            <h4 className="font-bold text-emerald-900">256-Bit SSL Secured</h4>
            <p className="text-[11px] text-emerald-700">All data transmitted to partner banks is end-to-end encrypted.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          Done
        </button>
      </div>
    </div>
  );
}

