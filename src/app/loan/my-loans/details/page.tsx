'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Copy, FileText, CheckCircle, ShieldCheck } from 'lucide-react';

function LoanDetailsContent() {
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

  if (loading) {
    return (
      <MobileContainer>
        <LoanHeader title="Lender & Application Details" backHref="/loan/my-loans" />
        <div className="p-8 text-center text-xs font-bold text-slate-500">Loading loan details...</div>
      </MobileContainer>
    );
  }

  if (!app) {
    return (
      <MobileContainer>
        <LoanHeader title="Lender & Application Details" backHref="/loan/my-loans" />
        <div className="p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">No loan application details found.</p>
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
      <LoanHeader title="Lender & Application Details" backHref="/loan/my-loans" />

      <div className="p-4 space-y-4 pb-36 flex-1 overflow-y-auto animate-in fade-in duration-300">
        {/* Lender Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 font-black flex items-center justify-center text-xs">
                {isVirtual ? 'O' : (app.selected_partner_name ? app.selected_partner_name.charAt(0) : 'H')}
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {isVirtual ? 'OpenScore Vault' : (app.selected_partner_name || 'HDFC Bank')}
                </h2>
                <p className="text-[11px] text-slate-500">{isVirtual ? 'Virtual Credit Limit' : 'Personal Loan'}</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> In Review
            </span>
          </div>
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            Your application is under verification
          </p>

          {/* Details Grid */}
          <div className="space-y-2 text-xs divide-y divide-slate-100 pt-1">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Application No.</span>
              <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                {app.application_number}
                <Copy className="w-3 h-3 text-slate-400 cursor-pointer" />
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Loan Type</span>
              <span className="font-bold text-slate-900">
                {app.loan_type === 'low_cibil' ? 'Low CIBIL Loan' : 'Good CIBIL Loan'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Requested Amount</span>
              <span className="font-bold text-slate-900">
                {formattedAmount(app.selected_amount || app.required_amount || 200000)}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Applied On</span>
              <span className="font-semibold text-slate-700">
                {app.applied_at || '17 Sep 2025, 11:24 AM'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Current Status</span>
              <span className="font-bold text-blue-700">Under Review</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Next Step</span>
              <span className="font-semibold text-slate-800">Admin/Lender Verification</span>
            </div>
          </div>
        </div>

        {/* Uploaded Lender Proof Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-black text-slate-900">Uploaded Lender Proof</h3>
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">lender_confirmation.png</p>
                <p className="text-[10px] text-slate-400">17 Sep 2025, 11:32 AM</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-white border border-slate-200 text-blue-600 font-bold text-xs rounded-lg shadow-2xs hover:bg-blue-50">
              View
            </button>
          </div>
        </div>

        {/* Stepper Process */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-900">Our Process</h3>
          <div className="space-y-3 relative text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <span className="font-bold text-slate-900">Application Submitted</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Completed</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <span className="font-bold text-slate-900">Lender Process Completed</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Completed</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <span className="font-bold text-slate-900">Proof Submitted</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700">Completed</span>
            </div>
            <div className="flex items-center justify-between bg-blue-50 p-2.5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px]">
                  4
                </div>
                <span className="font-bold text-blue-900">Under Review with {isVirtual ? 'Admin' : 'Bank/Admin'}</span>
              </div>
              <span className="text-[10px] font-bold text-blue-700">In Progress</span>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                  5
                </div>
                <span className="font-semibold text-slate-700">Final Decision</span>
              </div>
              <span className="text-[10px] text-slate-400">Pending</span>
            </div>
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                  6
                </div>
                <span className="font-semibold text-slate-700">Disbursement</span>
              </div>
              <span className="text-[10px] text-slate-400">Pending</span>
            </div>
          </div>
        </div>

        {/* Info Note Banner */}
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug">
            {isVirtual
              ? 'OpenScore is actively verifying your application. Final approval is subject to internal verification and terms.'
              : 'OpenScore is coordinating with the bank/lender to process your application. Final approval is subject to the lender\'s verification and terms.'}
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => router.push(`/loan/my-loans/processing?id=${appId}`)}
            className="py-3 px-3 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md text-center hover:bg-blue-700 transition-colors"
          >
            Track Live Review (20m) →
          </button>
          <button
            onClick={() => router.push(`/loan/my-loans/approved?id=${appId}`)}
            className="py-3 px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md text-center hover:bg-emerald-700 transition-colors"
          >
            View Sanction Card →
          </button>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function LoanDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">Loading details...</div>}>
      <LoanDetailsContent />
    </Suspense>
  );
}

