'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { CheckCircle2, CheckCircle } from 'lucide-react';

function LoanApprovedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (appId) {
      apiRequest(`/loan/applications/${appId}`)
        .then((res) => {
          if (res.data) setAppData(res.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [appId]);

  const app = appData;
  const isVirtual = app?.loan_type?.includes('virtual') || (app?.application_number || app?.application_no || '').toString().trim().toUpperCase().startsWith('OSV');

  const formattedAmount = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleProceedToDisbursement = () => {
    if (typeof window !== 'undefined' && appId) {
      localStorage.setItem('active_loan_app_id', appId);
      localStorage.setItem(`openscore_step_${appId}`, '22');
    }
    router.push('/loan/apply/disbursement');
  };

  if (loading) {
    return (
      <MobileContainer>
        <LoanHeader title="Approval Card" backHref="/loan/my-loans" />
        <div className="p-8 text-center text-xs font-bold text-slate-500">Loading application details...</div>
      </MobileContainer>
    );
  }

  if (!app) {
    return (
      <MobileContainer>
        <LoanHeader title="Approval Card" backHref="/loan/my-loans" />
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">No active loan application found for your account.</p>
          <button
            onClick={() => router.push('/loan/apply')}
            className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-purple-700"
          >
            Apply for Loan →
          </button>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <LoanHeader title="Approval Card" backHref="/loan/my-loans" />

      <div className="p-4 space-y-4 pb-36 flex-1 overflow-y-auto animate-in fade-in duration-300 text-center">
        {/* Success Confetti Icon */}
        <div className="pt-2 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">Congratulations!</h2>
          <p className="text-sm font-bold text-emerald-600 mt-0.5">Your Loan Has Been Approved</p>
          <p className="text-xs text-slate-500 mt-1">
            Your application has been successfully approved by the lender.
          </p>
        </div>

        {/* Sanction Card Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 font-black flex items-center justify-center text-xs">
                {isVirtual ? 'O' : (app.selected_partner_name ? app.selected_partner_name.charAt(0) : 'H')}
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">
                  {isVirtual ? 'OpenScore Vault' : (app.selected_partner_name || 'HDFC Bank')}
                </h3>
                <p className="text-[10px] text-slate-500">{isVirtual ? 'Virtual Credit Limit' : 'Personal Loan'}</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> Approved
            </span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Application No.</span>
              <span className="font-mono font-bold text-slate-900">
                {app.application_number}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Approved Amount</span>
              <span className="font-black text-emerald-600 text-sm">
                {formattedAmount(app.approved_amount || app.selected_amount || 200000)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Loan Type</span>
              <span className="font-bold text-slate-800">
                {app.loan_type === 'low_cibil' ? 'Low CIBIL Loan' : 'Good CIBIL Loan'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Tenure</span>
              <span className="font-bold text-slate-900">
                {app.selected_tenure || 24} Months
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Interest Rate (p.a.)</span>
              <span className="font-bold text-slate-900">
                {app.indicative_interest_rate || 8.5}%
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Monthly EMI (Approx.)</span>
              <span className="font-bold text-slate-900">
                {formattedAmount(app.estimated_emi || 9175)}
              </span>
            </div>
          </div>
        </div>

        {/* Green Notice Box */}
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-left flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-snug font-medium">
            You are one step away from getting your loan amount. Please provide your bank details for disbursement.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleProceedToDisbursement}
          className="w-full py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.99]"
        >
          Proceed to Disbursement →
        </button>
      </div>
    </MobileContainer>
  );
}

export default function LoanApprovedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">Loading approval card...</div>}>
      <LoanApprovedContent />
    </Suspense>
  );
}

