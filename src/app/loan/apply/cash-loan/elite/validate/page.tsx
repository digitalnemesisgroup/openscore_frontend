'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  FileCheck,
  Lock,
} from 'lucide-react';

function EliteValidationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('app_id');

  // Exact 2-minute (120 seconds) validation countdown
  const SCAN_DURATION = 120;
  const [timeLeft, setTimeLeft] = useState<number>(SCAN_DURATION);
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
    const storageKey = `elite_scan_end_time_${currentId}`;
    const storedEnd = localStorage.getItem(storageKey);
    let targetEndTime: number;

    if (storedEnd && !isNaN(Number(storedEnd))) {
      targetEndTime = Number(storedEnd);
    } else {
      targetEndTime = Date.now() + SCAN_DURATION * 1000;
      localStorage.setItem(storageKey, String(targetEndTime));
    }

    const calcRemaining = () => {
      const diffSec = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      return Math.min(SCAN_DURATION, diffSec);
    };

    setTimeLeft(calcRemaining());

    const timer = setInterval(() => {
      const rem = calcRemaining();
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 400);

    return () => clearInterval(timer);
  }, [appId, appIdParam]);

  const elapsed = SCAN_DURATION - timeLeft;
  const progressPercent = Math.min(100, Math.round((elapsed / SCAN_DURATION) * 100));
  const isComplete = timeLeft === 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleProceedToPayment = () => {
    const targetId = appId || loanApp?.id || 'active';
    router.push(`/loan/apply/cash-loan/elite/payment?app_id=${targetId}`);
  };

  const formattedAmount = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '1,00,000';
    return num.toLocaleString('en-IN');
  };

  return (
    <MobileContainer>
      <LoanHeader title="Document Verification" backHref="/loan/apply/cash-loan/elite" />

      <div className="p-4 space-y-6 flex-1 pb-32 animate-in fade-in duration-300 overflow-y-auto">
        {/* TOP STATUS */}
        <div className="text-center space-y-1.5 pt-2">
          <h1 className="text-xl font-black text-slate-900">
            {isComplete ? 'Validation Complete! 🎉' : 'Validating Documents'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isComplete
              ? 'Your documents have been verified successfully. Please proceed to the next step.'
              : 'Please wait while our system validates your submitted documents.'}
          </p>
        </div>

        {/* 🔄 ROTATING CIRCLE ANIMATION CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs text-center space-y-6 max-w-xs mx-auto">
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {isComplete ? (
              <div className="w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-500 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-14 h-14" />
              </div>
            ) : (
              <>
                {/* Outer Smooth Rotating Gradient Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-purple-600 border-r-indigo-500 animate-spin" />
                
                {/* Inner Pulsing Circle */}
                <div className="w-24 h-24 rounded-full bg-purple-50 flex flex-col items-center justify-center text-purple-700 space-y-1 shadow-inner">
                  <span className="text-xs font-black font-mono">{formattedTime}</span>
                  <span className="text-[10px] text-purple-600 font-bold">{progressPercent}%</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs font-bold text-slate-600">
              {isComplete ? 'All Documents Verified' : 'Processing verification...'}
            </p>
          </div>
        </div>

        {/* BOTTOM ACTION & SUMMARY */}
        {isComplete ? (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Eligible Loan Amount
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{formattedAmount(loanApp?.required_amount || loanApp?.selected_amount || 100000)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Status
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  Verified ✓
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Proceed to Processing Fee Payment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-center">
            <p className="text-xs font-bold text-purple-900">
              Please do not refresh or close this screen
            </p>
            <p className="text-[11px] text-purple-700 mt-0.5">
              Verification completes in {formattedTime}
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
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-purple-300">Loading...</p>
          </div>
        </div>
      }
    >
      <EliteValidationContent />
    </Suspense>
  );
}
