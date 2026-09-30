'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  LoanAppRecord,
  ResumeStepInfo,
  ActiveLoanItem,
  getResumeStepDetails,
} from '@/lib/loan-resume';

interface ResumeLoanCardProps {
  loadingApp: boolean;
  activeApp?: LoanAppRecord | null;
  cashApp?: LoanAppRecord | null;
  constructionApp?: LoanAppRecord | null;
  cashResumeInfo?: ResumeStepInfo | null;
  constructionResumeInfo?: ResumeStepInfo | null;
  activeList?: ActiveLoanItem[];
  hideEmptyBanner?: boolean;
}

export default function ResumeLoanCard({
  loadingApp,
  activeApp,
  cashApp,
  constructionApp,
  cashResumeInfo,
  constructionResumeInfo,
  activeList,
  hideEmptyBanner = false,
}: ResumeLoanCardProps) {
  const router = useRouter();

  if (loadingApp) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-36"></div>
          <div className="h-3 bg-slate-100 rounded w-24"></div>
        </div>
        <div className="h-8 bg-purple-100 rounded-xl w-24"></div>
      </div>
    );
  }

  // Check if any active loan exists
  let hasActiveLoans = false;
  let activeCount = 0;

  if (activeList && activeList.length > 0) {
    hasActiveLoans = true;
    activeCount = activeList.length;
  } else {
    if (cashApp && !cashResumeInfo?.isCompleted) {
      hasActiveLoans = true;
      activeCount++;
    }
    if (constructionApp && !constructionResumeInfo?.isCompleted) {
      hasActiveLoans = true;
      activeCount++;
    }
    if (!hasActiveLoans && activeApp) {
      const info = getResumeStepDetails(activeApp);
      if (!info.isCompleted) {
        hasActiveLoans = true;
        activeCount = 1;
      }
    }
  }

  // If no active loan applications
  if (!hasActiveLoans) {
    if (hideEmptyBanner) {
      return null;
    }
    return (
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
            INSTANT LOANS AVAILABLE
          </span>
          <h3 className="text-sm font-black text-white">Cash & Construction Loans up to ₹1 Crore</h3>
          <p className="text-[11px] text-purple-100 mt-0.5">Instant approval with flexible tenure</p>
        </div>
        <button
          onClick={() => router.push('/loan/apply')}
          className="bg-white text-purple-700 px-3 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-purple-50 transition-colors shrink-0 cursor-pointer"
        >
          Apply Now →
        </button>
      </div>
    );
  }

  // Dedicated Track Loan Status Banner
  return (
    <div
      onClick={() => router.push('/loan/track')}
      className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-indigo-500/40 relative overflow-hidden cursor-pointer hover:border-indigo-400/80 transition-all active:scale-[0.99] group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
            </span>
            <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider">
              Real-time Tracker
            </span>
          </div>
          <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
            <span>Track Application Status</span>
            <span className="text-[9px] bg-white/20 text-indigo-100 px-1.5 py-0.2 rounded font-bold">
              By Loan ID
            </span>
          </h3>
          <p className="text-[10px] text-slate-300 font-medium truncate">
            Check real-time verification &amp; approval updates
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push('/loan/track');
          }}
          className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1 transition-all shrink-0 border border-indigo-400/40"
        >
          <span>Track Status</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
