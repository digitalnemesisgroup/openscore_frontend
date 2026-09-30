'use client';

import React from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" /> Notifications & Alerts
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-purple-700 uppercase">Pre-Approved Offer</span>
              <span className="text-[9px] text-slate-400">Just Now</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Up to ₹50 Lakhs Cash Loan Unlocked</h4>
            <p className="text-[11px] text-slate-600">Your profile meets initial pre-approval eligibility. Tap apply to process.</p>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Security Verified</span>
              <span className="text-[9px] text-slate-400">Today</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">Device Session Encrypted</h4>
            <p className="text-[11px] text-slate-600">Your session is secured with 256-bit bank-grade encryption.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          Mark All as Read
        </button>
      </div>
    </div>
  );
}

