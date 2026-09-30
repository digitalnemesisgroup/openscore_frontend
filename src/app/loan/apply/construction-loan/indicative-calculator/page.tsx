'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, Calculator, CheckCircle2, ArrowRight, RefreshCw, Info, Percent, Sparkles, Building2 } from 'lucide-react';

function ConstructionIndicativeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [selectedTier, setSelectedTier] = useState<'no_cibil' | 'low_cibil' | 'good_cibil'>('low_cibil');
  const [selectedAmount, setSelectedAmount] = useState<number>(500000);
  const [selectedTenure, setSelectedTenure] = useState<number>(36);
  const [error, setError] = useState('');

  // 1. Strict Tier Specifications & Upper Caps
  const getTierSpecs = (tier: 'no_cibil' | 'low_cibil' | 'good_cibil') => {
    if (tier === 'no_cibil') {
      return {
        label: 'Without CIBIL Tier (Red Zone)',
        maxCap: 1000000,
        maxCapText: 'Max Cap ₹10 Lakh',
        minFoir: 0.20,
        maxFoir: 0.30,
        defaultFoir: 0.25,
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        activeBtnColor: 'bg-rose-600 text-white border-rose-600',
      };
    } else if (tier === 'low_cibil') {
      return {
        label: 'Low CIBIL Tier (Orange Zone)',
        maxCap: 4000000,
        maxCapText: 'Max Cap ₹40 Lakh',
        minFoir: 0.25,
        maxFoir: 0.35,
        defaultFoir: 0.30,
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        activeBtnColor: 'bg-orange-600 text-white border-orange-600',
      };
    } else {
      return {
        label: 'High CIBIL Tier (Green Zone)',
        maxCap: 10000000,
        maxCapText: 'Max Cap ₹1 Crore',
        minFoir: 0.30,
        maxFoir: 0.40,
        defaultFoir: 0.35,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        activeBtnColor: 'bg-emerald-600 text-white border-emerald-600',
      };
    }
  };

  const specs = getTierSpecs(selectedTier);
  const monthlyIncome = parseFloat(appData?.monthly_income || '50000');

  // 2. Internal FOIR Calculation for Personalized Range (minEligible to maxEligible)
  const rawMin = Math.round(monthlyIncome * specs.minFoir * selectedTenure);
  const rawMax = Math.round(monthlyIncome * specs.maxFoir * selectedTenure);

  const minEligible = Math.max(50000, Math.min(specs.maxCap, Math.round(rawMin / 10000) * 10000));
  const maxEligible = Math.min(specs.maxCap, Math.max(minEligible + 50000, Math.round(rawMax / 10000) * 10000));

  useEffect(() => {
    async function fetchApp() {
      const queryTier = (searchParams.get('cibil_type') || '').toLowerCase();
      const localTier = (typeof window !== 'undefined' ? (localStorage.getItem('construction_cibil_type') || '') : '').toLowerCase();
      const explicitChoice = queryTier || localTier;

      if (!appId) {
        if (explicitChoice.includes('no_cibil') || explicitChoice.includes('without') || explicitChoice.includes('red')) {
          setSelectedTier('no_cibil');
        } else if (explicitChoice.includes('good') || explicitChoice.includes('high') || explicitChoice.includes('green')) {
          setSelectedTier('good_cibil');
        } else {
          setSelectedTier('low_cibil');
        }
        setLoading(false);
        return;
      }
      try {
        const res = await apiRequest(`/loan/applications/${appId}`);
        if (res.status === 'success' && res.data) {
          const data = res.data;
          setAppData(data);
          
          const rawAppType = (data.cibil_type || data.loan_type || '').toLowerCase();
          const purpose = (data.loan_purpose || '').toLowerCase();

          let detectedTier: 'no_cibil' | 'low_cibil' | 'good_cibil' = 'low_cibil';

          if (explicitChoice.includes('low_cibil') || explicitChoice.includes('orange') || explicitChoice === 'low') {
            detectedTier = 'low_cibil';
          } else if (explicitChoice.includes('no_cibil') || explicitChoice.includes('without') || explicitChoice.includes('red') || explicitChoice === 'none') {
            detectedTier = 'no_cibil';
          } else if (explicitChoice.includes('good') || explicitChoice.includes('high') || explicitChoice.includes('green')) {
            detectedTier = 'good_cibil';
          } else if (rawAppType.includes('low_cibil') || rawAppType.includes('low') || purpose.includes('low_cibil')) {
            detectedTier = 'low_cibil';
          } else if (rawAppType.includes('good') || rawAppType.includes('high') || purpose.includes('good_cibil')) {
            detectedTier = 'good_cibil';
          } else if (rawAppType.includes('no_cibil') || rawAppType.includes('without') || purpose.includes('without')) {
            detectedTier = 'no_cibil';
          } else {
            detectedTier = 'low_cibil';
          }
          
          setSelectedTier(detectedTier);
          if (typeof window !== 'undefined') {
            localStorage.setItem('construction_cibil_type', detectedTier);
          }
          const tierSpecs = getTierSpecs(detectedTier);

          const income = parseFloat(data.monthly_income || '50000');
          const tenure = Number(data.selected_tenure || data.tenure_months || 36);
          setSelectedTenure(tenure);

          const initialMax = Math.min(tierSpecs.maxCap, Math.round(income * tierSpecs.maxFoir * tenure));
          const initialMin = Math.max(50000, Math.min(tierSpecs.maxCap, Math.round(income * tierSpecs.minFoir * tenure)));
          const reqAmount = Number(data.selected_amount || data.approved_amount || data.required_amount || initialMax);

          setSelectedAmount(Math.min(initialMax, Math.max(initialMin, reqAmount)));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load construction application data.');
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [appId, searchParams]);

  // Keep selected amount clamped inside current eligible range
  const safeSelectedAmount = Math.min(maxEligible, Math.max(minEligible, selectedAmount));

  // Dynamic Linked EMI Calculation based on Admin-Configured Interest Rate
  const annualRoi = Number(appData?.indicative_interest_rate || (appData?.interest_rate_pa ? parseFloat(appData.interest_rate_pa) : 8.5));
  const r = annualRoi / 12 / 100;
  const emi = Math.round((safeSelectedAmount * r * Math.pow(1 + r, selectedTenure)) / (Math.pow(1 + r, selectedTenure) - 1));
  const totalRepayment = emi * selectedTenure;
  const totalInterest = Math.max(0, totalRepayment - safeSelectedAmount);

  const handleConfirmTenure = async () => {
    setSubmitting(true);
    setError('');
    try {
      if (appId) {
        await apiRequest(`/loan/apply/${appId}/tenure`, {
          method: 'POST',
          body: JSON.stringify({
            selected_tenure: selectedTenure,
            selected_amount: safeSelectedAmount,
            indicative_interest_rate: annualRoi,
            loan_type: `construction_${selectedTier}`,
            cibil_type: selectedTier,
          }),
        });
      }
      router.push(`/loan/apply/construction-loan/documents${appId ? `?id=${appId}` : ''}`);
    } catch (err: any) {
      setError(err.message || 'Error confirming loan amount and tenure.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Calculating your Construction Loan eligibility...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Construction Loan Eligibility & Sanction</span>
        </div>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${specs.badgeColor}`}>
          Step 3 of 26
        </span>
      </div>

      {/* CIBIL TIER SELECTOR PILLS */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-[11px] font-extrabold">
        <button
          type="button"
          onClick={() => {
            setSelectedTier('no_cibil');
            if (typeof window !== 'undefined') localStorage.setItem('construction_cibil_type', 'no_cibil');
          }}
          className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
            selectedTier === 'no_cibil'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <span>Without CIBIL</span>
          <span className="block text-[9px] font-normal opacity-80">(Max ₹10L)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedTier('low_cibil');
            if (typeof window !== 'undefined') localStorage.setItem('construction_cibil_type', 'low_cibil');
          }}
          className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
            selectedTier === 'low_cibil'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <span>Low CIBIL</span>
          <span className="block text-[9px] font-normal opacity-80">(Max ₹40L)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedTier('good_cibil');
            if (typeof window !== 'undefined') localStorage.setItem('construction_cibil_type', 'good_cibil');
          }}
          className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
            selectedTier === 'good_cibil'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-white/60'
          }`}
        >
          <span>High CIBIL</span>
          <span className="block text-[9px] font-normal opacity-80">(Max ₹1Cr)</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {error}
        </div>
      )}

      {/* ELIGIBILITY OVERVIEW CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-white" /> PRE-APPROVED ELIGIBILITY
          </span>
          <span className="text-[10px] font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
            {specs.label}
          </span>
        </div>

        <div>
          <span className="text-xs text-emerald-200 font-semibold block">You are eligible for Loan Amount</span>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">
            ₹{minEligible.toLocaleString('en-IN')} — ₹{maxEligible.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            Personalized credit allocation based on your profile ({specs.maxCapText})
          </p>
        </div>
      </div>

      {/* SELECT REQUIRED LOAN AMOUNT SLIDER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700">Choose Required Loan Amount</span>
          <span className="text-base font-black text-emerald-700">₹{safeSelectedAmount.toLocaleString('en-IN')}</span>
        </div>

        <input
          type="range"
          min={minEligible}
          max={maxEligible}
          step={maxEligible - minEligible > 500000 ? 25000 : 10000}
          value={safeSelectedAmount}
          onChange={(e) => setSelectedAmount(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />

        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>Min: ₹{minEligible.toLocaleString('en-IN')}</span>
          <span>Max: ₹{maxEligible.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* REPAYMENT & TENURE SELECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
          <Calculator className="w-4 h-4" /> Construction Loan Tenure & EMI
        </h3>

        <div className="grid grid-cols-2 gap-3 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Estimated Monthly EMI</span>
            <p className="text-lg font-black text-emerald-700">₹{emi.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Interest Rate (p.a.)</span>
            <p className="text-lg font-black text-slate-900">{annualRoi}% p.a.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Select Construction Loan Tenure:</label>
          <div className="grid grid-cols-3 gap-2">
            {[12, 24, 36, 60, 120, 180, 240, 300, 360].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedTenure(m)}
                className={`py-2 rounded-xl font-extrabold text-xs transition-all border ${
                  selectedTenure === m
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                }`}
              >
                {m < 12 ? `${m} Mo` : `${m / 12} Yrs (${m}M)`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleConfirmTenure}
        disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-50"
      >
        {submitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Confirming Sanction Amount...</span>
          </>
        ) : (
          <>
            <span>Confirm Sanction Amount & Proceed to Documents</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

export default function ConstructionIndicativeCalculatorPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Calculator" stepNumber={3} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading calculator...</div>}>
          <ConstructionIndicativeForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}
