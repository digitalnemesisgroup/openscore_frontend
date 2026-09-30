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

  // CLEAN, SLEEK, COMPACT RESUME BANNER (ONLY RESUME BUTTON & STATUS)
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-indigo-500/40 relative overflow-hidden animate-in fade-in duration-300">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
              {activeCount > 1 ? `${activeCount} Applications In Progress` : 'Application In Progress'}
            </span>
          </div>
          <h3 className="text-xs font-black text-white truncate">
            Resume Your Loan Application
          </h3>
          <p className="text-[10px] text-slate-300 font-medium truncate">
            Continue from your last completed step
          </p>
        </div>

        <button
          onClick={() => router.push('/loan/resume')}
          className="py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 border border-purple-400/40"
        >
          <span>Resume</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
