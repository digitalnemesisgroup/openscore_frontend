'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { CheckCircle2, ArrowRight, RefreshCw, Sparkles, Building2, ShieldCheck, IndianRupee } from 'lucide-react';

export default function StatusPage() {
  const router = useRouter();
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAppId = typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null;
    if (!savedAppId) {
      router.push('/loan/apply');
      return;
    }

    apiRequest(`/loan/applications/${savedAppId}`)
      .then((res) => {
        if (res.data) setAppData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const approvedAmount = appData?.approved_amount || appData?.selected_amount || appData?.indicative_max_amount || 200000;

  return (
    <MobileContainer>
      <LoanHeader title="Application Status" stepNumber={18} backHref="/loan/apply/verification" />

      <div className="p-4 space-y-4 flex-1 animate-in fade-in duration-300">
        <div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Step 18 of 26
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Application Decision</h1>
          <p className="text-xs text-slate-500 font-medium">Final approval terms confirmed by HDFC Bank</p>
        </div>

        {/* Sanction Banner */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white p-5 rounded-3xl text-center space-y-2 shadow-lg relative overflow-hidden">
          <span className="bg-white/20 text-emerald-100 text-[10px] font-extrabold px-3 py-0.5 rounded-full inline-block border border-white/30">
            🎉 SANCTIONED & APPROVED
          </span>
          <h2 className="text-3xl font-black">₹{Number(approvedAmount).toLocaleString('en-IN')}</h2>
          <p className="text-xs text-emerald-100 font-medium">Ready for Bank Account Disbursement</p>
        </div>

        {/* Approval Summary List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
          <div className="flex justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Lending Bank:</span>
            <span className="font-black text-slate-900">HDFC Bank Personal Loan</span>
          </div>
          <div className="flex justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Application Reference:</span>
            <span className="font-mono font-black text-purple-700">HDPL987654321</span>
          </div>
          <div className="flex justify-between text-xs py-1 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Verification Status:</span>
            <span className="font-extrabold text-emerald-600">PASSED ✓</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-500 font-medium">Disbursement SLA:</span>
            <span className="font-black text-slate-900">Within 4 Hours</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/loan/apply/bank-details')}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-[0.99]"
        >
          <span>Enter Bank Details for Disbursement →</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </MobileContainer>
  );
}

