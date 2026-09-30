'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import {
  CreditCard,
  Building2,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Wallet,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function WithdrawPage() {
  const router = useRouter();
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Wallet / Cred-out balances (All initial values set to 0 per user requirement)
  const [walletData, setWalletData] = useState({
    available_value: 0,
    incremental_value: 0,
    daily_increment: 0.67,
    reward_holdings: 0,
    card_number: '•••• •••• •••• 4734',
    card_holder: 'TEST',
    bank_account: 'IDFC FIRST Bank •••• 9123',
    status: 'VERIFYING',
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userRes = await apiRequest('/user');
        if (userRes && userRes.name) {
          setWalletData((prev) => ({
            ...prev,
            card_holder: userRes.name.toUpperCase(),
          }));
        }
      } catch (e) {
        // Fallback silently if unauthenticated/offline
      }
    }
    fetchUserData();
  }, []);

  const handleQuickAdd = (amount: number) => {
    const current = parseFloat(transferAmount) || 0;
    setTransferAmount(String(current + amount));
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      setMessage('Please enter a valid transfer amount.');
      return;
    }
    if (amt > walletData.available_value) {
      setMessage('Insufficient available balance for bank settlement withdrawal.');
      return;
    }

    setLoading(true);
    setMessage('');
    setTimeout(() => {
      setLoading(false);
      setMessage('Bank Settlement request initiated successfully! Transfer is processing.');
      setTransferAmount('');
    }, 1500);
  };

  return (
    <MobileContainer>
      <LoanHeader title="Cred-out / Withdraw" showDashboardButton={true} />

      <div className="p-4 space-y-4 flex-1 animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden max-w-full pb-36">
        {/* TOP TITLE SUBHEADER */}
        <div className="flex items-center justify-between bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white uppercase">Cred-out</h2>
              <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">BANK SETTLEMENT</p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            OPEN SCORE SMART VALUE
          </span>
        </div>

        {/* VIRTUAL PREMIUM METAL CREDIT CARD DISPLAY */}
        <div className="relative rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-500/30 shadow-2xl overflow-hidden space-y-5">
          {/* BACKGROUND DECORATIVE GLOW */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/15 rounded-full blur-2xl pointer-events-none"></div>

          {/* CARD TOP ROW */}
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-400/30">
                PREMIUM METAL CARD
              </span>
              <div className="flex items-center gap-1 mt-1 text-slate-300 text-xs font-bold">
                <span className="text-lg">·))</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
                AVAILABLE VALUE
              </span>
              <span className="text-2xl font-black text-white tracking-tight">
                ₹{walletData.available_value.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full tracking-wider block mt-1">
                {walletData.status}
              </span>
            </div>
          </div>

          {/* CARD CHIP AND NUMBER */}
          <div className="space-y-2 relative z-10 pt-2">
            <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-200 to-amber-400 border border-amber-500/50 shadow-inner flex items-center justify-center">
              <div className="w-7 h-5 border border-amber-600/40 rounded-xs grid grid-cols-2 gap-0.5">
                <div className="border-r border-b border-amber-600/40"></div>
                <div className="border-b border-amber-600/40"></div>
                <div className="border-r border-amber-600/40"></div>
                <div></div>
              </div>
            </div>
            <div className="text-base font-mono tracking-widest font-bold text-slate-200">
              {walletData.card_number}
            </div>
          </div>

          {/* CARD BOTTOM ROW */}
          <div className="flex items-end justify-between relative z-10 border-t border-white/10 pt-3">
            <div>
              <span className="text-[8px] uppercase text-slate-400 font-bold block">VALID THRU</span>
              <span className="text-xs font-mono font-bold text-slate-200">••/••</span>
              <span className="text-[8px] uppercase text-slate-400 font-bold block mt-1">CARD HOLDER</span>
              <span className="text-xs font-black uppercase text-purple-200 tracking-wide">
                {walletData.card_holder}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">
                0% INTEREST CREDIT
              </span>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">
                POWERED BY OPEN SCORE
              </span>
            </div>
          </div>
        </div>

        {/* INCREMENTAL VALUE SECTION */}
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">INCREMENTAL VALUE</h3>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 inline-block mt-0.5">
                T30 Plan Active
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +{walletData.daily_increment}
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                DAILY INCREMENT FLAT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">AVAILABLE</span>
              <span className="text-lg font-black text-slate-900">
                ₹{walletData.available_value.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">INCREMENTAL</span>
              <span className="text-lg font-black text-indigo-900">
                ₹{walletData.incremental_value.toFixed(2)}
              </span>
              <span className="text-[8px] font-bold text-indigo-600 block mt-0.5">REWARD HOLDINGS</span>
            </div>
          </div>

          {/* QUICK SHORTCUT BUTTONS */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400">QUICK:</span>
            {[100, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="text-xs font-bold bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* BANK SETTLEMENT FORM */}
        <form onSubmit={handleTransferSubmit} className="bg-white border-2 border-slate-100 rounded-3xl p-4 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-1">
              TRANSFER AMOUNT
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                placeholder="Enter Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-purple-600" />
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  SETTLEMENT BANK ACCOUNT
                </span>
                <span className="text-xs font-bold text-slate-800">{walletData.bank_account}</span>
              </div>
            </div>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>

          {message && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {message.includes('successfully') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>PROCESSING SETTLEMENT...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>LOCKED & SECURED SETTLEMENT</span>
              </>
            )}
          </button>
        </form>
      </div>
    </MobileContainer>
  );
}
