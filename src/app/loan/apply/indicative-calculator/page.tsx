'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import { Sparkles, CheckCircle2, ArrowRight, RefreshCw, Calculator, IndianRupee, Clock } from 'lucide-react';

function IndicativeCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(200000);
  const [selectedTenure, setSelectedTenure] = useState<number>(24);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApp() {
      const { appId, appRecord } = await resolveTargetAppId(urlAppId, 'cash');
      if (!appId || !appRecord) {
        router.push('/loan/apply');
        return;
      }
      setAppData(appRecord);
      setSelectedAmount(Number(appRecord.selected_amount || appRecord.indicative_max_amount || 200000));
      setSelectedTenure(Number(appRecord.selected_tenure || 24));
      if (appRecord.indicative_interest_rate) {
        setCustomRate(Number(appRecord.indicative_interest_rate));
      } else if (appRecord.interest_rate_pa) {
        setCustomRate(parseFloat(appRecord.interest_rate_pa) || 8.5);
      }
      setLoading(false);
    }

    loadApp();
  }, [urlAppId, router]);

  const [customRate, setCustomRate] = useState<number>(8.5);

  // Dynamic EMI Calculation
  const minAmt = appData ? Number(appData.indicative_min_amount || 130000) : 130000;
  const maxAmt = appData ? Number(appData.indicative_max_amount || 200000) : 200000;
  const activeRate = customRate;

  const r = (activeRate / 12) / 100;
  const estimatedEmi = Math.round((selectedAmount * r * Math.pow(1 + r, selectedTenure)) / (Math.pow(1 + r, selectedTenure) - 1));
  const totalRepayment = estimatedEmi * selectedTenure;
  const totalInterest = Math.max(0, totalRepayment - selectedAmount);

  const handleCalculateAndProceed = async () => {
    if (!appData) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await apiRequest(`/loan/apply/${appData.id}/repayment`, {
        method: 'POST',
        body: JSON.stringify({
          selected_amount: selectedAmount,
          selected_tenure: selectedTenure,
          indicative_interest_rate: activeRate,
        }),
      });

      if (res.data) {
        router.push('/loan/apply/documents');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm repayment terms.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileContainer>
        <LoanHeader title="Indicative Calculator" stepNumber={3} backHref="/loan/apply/applicant-details" />
        <div className="p-8 text-center space-y-3 my-auto">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-xs font-bold text-slate-600">Calculating your indicative sanction eligibility...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <LoanHeader title="Sanction Calculator" stepNumber={3} backHref="/loan/apply/applicant-details" />

      <div className="p-4 space-y-4 flex-1 pb-36 overflow-y-auto animate-in fade-in duration-300">
        {/* Approved Indicative Banner */}
        <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden text-center space-y-1">
          <span className="bg-white/20 text-emerald-100 text-[10px] font-extrabold px-3 py-0.5 rounded-full inline-block border border-white/30">
            🎉 PRE-APPROVED ELIGIBILITY
          </span>
          <h2 className="text-2xl font-black">₹{maxAmt.toLocaleString('en-IN')}</h2>
          <p className="text-xs text-emerald-100 font-medium">
            Indicative Range: ₹{minAmt.toLocaleString('en-IN')} to ₹{maxAmt.toLocaleString('en-IN')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Loan Amount Range Slider */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">Required Loan Amount</span>
            <span className="text-sm font-black text-purple-700">₹{selectedAmount.toLocaleString('en-IN')}</span>
          </div>

          <input
            type="range"
            min={minAmt}
            max={maxAmt}
            step={5000}
            value={selectedAmount}
            onChange={(e) => setSelectedAmount(Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>₹{minAmt.toLocaleString('en-IN')}</span>
            <span>₹{maxAmt.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Interactive Interest Rate Slider (8.0% to 14.0% p.a.) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">Interest Rate Range (8% – 14% p.a.)</span>
            <span className="text-sm font-black text-emerald-600">{customRate.toFixed(1)}% p.a.</span>
          </div>

          <input
            type="range"
            min={8.0}
            max={14.0}
            step={0.1}
            value={customRate}
            onChange={(e) => setCustomRate(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />

          {/* Rate Preset Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[8.0, 8.5, 9.9, 11.5, 12.9, 14.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setCustomRate(rate)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors shrink-0 ${
                  customRate === rate
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {/* Tenure Selection Cards */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <span className="text-xs font-bold text-slate-700 block">Select Tenure (Months)</span>
          <div className="grid grid-cols-3 gap-2">
            {[12, 18, 24, 36, 48, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedTenure(m)}
                className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all ${
                  selectedTenure === m
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>
        </div>

        {/* EMI & Interest Breakdown Card */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">Estimated Monthly EMI:</span>
            <span className="text-xl font-black text-amber-400">₹{estimatedEmi.toLocaleString('en-IN')} / mo</span>
          </div>

          <div className="border-t border-slate-800 pt-2.5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Principal Amount:</span>
              <span className="text-white font-bold">₹{selectedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Interest Charged ({customRate.toFixed(1)}% p.a.):</span>
              <span className="text-amber-300 font-bold">₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80 font-bold">
              <span>Total Payable Amount:</span>
              <span className="text-emerald-400 font-black">₹{totalRepayment.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCalculateAndProceed}
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-[0.99]"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Locking Terms...</span>
            </>
          ) : (
            <>
              <span>Confirm Repayment Terms →</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </MobileContainer>
  );
}

export default function IndicativeCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Calculating Sanction Limit...</div>}>
      <IndicativeCalculatorContent />
    </Suspense>
  );
}
