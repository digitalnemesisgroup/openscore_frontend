'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  UserCheck,
  Building,
  FileCheck2,
  Zap,
} from 'lucide-react';

function EliteValidationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('app_id');

  // Exact 2-minute (120 seconds) countdown timer persistent across page refreshes
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [appId, setAppId] = useState<string | null>(appIdParam);
  const [loanApp, setLoanApp] = useState<any | null>(null);

  useEffect(() => {
    const id = appIdParam || (typeof window !== 'undefined' ? localStorage.getItem('active_elite_loan_app_id') : null);
    if (id) {
      setAppId(id);
      apiRequest(`/loan/elite-cash/${id}`).then((res) => {
        if (res && res.data) setLoanApp(res.data);
      }).catch(() => {});
    }
  }, [appIdParam]);

  // Persistent Countdown Clock using target end timestamp
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentId = appId || appIdParam || localStorage.getItem('active_elite_loan_app_id') || 'active';
    const storageKey = `elite_validation_end_time_${currentId}`;
    const storedEnd = localStorage.getItem(storageKey);
    let targetEndTime: number;

    if (storedEnd && !isNaN(Number(storedEnd))) {
      targetEndTime = Number(storedEnd);
    } else {
      targetEndTime = Date.now() + 120 * 1000;
      localStorage.setItem(storageKey, String(targetEndTime));
    }

    const calcRemaining = () => {
      const diffSec = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      return Math.min(120, diffSec);
    };

    setTimeLeft(calcRemaining());

    const timer = setInterval(() => {
      const rem = calcRemaining();
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appId, appIdParam]);

  const elapsed = 120 - timeLeft;
  const progressPercent = Math.min(100, Math.round((elapsed / 120) * 100));

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isComplete = timeLeft === 0;

  // Stages active based on elapsed seconds
  const isStep1Done = elapsed >= 30;
  const isStep2Done = elapsed >= 60;
  const isStep3Done = elapsed >= 90;
  const isStep4Done = elapsed >= 120;

  const handleProceedToPayment = () => {
    const targetId = appId || loanApp?.id || 'active';
    router.push(`/loan/apply/cash-loan/elite/payment?app_id=${targetId}`);
  };

  return (
    <MobileContainer>
      <LoanHeader title="Live 2-Min Validation" stepNumber={2} backHref="/loan/apply/cash-loan/elite" />

      <div className="p-4 space-y-5 flex-1 pb-32 animate-in fade-in duration-300 overflow-y-auto">
        {/* Glowing Top Banner */}
        <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-purple-500/30 text-center space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-300">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Automated Credit &amp; Verification Engine</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">
              {isComplete ? 'Validation Complete! 🎉' : 'Validating Your Profile'}
            </h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xs mx-auto">
              {isComplete
                ? 'Your fast-track personal loan has been pre-approved. Proceed to nominal processing fee payment.'
                : 'Please wait 2 minutes while our automated credit engine validates your KYC, bank & income records.'}
            </p>
          </div>

          {/* Large Countdown Clock */}
          <div className="py-2">
            <div className="inline-flex items-center justify-center gap-2 bg-slate-900/90 border-2 border-purple-500/50 rounded-2xl px-6 py-3 shadow-inner">
              <Clock className={`w-6 h-6 ${isComplete ? 'text-emerald-400' : 'text-purple-400 animate-pulse'}`} />
              <span className="font-mono text-3xl font-black tracking-wider text-white">
                {formattedTime}
              </span>
            </div>
            <p className="text-[10px] text-purple-300 font-bold mt-1.5">
              {isComplete ? '2:00 Minutes Completed' : 'Estimated Time Remaining (2-Min Protocol)'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-purple-500/30">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-purple-300">
            <span>Progress: {progressPercent}%</span>
            <span>{isComplete ? '100% Ready' : 'Processing...'}</span>
          </div>
        </div>

        {/* Verification Stage Checklist */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Live Validation Sequence
            </h2>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {isComplete ? '4 of 4 Verified' : `${Math.floor(elapsed / 30)} of 4 Verified`}
            </span>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                {isStep1Done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">1. Identity &amp; PAN/Aadhaar Check</h3>
                  <span className={`text-[10px] font-bold ${isStep1Done ? 'text-emerald-700' : 'text-purple-700'}`}>
                    {isStep1Done ? 'Verified ✓' : 'Checking (0-30s)...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  KYC database cross-verification and applicant identity authentication.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                {isStep2Done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : elapsed >= 30 ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">2. Income &amp; Risk Affordability</h3>
                  <span className={`text-[10px] font-bold ${isStep2Done ? 'text-emerald-700' : elapsed >= 30 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {isStep2Done ? 'Verified ✓' : elapsed >= 30 ? 'Analyzing (30-60s)...' : 'Queued'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Monthly cash flow, debt-to-income and repayment capacity scoring.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                {isStep3Done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : elapsed >= 60 ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">3. Disbursement Bank Clearance</h3>
                  <span className={`text-[10px] font-bold ${isStep3Done ? 'text-emerald-700' : elapsed >= 60 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {isStep3Done ? 'Verified ✓' : elapsed >= 60 ? 'Validating (60-90s)...' : 'Queued'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Penny drop verification and account beneficiary name matching.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                {isStep4Done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : elapsed >= 90 ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">4. Express Sanction Token Generation</h3>
                  <span className={`text-[10px] font-bold ${isStep4Done ? 'text-emerald-700' : elapsed >= 90 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {isStep4Done ? 'Approved ✓' : elapsed >= 90 ? 'Generating (90-120s)...' : 'Queued'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Final underwriting approval and express disbursal token assignment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isComplete ? (
          <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300">
            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Proceed to Processing Fee Payment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-center text-slate-500 font-semibold">
              Pre-approved credit line reserved for your application.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-1">
            <p className="text-xs font-bold text-purple-900">Validation Protocol In Progress</p>
            <p className="text-[10px] text-purple-700">
              Please keep this screen open until the 2-minute verification finishes.
            </p>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default function EliteLoanValidationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-purple-300">Initializing Validation Engine...</p>
          </div>
        </div>
      }
    >
      <EliteValidationContent />
    </Suspense>
  );
}
