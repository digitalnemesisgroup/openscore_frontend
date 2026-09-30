'use client';

import React from 'react';
import { Headphones, X, MessageSquare, ExternalLink, Phone, HelpCircle } from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Headphones className="w-4 h-4 text-purple-600" /> Help & Support Hub
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> WhatsApp Chat Support
            </span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href="tel:+919876543210"
            className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-colors"
          >
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Call Customer Support
            </span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-purple-600" /> Frequently Asked Questions
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>Q: How long does disbursement take?</strong><br />
              A: Approval & disbursement are processed instantly once verified by partner banks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

