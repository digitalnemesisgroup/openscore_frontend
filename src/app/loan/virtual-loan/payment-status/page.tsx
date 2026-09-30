'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txId = searchParams.get('tx') || 'VLTX' + Math.floor(100000 + Math.random() * 900000);
  const amount = searchParams.get('amount') || '2000';
  const bizName = searchParams.get('biz') || 'Fiinway Digital Retail Mart';

  const remainingBalance = 21500 - Number(amount);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans max-w-md mx-auto relative shadow-2xl justify-between p-4">
      <div className="space-y-6 text-center my-auto">
        <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
            Payment Approved & Settled
          </span>
          <h1 className="text-3xl font-black text-white mt-2">₹{Number(amount).toLocaleString('en-IN')}</h1>
          <p className="text-xs text-slate-400 mt-1">Paid to {bizName}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-blue-400" /> Virtual Loan Receipt
            </span>
            <span className="text-[10px] font-mono text-slate-500">ID: {txId}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Source:</span>
              <span className="font-bold text-white">Virtual Loan Wallet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient Merchant:</span>
              <span className="font-bold text-white">{bizName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Remaining Loan Balance:</span>
              <span className="font-bold text-emerald-400">₹{remainingBalance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span className="font-bold text-white">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-2 text-left">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-[11px] text-blue-200">
            Deduction reflected instantly in Virtual Loan Ledger. Daily repayment obligation remains ₹1,000/day.
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <button
          onClick={() => router.push('/loan/virtual-loan/dashboard')}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <span>Return to Loan Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function VirtualPaymentStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <PaymentStatusContent />
    </Suspense>
  );
}
