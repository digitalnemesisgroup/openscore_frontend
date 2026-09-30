'use client';

import React from 'react';
import { Gift, X } from 'lucide-react';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RewardsModal({ isOpen, onClose }: RewardsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" /> OpenScore Rewards & Cashback
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-4 rounded-2xl text-center space-y-1 shadow-md">
          <span className="text-[10px] uppercase font-bold text-pink-100 tracking-wider">Total Reward Coins</span>
          <h4 className="text-2xl font-black">1,250 COINS</h4>
          <p className="text-[10px] text-pink-100 font-semibold">Equivalent to ₹125 Cashback</p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between">
            <div>
              <h5 className="font-bold text-slate-900">Scratch Card #1</h5>
              <p className="text-[10px] text-slate-500">Unlocked on application submission</p>
            </div>
            <button
              onClick={() => alert('Scratch Card Claimed: You won ₹50 Cashback!')}
              className="px-3 py-1.5 bg-pink-600 text-white rounded-xl font-bold text-[10px] shadow-sm"
            >
              Scratch Now
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          Close Rewards
        </button>
      </div>
    </div>
  );
}

