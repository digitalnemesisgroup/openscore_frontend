'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  LoanAppRecord,
  ResumeStepInfo,
  ActiveLoanItem,
  getResumeStepDetails,
  isVirtualApp,
  isConstructionApp,
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

  // If loading and no cached application data exists, render skeleton
  if (loadingApp && !activeApp && !cashApp && !constructionApp && (!activeList || activeList.length === 0)) {
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

  // Check for active incomplete application
  const primaryItem = activeList && activeList.length > 0 ? activeList[0] : null;
  const primaryApp = primaryItem ? primaryItem.app : (cashApp || constructionApp || activeApp);
  const primaryResume = primaryItem
    ? primaryItem.resumeInfo
    : (cashResumeInfo || constructionResumeInfo || (primaryApp ? getResumeStepDetails(primaryApp) : null));
  const isVirtual = primaryItem ? primaryItem.isVirtual : (primaryApp ? isVirtualApp(primaryApp) : false);
  const isConst = primaryItem ? primaryItem.isConstruction : (primaryApp ? isConstructionApp(primaryApp) : false);

  // If there's an active in-progress loan application, render the full Active Loan Card
  if (primaryApp && primaryResume && !primaryResume.isCompleted) {
    const categoryTitle = isVirtual ? 'VIRTUAL LOAN' : (isConst ? 'CONSTRUCTION LOAN' : 'CASH LOAN');
    const loanTitle = isVirtual ? 'Virtual Loan Application' : (isConst ? 'Construction Loan Application' : 'Cash Loan Application');
    const totalSteps = isVirtual ? 3 : (isConst ? 26 : 26);
    const loanAmount = primaryApp.approved_amount || primaryApp.selected_amount || primaryApp.required_amount || 30000;
    const appNo = primaryApp.application_number || `OS${primaryApp.id}`;

    return (
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-4 relative overflow-hidden animate-in fade-in">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between text-xs relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wider text-blue-300 text-[11px]">
              📁 Active {categoryTitle}
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded-md">
            #{appNo}
          </span>
        </div>

        {/* Main Info */}
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">{loanTitle}</h3>
            <span className="inline-block mt-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-black px-2 py-0.5 rounded-md">
              Step {primaryResume.stepNumber} of {totalSteps}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">LOAN VALUE</span>
            <span className="text-xl font-black text-white tracking-tight">
              ₹{loanAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-blue-400" /> Progress
            </span>
            <span className="font-mono text-blue-400">{primaryResume.progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${primaryResume.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => router.push(primaryResume.routeUrl)}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer relative z-10"
        >
          <span>{primaryResume.actionText}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // If no active in-progress loans or loan is completed, show Real-Time Tracker Banner
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
