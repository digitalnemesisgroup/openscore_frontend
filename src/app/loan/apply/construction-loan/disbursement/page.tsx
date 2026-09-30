'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, FileText, CheckCircle2, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';

function ConstructionDisbursementForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [agreementSigned, setAgreementSigned] = useState(false);
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
        setError(err.message || 'Failed to load application data.');
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [appId]);

  const handleClaimDisbursement = async () => {
    if (!agreementSigned) {
      setError('Please accept the Construction Loan Disbursal Agreement to claim funds.');
      return;
    }
    if (!appId) return;

    setSubmitting(true);
    try {
      const res = await apiRequest(`/loan/apply/${appId}/disbursement`, {
        method: 'POST',
        body: JSON.stringify({
          signed_agreement: true,
        }),
      });

      if (res.status === 'success') {
        router.push(`/loan/apply/construction-loan/status?id=${appId}`);
      } else {
        setError(res.message || 'Disbursement request failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error claiming disbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Construction Agreement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
        <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Construction Stage Disbursal & KFS Agreement</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {error}
        </div>
      )}

      {/* Disbursal Amount Box */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
          READY FOR BANK DISBURSAL
        </span>
        <h2 className="text-3xl font-black text-emerald-300">
          ₹{(appData?.selected_amount || appData?.approved_amount || 1500000).toLocaleString('en-IN')}
        </h2>
        <p className="text-xs text-emerald-100 font-medium">
          Stage 1 Disbursal to Bank Account: {appData?.bank_name || 'State Bank of India'} (****{appData?.bank_account_number?.slice(-4) || '1234'})
        </p>
      </div>

      {/* Agreement Checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70">
        <input
          type="checkbox"
          checked={agreementSigned}
          onChange={(e) => {
            setAgreementSigned(e.target.checked);
            if (e.target.checked) setError('');
          }}
          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
        />
        <span className="text-xs text-slate-800 font-bold leading-relaxed">
          I accept the Construction Loan Sanction Terms, Key Fact Statement (KFS) & Stage Disbursal Schedule.
        </span>
      </label>

      <button
        onClick={handleClaimDisbursement}
        disabled={submitting || !agreementSigned}
        className={`w-full py-3.5 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
          agreementSigned
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Processing Bank Disbursal...</span>
          </>
        ) : (
          <>
            <span>Sign & Direct Credit to Bank Account →</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

export default function ConstructionDisbursementPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Disbursement" stepNumber={9} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading disbursement form...</div>}>
          <ConstructionDisbursementForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}

