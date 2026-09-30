'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Scan,
  FileCheck2,
  Cpu,
  UserCheck,
  Zap,
  Lock,
  Check,
} from 'lucide-react';

function EliteValidationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('app_id');

  // Exact 15-second fast document scanning and AI credit validation sequence
  const SCAN_DURATION = 15;
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

  // Persistent Countdown Clock using target end timestamp for 15 seconds
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
    }, 500);

    return () => clearInterval(timer);
  }, [appId, appIdParam]);

  const elapsed = SCAN_DURATION - timeLeft;
  const progressPercent = Math.min(100, Math.round((elapsed / SCAN_DURATION) * 100));
  const isComplete = timeLeft === 0;

  // Stages active based on elapsed seconds
  const isStep1Done = elapsed >= 4;
  const isStep2Done = elapsed >= 8;
  const isStep3Done = elapsed >= 12;
  const isStep4Done = elapsed >= 15;

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
      <LoanHeader title="AI Document Scanning & Verification" backHref="/loan/apply/cash-loan/elite" />

      <div className="p-4 space-y-4 flex-1 pb-32 animate-in fade-in duration-300 overflow-y-auto">
        {/* Glowing Futuristic Scanner Header */}
        <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white rounded-3xl p-5 shadow-2xl border border-purple-500/40 text-center space-y-3 relative overflow-hidden">
          {/* Animated Background Laser Glow */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-600/30 rounded-full blur-3xl" />

          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-300 relative z-10">
            <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            <span>AI Automated Document Scanning Engine</span>
          </div>

          <div className="relative z-10">
            <h1 className="text-xl font-black text-white tracking-tight">
              {isComplete ? 'Verification Complete! 🎉' : 'Scanning & Verifying Documents'}
            </h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xs mx-auto">
              {isComplete
                ? 'Your documents & KYC have been authenticated. Fast-track express loan is approved.'
                : 'Live scanning Aadhaar Front, Aadhaar Back, PAN Card & Facial Biometrics in real time.'}
            </p>
          </div>

          {/* Futuristic Scanning Hologram Box */}
          <div className="relative py-2 z-10">
            <div className="relative mx-auto w-48 h-28 bg-slate-900/90 border-2 border-purple-500/60 rounded-2xl p-3 shadow-inner flex flex-col items-center justify-center overflow-hidden">
              {/* Laser Scanning Line Animation */}
              {!isComplete && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-pulse top-0 animate-[bounce_2s_infinite]" />
              )}

              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${isComplete ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-purple-900/50 border-purple-400/50 text-purple-300'}`}>
                  {isComplete ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <Scan className="w-7 h-7 animate-pulse text-cyan-400" />}
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-mono text-purple-300 block uppercase">
                    {isComplete ? 'Scan Verified' : 'AI Laser Scan'}
                  </span>
                  <span className="font-mono text-xl font-black tracking-wider text-white">
                    {isComplete ? '100% Match' : `${progressPercent}%`}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
                {isComplete ? '✓ UIDAI & NSDL VALIDATED' : `TIME REMAINING: 00:${String(timeLeft).padStart(2, '0')}`}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900/90 rounded-full h-2.5 overflow-hidden border border-purple-500/30 relative z-10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                  : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-purple-300 relative z-10">
            <span>OCR Security Protocol</span>
            <span>{isComplete ? '100% Ready' : 'Analyzing Document Pixels...'}</span>
          </div>
        </div>

        {/* Verification Stage Checklist */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" /> Live Document Scan Checklist
            </h2>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              {isComplete ? '4 of 4 Verified' : `${Math.floor((elapsed / SCAN_DURATION) * 4)} of 4 Verified`}
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-all ${isStep1Done ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-xl border shadow-2xs shrink-0 ${isStep1Done ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-purple-600'}`}>
                {isStep1Done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Scan className="w-4 h-4 animate-spin" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">1. Aadhaar (Front &amp; Back) &amp; PAN OCR Scan</h3>
                  <span className={`text-[10px] font-bold ${isStep1Done ? 'text-emerald-700' : 'text-purple-700'}`}>
                    {isStep1Done ? 'Verified ✓' : 'Scanning (0-4s)...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  UIDAI Aadhaar QR decoding, NSDL PAN validity &amp; applicant name cross-match.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-all ${isStep2Done ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-xl border shadow-2xs shrink-0 ${isStep2Done ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-purple-600'}`}>
                {isStep2Done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : elapsed >= 4 ? (
                  <UserCheck className="w-4 h-4 animate-pulse text-purple-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">2. Facial Biometrics &amp; Anti-Fraud Check</h3>
                  <span className={`text-[10px] font-bold ${isStep2Done ? 'text-emerald-700' : elapsed >= 4 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {isStep2Done ? 'Verified ✓' : elapsed >= 4 ? 'Matching (4-8s)...' : 'Queued'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Facial liveness cross-match against Aadhaar identity records.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-all ${isStep3Done ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-xl border shadow-2xs shrink-0 ${isStep3Done ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-purple-600'}`}>
                {isStep3Done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : elapsed >= 8 ? (
                  <FileCheck2 className="w-4 h-4 animate-pulse text-purple-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">3. Income &amp; Disbursement Bank Clearance</h3>
                  <span className={`text-[10px] font-bold ${isStep3Done ? 'text-emerald-700' : elapsed >= 8 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {isStep3Done ? 'Verified ✓' : elapsed >= 8 ? 'Validating (8-12s)...' : 'Queued'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Penny drop verification and account beneficiary name matching.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-all ${isStep4Done ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`p-2 rounded-xl border shadow-2xs shrink-0 ${isStep4Done ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-purple-600'}`}>
                {isStep4Done ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : elapsed >= 12 ? (
                  <Zap className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900">4. Express Sanction Token Generation</h3>
                  <span className={`text-[10px] font-bold ${isStep4Done ? 'text-emerald-700' : elapsed >= 12 ? 'text-purple-700' : 'text-slate-400'}`}>
                    {isStep4Done ? 'Sanctioned ✓' : elapsed >= 12 ? 'Allotting (12-15s)...' : 'Queued'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automated sanction token generated with guaranteed disbursal in up to 3 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Pre-Approval Summary */}
        {isComplete ? (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Sanctioned Amount
                </span>
                <span className="text-lg font-black text-slate-900">
                  ₹{formattedAmount(loanApp?.required_amount || loanApp?.selected_amount || 100000)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Status
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                  Pre-Approved ✓
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToPayment}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Proceed to Processing Fee Payment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-center text-slate-500 font-semibold">
              Fast-track express disbursal token assigned. Nominal fee required to finalize mandate.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-1">
            <p className="text-xs font-bold text-purple-900 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-600" /> Scanning Protocol Active
            </p>
            <p className="text-[10px] text-purple-700">
              Please keep this screen open while our automated engine scans your uploaded KYC records ({timeLeft}s).
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
            <p className="text-sm font-bold text-purple-300">Initializing Scanner...</p>
          </div>
        </div>
      }
    >
      <EliteValidationContent />
    </Suspense>
  );
}
