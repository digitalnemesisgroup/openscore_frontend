'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, X, Copy, Check, Sparkles, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface ShowQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userMobile?: string;
}

export default function ShowQrModal({ isOpen, onClose, userName, userMobile }: ShowQrModalProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrDetails, setQrDetails] = useState<{
    upi_id: string;
    qr_payload: string;
    card_holder_name: string;
    card_number: string;
    account_type: string;
    is_business: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQrData();
    }
  }, [isOpen]);

  const fetchQrData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/wallet-card/qr-code');
      if (res && res.status === 'success') {
        setQrDetails(res.data);
      }
    } catch (e) {
      console.error('Failed to load QR info:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const resolvedUpiId = qrDetails?.upi_id || `${userMobile || '9876543210'}@openscore`;
  const isBusiness = qrDetails?.is_business ?? false;
  const qrPayload = qrDetails?.qr_payload || `openscore://pay?upi_id=${resolvedUpiId}&mobile=${userMobile || '9876543210'}&name=${encodeURIComponent(userName)}`;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 text-center animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pt-1">
          <h3 className="text-base font-black text-slate-900 flex items-center justify-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" /> My OpenScore UPI QR
          </h3>
          <div className="flex items-center justify-center gap-1 mt-1">
            {isBusiness ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Building2 className="w-3 h-3" /> VERIFIED BUSINESS ACCOUNT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                <UserCheck className="w-3 h-3" /> PERSONAL ACCOUNT
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isBusiness
              ? 'Authorized to receive instant payments & transfers'
              : 'Registered for personal wallet & loan services'}
          </p>
        </div>

        {/* Dynamic QR Code container */}
        <div className="w-48 h-48 mx-auto bg-gradient-to-b from-amber-50 to-orange-50 p-3.5 rounded-3xl border-2 border-amber-200 flex flex-col items-center justify-center shadow-inner relative">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(qrPayload)}`}
            alt="OpenScore UPI QR"
            className="w-36 h-36 rounded-xl object-contain bg-white p-1 shadow-sm"
          />
          <div className="flex items-center gap-1 mt-1 text-[10px] font-mono font-black text-slate-700">
            <Sparkles className="w-3 h-3 text-amber-600" /> OPENSCORE SECURE PAY
          </div>
        </div>

        {/* Copy UPI ID Box */}
        <div className="bg-slate-100 p-2.5 rounded-2xl flex items-center justify-between text-xs font-mono font-bold text-slate-800 border border-slate-200">
          <div className="text-left overflow-hidden pr-2">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans block font-semibold">Your Assigned UPI ID</span>
            <span className="truncate block text-purple-700">{resolvedUpiId}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(resolvedUpiId);
              setCopiedUpi(true);
              setTimeout(() => setCopiedUpi(false), 2000);
            }}
            className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-sans font-bold shrink-0 transition-colors flex items-center gap-1 shadow-sm"
          >
            {copiedUpi ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>NPCI & OpenScore Secured Architecture</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
        >
          Close QR View
        </button>
      </div>
    </div>
  );
}
