'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, CheckCircle2, Clock, ShieldCheck, ArrowRight, RefreshCw, Home, Building2 } from 'lucide-react';

function ConstructionStatusTracker() {
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchApp() {
      if (!appId) return;
      try {
        const res = await apiRequest(`/loan/applications/${appId}`);
        if (res.status === 'success' && res.data) {
          setAppData(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch status.');
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [appId]);

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Checking Construction Loan Status...</p>
      </div>
    );
  }

  const isDisbursed = appData?.status === 'disbursed' || appData?.disbursement_status === 'credited';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900">Construction Loan Tracker</h3>
            <p className="text-[11px] font-mono text-emerald-700 font-bold">
              #{appData?.application_number || `OSL-${appData?.id}`}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
          isDisbursed ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          {isDisbursed ? 'DISBURSED' : 'UNDER REVIEW'}
        </span>
      </div>

      {isDisbursed ? (
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-3 text-center">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-300">Disbursement Successful!</h2>
            <p className="text-xs text-emerald-100 mt-1">
              ₹{(appData?.selected_amount || appData?.approved_amount || 1500000).toLocaleString('en-IN')} credited to bank account.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Admin Technical Verification & Site Plan Audit in Progress.</span>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span>Property Location</span>
              <span className="font-black text-slate-900">{appData?.city || appData?.state || 'Verified Site'}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
              <span>Sanction Limit</span>
              <span className="font-black text-emerald-600">₹{(appData?.selected_amount || 1500000).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/dashboard"
        className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 block text-center"
      >
        <span>Return to Borrower Dashboard →</span>
      </Link>
    </div>
  );
}

export default function ConstructionStatusPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Loan Status" stepNumber={10} backHref="/loan/my-loans" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading status...</div>}>
          <ConstructionStatusTracker />
        </Suspense>
      </div>
    </MobileContainer>
  );
}

