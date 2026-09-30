'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Zap,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function VirtualScanPayPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [businessCode, setBusinessCode] = useState<string>('biz_fiinway_mart');
  const [amount, setAmount] = useState<string>('2000');
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const quickMerchants = [
    { id: 'biz_fiinway_mart', name: 'Fiinway Digital Retail Mart', category: 'Retail & Electronics', code: 'FW-MART-001' },
    { id: 'biz_fiinway_grocery', name: 'Fiinway Wholesale Grocery', category: 'Grocery', code: 'FW-GROC-002' },
    { id: 'biz_fiinway_hardware', name: 'Fiinway Hardware & Tools', category: 'Hardware', code: 'FW-HARD-003' },
  ];

  const handleProceedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const numAmount = Number(amount);
    if (!businessCode.trim()) {
      setError('Please select or enter a valid Fiinway Business Merchant ID.');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (numAmount > 5000) {
      setError('Daily Virtual Loan transaction limit is ₹5,000.');
      return;
    }

    setLoading(true);
    router.push(`/loan/virtual-loan/confirm-payment?biz=${encodeURIComponent(businessCode.trim())}&amount=${numAmount}`);
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
          <h1 className="text-base font-black tracking-tight">Scan Business QR</h1>
          <p className="text-[10px] text-slate-400 font-semibold">Virtual Loan Merchant QR Payments</p>
        </div>
        <button
          onClick={() => setFlashOn(!flashOn)}
          className={`p-2 rounded-xl transition-colors ${flashOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="bg-slate-900 p-1 rounded-2xl flex border border-slate-800">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Camera QR</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Select Merchant</span>
          </button>
        </div>

        {activeTab === 'scan' ? (
          <div className="space-y-4">
            <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-900 rounded-3xl border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
              <div className="absolute inset-4 border-2 border-dashed border-blue-500/50 rounded-2xl animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400 mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold text-slate-300">Align QR within viewfinder</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Fiinway Verified Business QR supported</p>

              {flashOn && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase">
                  Flashlight Active
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Demo Simulated QR Scan:</span>
              <div className="grid grid-cols-1 gap-2">
                {quickMerchants.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setBusinessCode(m.id);
                      setActiveTab('manual');
                    }}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-left flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{m.name}</span>
                      <span className="text-[10px] text-slate-400">{m.code} • {m.category}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProceedPayment} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-300 block">Select Merchant Store</label>
              <div className="space-y-2">
                {quickMerchants.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setBusinessCode(m.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      businessCode === m.id
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.code} • Max ₹2,000/tx</div>
                    </div>
                    {businessCode === m.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Enter Payment Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2000"
                  className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-black text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400">Daily limit: ₹5,000 • Per business limit: ₹2,000</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking Eligibility Rules...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Payment Review</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-[11px] text-emerald-200 font-medium">
            Virtual Loan Wallet is restricted strictly for eligible Fiinway Merchant QR payments. Cash withdrawal is blocked by default.
          </p>
        </div>
      </div>
    </div>
  );
}
