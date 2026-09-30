'use client';

import React from 'react';
import { Phone, X, MessageSquare, ExternalLink } from 'lucide-react';

interface PhoneSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhoneSupportModal({ isOpen, onClose }: PhoneSupportModalProps) {
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Instant Customer Support</h3>
            <p className="text-xs text-slate-500">Choose how you'd like to connect with us</p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <a
            href="https://wa.me/919876543210?text=Hello%20OpenScore%20Support%2C%20I%20need%20help%20with%20my%20loan%20application"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 fill-white" /> WhatsApp Live Support
            </span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href="tel:+919876543210"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 fill-white" /> Direct Helpline (+91 98765 43210)
            </span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

