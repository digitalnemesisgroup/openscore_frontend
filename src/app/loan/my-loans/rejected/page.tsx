'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { XCircle, ArrowRight } from 'lucide-react';

function LoanRejectedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id') || '3';

  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    apiRequest(`/loan/applications/${appId}`)
      .then((res) => {
        if (res.data) setAppData(res.data);
      })
      .catch(() => {});
  }, [appId]);

  const defaultData = {
    application_number: 'OSL202509120045',
    selected_partner_name: 'Axis Bank',
    loan_type: 'good_cibil',
    selected_amount: 300000,
  };

  const app = appData || defaultData;

  const formattedAmount = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <MobileContainer>
      <LoanHeader title="Application Status" backHref="/loan/my-loans" />

      <div className="p-4 space-y-4 pb-36 flex-1 overflow-y-auto animate-in fade-in duration-300 text-center">
        {/* Red Alert Banner */}
        <div className="pt-2 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <XCircle className="w-10 h-10" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">Application Declined</h2>
          <p className="text-xs font-bold text-rose-600 mt-0.5">Lender Eligibility Unmatched</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            This lender declined the application based on initial credit criteria. However, you can re-apply for Low CIBIL or Without CIBIL loan options tailored for your profile.
          </p>
        </div>

        {/* Rejection Details Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 font-black flex items-center justify-center text-xs">
                {app.selected_partner_name ? app.selected_partner_name.charAt(0) : 'A'}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  {app.selected_partner_name || 'Lender Partner'}
                </h3>
                <p className="text-[10px] text-slate-500">Personal Loan</p>
              </div>
            </div>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Declined
            </span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Application No.</span>
              <span className="font-mono font-bold text-slate-900">{app.application_number}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Requested Amount</span>
              <span className="font-bold text-slate-900">{formattedAmount(app.selected_amount || 300000)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Status</span>
              <span className="font-bold text-rose-600">Declined by Lender</span>
            </div>
          </div>
        </div>

        {/* Re-apply Action Button */}
        <button
          onClick={() => router.push('/loan/apply/cash-loan')}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-[0.99]"
        >
          <span>Try Low CIBIL / Without CIBIL Loans →</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </MobileContainer>
  );
}

export default function LoanRejectedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">Loading details...</div>}>
      <LoanRejectedContent />
    </Suspense>
  );
}

