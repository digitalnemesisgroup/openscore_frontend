'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, X } from 'lucide-react';

interface EliteValueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EliteValueModal({ isOpen, onClose }: EliteValueModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" /> Elite Value Benefits
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 text-xs">
          <p className="text-slate-700 leading-relaxed text-[11px]">
            Your Elite Value score increases as you process loan applications and verify KYC documents. Higher Elite Value unlocks priority bank disbursals.
          </p>
        </div>

        <button
          onClick={() => {
            onClose();
            router.push('/loan/apply');
          }}
          className="w-full py-3 bg-purple-600 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          Increase Elite Value Points →
        </button>
      </div>
    </div>
  );
}

