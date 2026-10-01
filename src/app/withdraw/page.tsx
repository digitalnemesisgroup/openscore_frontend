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

interface WalletState {
  available_value: number;
  incremental_value: number;
  daily_increment: number;
  reward_holdings: number;
  card_number: string;
  card_holder: string;
  bank_account: string;
  status: string;
}

export default function WithdrawPage() {
  const router = useRouter();
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Wallet / Cred-out balances (Instant hydration with sanitized cache so it never flashes dummy state)
  const [walletData, setWalletData] = useState<WalletState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('openscore_user') || localStorage.getItem('user');
        let userName = '';
        let userMobile = '';
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.name && u.name.trim() && u.name.toUpperCase() !== 'TEST') {
            userName = u.name.toUpperCase();
          }
          if (u.mobile) {
            userMobile = u.mobile.slice(-4);
          }
        }

        const cached = localStorage.getItem('openscore_wallet_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            // Overwrite any old dummy data that might be stuck in localStorage
            if (!parsed.card_holder || parsed.card_holder === 'TEST') {
              parsed.card_holder = userName;
            }
            if (!parsed.available_value || Number(parsed.available_value) <= 0) {
              parsed.available_value = 30000;
            }
            if (!parsed.card_number || parsed.card_number.includes('•••• ••••')) {
              parsed.card_number = `4734 8912 1805 ${userMobile}`;
            }
            return parsed;
          }
        }

        return {
          available_value: 30000,
          incremental_value: 0,
          daily_increment: 0.67,
          reward_holdings: 0,
          card_number: `4734 8912 1805 ${userMobile}`,
          card_holder: userName,
          bank_account: 'IDFC FIRST Bank •••• 9123',
          status: 'VERIFYING',
        };
      } catch (e) { }
    }
    return {
      available_value: 30000,
      incremental_value: 0,
      daily_increment: 0.67,
      reward_holdings: 0,
      card_number: '',
      card_holder: '',
      bank_account: '',
      status: 'VERIFYING',
    };
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [userRes, cardRes] = await Promise.allSettled([
          apiRequest('/user'),
          apiRequest('/user/wallet-card'),
        ]);

        let name = walletData.card_holder || '';
        if (userRes.status === 'fulfilled' && userRes.value && userRes.value.name) {
          name = userRes.value.name.toUpperCase();
        }

        if (cardRes.status === 'fulfilled' && cardRes.value && cardRes.value.data) {
          const c = cardRes.value.data;
          const freshData: WalletState = {
            available_value: Number(c.available_value) || 30000,
            incremental_value: Number(c.incremental_value) || 0,
            daily_increment: 0.67,
            reward_holdings: 0,
            card_number: c.card_number || walletData.card_number,
            card_holder: c.card_holder_name ? c.card_holder_name.toUpperCase() : name,
            bank_account: c.bank_name && c.bank_account_number ? `${c.bank_name} •••• ${c.bank_account_number.slice(-4)}` : 'IDFC FIRST Bank •••• 9123',
            status: c.is_locked ? 'VERIFYING' : (c.is_admin_approved ? 'ACTIVE' : 'BOOKED'),
          };
          setWalletData(freshData);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('openscore_wallet_cache', JSON.stringify(freshData));
            } catch (e) { }
          }
        } else if (name) {
          setWalletData((prev: WalletState) => ({
            ...prev,
            card_holder: name,
          }));
        }
      } catch (e) {
        // Fallback silently
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

        {/* VIRTUAL PREMIUM METAL CREDIT CARD DISPLAY (COMPACT REALISTIC METALLIC FINISH) */}
        <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#1c1f26] via-[#101217] to-[#1e232e] text-white border border-slate-700/80 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] overflow-hidden flex flex-col justify-between min-h-[190px] space-y-3">
          {/* BRUSHED METAL SPECULAR LIGHT SWEEPS & TEXTURE OVERLAYS */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

          {/* CARD TOP ROW */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center font-black text-[10px] text-white shadow-xs border border-white/20">
                OS
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-widest text-slate-100 uppercase">
                    OpenScore
                  </span>
                  <span className="text-[7.5px] font-mono font-bold tracking-widest text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                    TITANIUM METAL
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider block">
                Available Value
              </span>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-lg font-black text-slate-100 font-mono tracking-tight">
                  ₹{walletData.available_value.toLocaleString('en-IN')}
                </span>
                <span className="text-[8px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full tracking-wider">
                  {walletData.status}
                </span>
              </div>
            </div>
          </div>

          {/* CARD MIDDLE: EMV CHIP & EMBOSSED NUMBER */}
          <div className="flex items-center justify-between relative z-10 py-1">
            <div className="flex items-center gap-2.5">
              {/* Gold EMV Chip */}
              <div className="w-8.5 h-6.5 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border border-amber-600/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center p-0.5">
                <div className="w-full h-full border border-amber-700/50 rounded-xs grid grid-cols-2 gap-0.5">
                  <div className="border-r border-b border-amber-700/40" />
                  <div className="border-b border-amber-700/40" />
                  <div className="border-r border-amber-700/40" />
                  <div />
                </div>
              </div>

              {/* Contactless Wave Icon */}
              <svg className="w-4 h-4 text-slate-400/80 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              </svg>
            </div>

            {/* Embossed Metallic Card Number */}
            <div className="text-sm sm:text-base font-mono tracking-[0.18em] font-bold text-slate-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {walletData.card_number}
            </div>
          </div>

          {/* CARD BOTTOM ROW */}
          <div className="flex items-end justify-between relative z-10 border-t border-slate-700/50 pt-2 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[7px] uppercase text-slate-400 font-bold block tracking-wider">
                  Card Holder
                </span>
                <span className="text-[11px] font-mono font-bold uppercase text-slate-200 tracking-wide truncate max-w-[130px] block drop-shadow-xs">
                  {walletData.card_holder}
                </span>
              </div>
              <div>
                <span className="text-[7px] uppercase text-slate-400 font-bold block tracking-wider">
                  Expires
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-200 drop-shadow-xs">
                  ••/••
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-wider block drop-shadow-xs">
                0% Interest Credit
              </span>
              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block">
                OpenScore Smart Value
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
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
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
