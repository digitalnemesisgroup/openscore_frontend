'use client';

import React from 'react';
import { Scan, Send, ArrowLeftRight, QrCode, Gift } from 'lucide-react';

interface QuickActionsRowProps {
  onScanQr: () => void;
  onPayId: () => void;
  onSendMoney: () => void;
  onShowQr: () => void;
  onRewards: () => void;
}

export default function QuickActionsRow({
  onScanQr,
  onPayId,
  onSendMoney,
  onShowQr,
  onRewards,
}: QuickActionsRowProps) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center text-center">
      {/* 1. Scan QR */}
      <button onClick={onScanQr} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
          <Scan className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800">Scan QR</span>
      </button>

      {/* 2. Pay ID */}
      <button onClick={onPayId} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
          <Send className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800">Pay ID</span>
      </button>

      {/* 3. Send Money */}
      <button onClick={onSendMoney} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800">Send Money</span>
      </button>

      {/* 4. Show QR */}
      <button onClick={onShowQr} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
          <QrCode className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800">Show QR</span>
      </button>

      {/* 5. Rewards */}
      <button onClick={onRewards} className="flex flex-col items-center gap-1 group">
        <div className="w-11 h-11 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-transform">
          <Gift className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-slate-800">Rewards</span>
      </button>
    </div>
  );
}

