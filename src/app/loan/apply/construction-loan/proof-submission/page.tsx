'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, Image, CheckCircle2, ArrowRight, RefreshCw, Upload } from 'lucide-react';

function ConstructionProofSubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [proofSubmitted, setProofSubmitted] = useState(true);

  const handleSubmitProof = async () => {
    if (!appId) return;
    setSubmitting(true);
    try {
      const res = await apiRequest(`/loan/apply/${appId}/proof`, {
        method: 'POST',
        body: JSON.stringify({
          proof_submitted: true,
          proof_type: 'construction_site_plan',
        }),
      });

      if (res.status === 'success') {
        router.push(`/loan/apply/construction-loan/bank-details?id=${appId}`);
      } else {
        setError(res.message || 'Proof submission failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
        <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Construction Site Plan & Estimate Proof Submission</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs text-center">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
          <Image className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-900">Construction Site Screenshot Attached</h3>
          <p className="text-xs text-slate-500 mt-0.5">Plot location & architect estimate copy verified</p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Construction Proof Uploaded Successfully</span>
        </div>
      </div>

      <button
        onClick={handleSubmitProof}
        disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
      >
        {submitting ? 'Submitting Proof...' : 'Submit Proof & Enter Disbursal Bank Account →'}
      </button>
    </div>
  );
}

export default function ConstructionProofSubmissionPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Proof Submission" stepNumber={7} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading proof submission...</div>}>
          <ConstructionProofSubmissionForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}

