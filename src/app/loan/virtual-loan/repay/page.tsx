'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function VirtualRepayPage() {
  const router = useRouter();
  const [repayAmount, setRepayAmount] = useState<string>('1000');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'netbanking' | 'card'>('upi');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const quickChips = [
    { label: "Today's Recovery (₹1,000)", amount: '1000' },
    { label: 'Partial Repay (₹2,000)', amount: '2000' },
    { label: 'Half Balance (₹4,250)', amount: '4250' },
    { label: 'Full Balance (₹8,500)', amount: '8500' },
  ];

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const num = Number(repayAmount);
    if (!num || num <= 0) {
      setErrorMsg('Please enter a valid repayment amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/loan/virtual/repay', {
        method: 'POST',
        body: JSON.stringify({ amount: num }),
      });
      if (res && res.message) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          router.push('/loan/virtual-loan/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Repayment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans max-w-md mx-auto relative shadow-2xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={() => router.push('/loan/virtual-loan/dashboard')}
          className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black tracking-tight">Repay Virtual Loan</h1>
          <p className="text-[10px] text-slate-400 font-semibold">Step 11 of 12 • Daily Repayment</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {successMsg && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg} Redirecting to dashboard...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" /> Today's Scheduled Repayment
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase">
              DUE TODAY
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-white">₹1,000</span>
              <span className="text-[11px] text-slate-400 block">Required Daily Recovery</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Overdue Charge:</span>
              <span className="text-xs font-bold text-emerald-400 block">₹0 (On-Time)</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Select Quick Amount</label>
          <div className="grid grid-cols-2 gap-2">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRepayAmount(chip.amount)}
                className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                  repayAmount === chip.amount
                    ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleRepay} className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Or Enter Custom Repayment Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₹</span>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="1000"
                className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-black text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Payment Method</label>
            <div className="space-y-2">
              {[
                { id: 'upi', title: 'Instant UPI (Google Pay, PhonePe, Paytm)', desc: 'Zero gateway fee' },
                { id: 'netbanking', title: 'Net Banking (All Indian Banks)', desc: 'Instant confirmation' },
                { id: 'card', title: 'Debit Card', desc: 'Visa / Mastercard / RuPay' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === m.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{m.title}</div>
                    <div className="text-[10px] text-slate-500">{m.desc}</div>
                  </div>
                  {paymentMethod === m.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Repayment...</span>
              </>
            ) : (
              <>
                <span>Pay ₹{Number(repayAmount || 0).toLocaleString('en-IN')} Now</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
