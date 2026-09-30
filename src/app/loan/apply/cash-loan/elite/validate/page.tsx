'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Scan,
  ShieldCheck,
  Lock,
  FileCheck,
  User,
  QrCode,
} from 'lucide-react';

function EliteValidationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('app_id');

  // Exact 2-minute (120 seconds) document scanning sequence
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

  // Persistent Countdown Clock using target end timestamp for 12 seconds
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

      <div className="p-4 space-y-4 flex-1 pb-32 animate-in fade-in duration-300 overflow-y-auto">
        {/* TOP STATUS CARD */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{isComplete ? 'Scan Complete' : 'AI Live Document Scan'}</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {isComplete ? 'Verification Successful! 🎉' : 'Scanning KYC Documents'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isComplete
              ? 'Your documents have been verified and pre-approved for express disbursal.'
              : 'Our automated system is scanning your uploaded Aadhaar, PAN & selfie.'}
          </p>
        </div>

        {/* 📄 DOCUMENT TOP-TO-BOTTOM SCANNING ANIMATION CONTAINER */}
        <div className="relative mx-auto w-full max-w-xs bg-slate-900 rounded-3xl p-4 shadow-2xl border-2 border-purple-500/40 overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-purple-600/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyan-600/30 rounded-full blur-2xl" />

          {/* SIMULATED DOCUMENT CARD */}
          <div className="relative bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-inner overflow-hidden">
            {/* Top Bar of Document */}
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-400 flex items-center justify-center text-[10px] font-black text-purple-300">
                  ID
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-200 block leading-tight">NATIONAL IDENTITY</span>
                  <span className="text-[8px] font-mono text-slate-400">UIDAI / NSDL VERIFIED</span>
                </div>
              </div>
              <ShieldCheck className={`w-4 h-4 ${isComplete ? 'text-emerald-400' : 'text-purple-400'}`} />
            </div>

            {/* Document Body (Photo + Lines) */}
            <div className="flex items-center gap-3">
              {/* Photo Box */}
              <div className="w-16 h-20 rounded-xl bg-slate-950/80 border border-slate-700 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden shrink-0">
                <User className="w-8 h-8 text-slate-500" />
                <span className="text-[8px] font-mono text-slate-500 mt-1">PHOTO</span>
                {isComplete && (
                  <div className="absolute inset-0 bg-emerald-950/80 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Data Rows */}
              <div className="flex-1 space-y-2">
                <div className="space-y-1">
                  <div className="h-2 w-24 bg-slate-700 rounded-full" />
                  <div className="h-1.5 w-16 bg-slate-800 rounded-full" />
                </div>
                <div className="space-y-1">
                  <div className="h-2 w-20 bg-slate-700 rounded-full" />
                  <div className="h-1.5 w-28 bg-slate-800 rounded-full" />
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <div className="h-2 w-16 bg-purple-500/50 rounded-full" />
                  <QrCode className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </div>

            {/* Document Bottom Mask */}
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-700/80">
              <span>CARD NO: •••• •••• 5849</span>
              <span className="text-emerald-400 font-bold">{isComplete ? '100% MATCH' : 'SCANNING...'}</span>
            </div>

            {/* ⚡ LASER SCANNING BEAM (TOP TO BOTTOM CONTINUOUS SWEEP) */}
            {!isComplete && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee,0_0_30px_#a855f7] z-20 animate-[scanLaser_2s_easeInOut_infinite] top-0" />
            )}
          </div>

          {/* PROGRESS BAR UNDER SCANNER */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isComplete
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                    : 'bg-gradient-to-r from-cyan-400 via-purple-500 to-indigo-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
              <span>{isComplete ? 'Scan Completed' : `Scanning: ${progressPercent}%`}</span>
              <span className="text-cyan-300">{isComplete ? '✓ Ready' : formattedTime}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION & SUMMARY */}
        {isComplete ? (
          <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300 pt-2">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
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
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
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
              Pre-approved fast-track credit line reserved for your application.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-1">
            <p className="text-xs font-bold text-purple-900 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-600" /> Secure Document OCR Verification
            </p>
            <p className="text-[10px] text-purple-700 font-medium">
              Please keep this screen open while our automated engine scans your uploaded documents.
            </p>
          </div>
        )}
      </div>

      {/* Embedded Keyframe CSS for Top-to-Bottom Laser Sweep Animation */}
      <style jsx>{`
        @keyframes scanLaser {
          0% {
            top: 0%;
            opacity: 0.8;
          }
          50% {
            top: 96%;
            opacity: 1;
          }
          100% {
            top: 0%;
            opacity: 0.8;
          }
        }
      `}</style>
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
