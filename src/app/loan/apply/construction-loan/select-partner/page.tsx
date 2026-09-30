'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, Building2, ExternalLink, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

function ConstructionSelectPartnerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('hdfc_home');
  const [error, setError] = useState('');

  const partners = [
    { id: 'hdfc_home', name: 'HDFC Home Loans', maxLimit: '₹50,00,000', features: 'Special Construction Disbursement' },
    { id: 'icici_home', name: 'ICICI Home Finance', maxLimit: '₹40,00,000', features: 'Plot & House Construction' },
    { id: 'axis_home', name: 'Axis Bank Housing Finance', maxLimit: '₹50,00,000', features: 'Stage-wise Construction Disbursal' },
    { id: 'pnb_housing', name: 'PNB Housing Finance', maxLimit: '₹35,00,000', features: 'Nominal Property Verification' },
  ];

  const handleSelectPartner = async () => {
    if (!appId) return;
    setSubmitting(true);
    try {
      const res = await apiRequest(`/loan/apply/${appId}/partner`, {
        method: 'POST',
        body: JSON.stringify({
          selected_partner_id: selectedPartner,
          selected_partner_name: partners.find((p) => p.id === selectedPartner)?.name || 'HDFC Home Loans',
        }),
      });

      if (res.status === 'success') {
        router.push(`/loan/apply/construction-loan/proof-submission?id=${appId}`);
      } else {
        setError(res.message || 'Failed to select partner.');
      }
    } catch (err: any) {
      setError(err.message || 'Error locking partner.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
        <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Select Housing Finance Lending Partner</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {error}
        </div>
      )}

      <div className="space-y-2.5">
        {partners.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPartner(p.id)}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPartner === p.id
                ? 'bg-emerald-50/90 border-emerald-600 shadow-md ring-2 ring-emerald-400/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{p.features}</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600">{p.maxLimit}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSelectPartner}
        disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
      >
        {submitting ? 'Locking Housing Partner...' : 'Select Housing Partner & Proceed to Proof →'}
      </button>
    </div>
  );
}

export default function ConstructionSelectPartnerPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Select Housing Partner" stepNumber={6} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading partners...</div>}>
          <ConstructionSelectPartnerForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}

