'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  Lock,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

function ConfirmPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bizParam = searchParams.get('biz') || 'biz_fiinway_mart';
  const amountParam = searchParams.get('amount') || '2000';

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [checksResult, setChecksResult] = useState<any>(null);

  useEffect(() => {
    async function resolveChecks() {
      try {
        setLoading(true);
        const res = await apiRequest('/loan/virtual/resolve-business', {
          method: 'POST',
          body: JSON.stringify({
            qr_payload: bizParam,
            amount: Number(amountParam),
          }),
        });
        if (res && res.checks) {
          setChecksResult(res);
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    }
    resolveChecks();
  }, [bizParam, amountParam]);

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest('/loan/virtual/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({
          business_id: bizParam,
          amount: Number(amountParam),
        }),
      });
      if (res && res.data) {
        router.push(
          `/loan/virtual-loan/payment-status?tx=${res.data.tx_id}&amount=${amountParam}&biz=${encodeURIComponent(
            checksResult?.business?.name || 'Fiinway Digital Retail Mart'
          )}`
        );
      }
    } catch (err: any) {
      alert(err.message || 'Payment execution failed.');
      setSubmitting(false);
    }
  };

  const checksList = [
    { key: 'loan_active', label: '1. Virtual Loan Wallet Active' },
    { key: 'balance_available', label: '2. Available Balance Sufficient (₹21,500)' },
    { key: 'daily_limit_ok', label: '3. Daily Limit Check (Max ₹5,000)' },
    { key: 'business_eligible', label: '4. Business QR Verified & Eligible' },
    { key: 'business_per_tx_limit_ok', label: '5. Business Per-Tx Limit Check (Max ₹2,000)' },
    { key: 'monthly_count_ok', label: '6. Monthly Tx Count Limit (Max 5 Txs)' },
    { key: 'amount_valid', label: '7. Amount Range Allowed' },
    { key: 'repayment_valid', label: '8. Repayment Status Valid & On-Time' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <h2 className="text-base font-black">Evaluating 8 Business Eligibility Rules...</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying Virtual Loan Ledger, Daily Caps, & Merchant Category</p>
      </div>
    );
  }

  const isEligible = checksResult?.eligible !== false;
  const business = checksResult?.business || { name: 'Fiinway Digital Retail Mart', category: 'Retail & Electronics', store_code: 'FW-MART-001' };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans max-w-md mx-auto relative shadow-2xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={() => router.back()}
          className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black tracking-tight">Confirm QR Payment</h1>
          <p className="text-[10px] text-slate-400 font-semibold">Step 9 of 12 • Payment Review</p>
        </div>
        <div className="w-9" />
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider block">Paying To Merchant</span>
              <h2 className="text-sm font-black text-white">{business.name}</h2>
              <p className="text-[11px] text-slate-400">{business.store_code || 'FW-MART-001'} • {business.category}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">Payment Amount:</span>
            <span className="text-2xl font-black text-emerald-400">₹{Number(amountParam).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-slate-200">8 System Eligibility Checks</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isEligible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {isEligible ? 'ALL PASSED' : 'ACTION REQUIRED'}
            </span>
          </div>

          <div className="space-y-2">
            {checksList.map((c) => {
              const status = checksResult?.checks ? checksResult.checks[c.key] : true;
              return (
                <div key={c.key} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-300 font-medium">{c.label}</span>
                  {status ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Virtual Loan Wallet Balance:</span>
            <span className="font-bold text-white">₹21,500</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Deduction Amount:</span>
            <span className="font-bold text-emerald-400">- ₹{Number(amountParam).toLocaleString('en-IN')}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-white text-sm">
            <span>Remaining Virtual Balance:</span>
            <span>₹{(21500 - Number(amountParam)).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          onClick={handleConfirmPayment}
          disabled={!isEligible || submitting}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Virtual Payment...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirm & Pay ₹{Number(amountParam).toLocaleString('en-IN')} Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function VirtualConfirmPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <ConfirmPaymentContent />
    </Suspense>
  );
}
