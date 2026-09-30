'use client';

import React from 'react';
import { MapPin, X, CheckCircle2 } from 'lucide-react';

interface LocationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationStatusModal({ isOpen, onClose }: LocationStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Location & Service Status</h3>
            <p className="text-xs text-slate-500">Pan-India Cash Loan Availability</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span>Current Status:</span>
            <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> VERIFIED
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            OpenScore instant loan disbursement services are 100% active across all 19,000+ PIN codes in India.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-md hover:bg-slate-800 transition-colors"
        >
          Close Location Verification
        </button>
      </div>
    </div>
  );
}

