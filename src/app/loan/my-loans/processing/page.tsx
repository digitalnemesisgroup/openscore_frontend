'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

function LoanProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id') || '1';

  const [secondsLeft, setSecondsLeft] = useState<number>(18 * 60 + 26);

  // Persistent Real-Time Countdown Timer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timerStorageKey = `openscore_processing_start_${appId}`;
    let startTime = localStorage.getItem(timerStorageKey);

    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(timerStorageKey, startTime);
    }

    const startTimestamp = parseInt(startTime, 10);
    const totalDurationSeconds = 20 * 60; // 20 minutes total SLA

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);
      const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);
      setSecondsLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [appId]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedMinutes = mins < 10 ? `0${mins}` : `${mins}`;
  const formattedSeconds = secs < 10 ? `0${secs}` : `${secs}`;

  return (
    <MobileContainer>
      <LoanHeader title="Application Processing" backHref="/loan/my-loans" />

      <div className="p-4 space-y-4 pb-36 flex-1 overflow-y-auto animate-in fade-in duration-300 text-center">
        {/* Animated Clock */}
        <div className="pt-2 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-500/20 flex items-center justify-center shadow-inner relative animate-pulse">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div>
          <h2 className="text-base font-black text-slate-900">Application Under Bank Review</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
            Your application is being verified by bank systems. This takes up to 20 minutes.
          </p>
        </div>

        {/* Real-time Countdown Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 inline-block w-full">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            ESTIMATED TIME REMAINING
          </p>
          <div className="text-3xl font-black font-mono text-blue-700 tracking-widest flex items-center justify-center gap-2">
            <span>{formattedMinutes}</span>
            <span className="animate-pulse">:</span>
            <span>{formattedSeconds}</span>
          </div>
          <div className="flex justify-center gap-12 text-[10px] font-bold text-slate-400 mt-1">
            <span>Minutes</span>
            <span>Seconds</span>
          </div>
        </div>

        {/* Process Steps Checklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left space-y-3 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Application Submitted</p>
              <p className="text-[10px] text-emerald-700 font-bold">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Lender Process Completed</p>
              <p className="text-[10px] text-emerald-700 font-bold">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900">Proof & Selfie Verified</p>
              <p className="text-[10px] text-emerald-700 font-bold">Completed</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              🔵
            </div>
            <div>
              <p className="font-bold text-blue-900">Bank/Lender Review</p>
              <p className="text-[10px] text-blue-700 font-bold">In Progress</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Your application is being reviewed by the bank/lender.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Final Approval</p>
              <p className="text-[10px] text-slate-400">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Next: Disbursement</p>
              <p className="text-[10px] text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        {/* Blue Callout Note */}
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-left text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1 text-blue-800">
            <AlertTriangle className="w-4 h-4 text-blue-600" /> Please Note
          </p>
          <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 pl-1">
            <li>This process may take up to 20 minutes.</li>
            <li>Keep your phone active for any verification call.</li>
            <li>You will be notified once the review is completed.</li>
          </ul>
        </div>

        {/* View Approval Card Button */}
        <button
          onClick={() => router.push(`/loan/my-loans/approved?id=${appId}`)}
          className="w-full py-3.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md text-center hover:bg-emerald-700 transition-colors"
        >
          Check Instant Approval Status →
        </button>
      </div>
    </MobileContainer>
  );
}

export default function LoanProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">Loading timer...</div>}>
      <LoanProcessingContent />
    </Suspense>
  );
}

