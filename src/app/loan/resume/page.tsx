'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import {
  getAllActiveLoanApplications,
  resolveTargetAppId,
  getResumeStepDetails,
  formatLoanType,
  AllActiveApps,
  ActiveLoanItem,
  LoanAppRecord,
} from '@/lib/loan-resume';
import {
  RefreshCw,
  ArrowRight,
  FileText,
  Clock,
  Hammer,
  Banknote,
  CreditCard,
  Home,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

function LoanResumeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get('id');
  const urlCategory = searchParams.get('category') as 'cash' | 'construction' | null;

  const [loading, setLoading] = useState(true);
  const [activeApps, setActiveApps] = useState<AllActiveApps | null>(null);
  const [singleApp, setSingleApp] = useState<{
    app: LoanAppRecord;
    stepUrl: string;
    stepTitle: string;
    progress: number;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Checking your active loan applications...');

  useEffect(() => {
    async function loadActiveApplications() {
      setLoading(true);

      // If a specific application ID is requested via ?id=
      if (urlAppId) {
        setStatusMessage(`Locating application #${urlAppId}...`);
        const { appRecord } = await resolveTargetAppId(urlAppId, urlCategory || 'cash');

        if (appRecord) {
          const stepInfo = getResumeStepDetails(appRecord);
          setSingleApp({
            app: appRecord,
            stepUrl: stepInfo.routeUrl,
            stepTitle: stepInfo.stepTitle,
            progress: stepInfo.progressPercent,
          });
          setStatusMessage(`Resuming ${formatLoanType(appRecord.loan_type)}...`);

          // Auto-redirect to the exact active step
          const timer = setTimeout(() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('active_loan_app_id', appRecord.id.toString());
            }
            router.replace(stepInfo.routeUrl);
          }, 600);
          return () => clearTimeout(timer);
        }
      }

      // Fetch all active user applications
      const apps = await getAllActiveLoanApplications();
      setActiveApps(apps);
      setLoading(false);
    }

    loadActiveApplications();
  }, [urlAppId, urlCategory, router]);

  const activeList: ActiveLoanItem[] = activeApps?.activeList || [];

  const handleResumeLoan = (appId: number, routeUrl: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_loan_app_id', appId.toString());
    }
    router.push(routeUrl);
  };

  return (
    <MobileContainer>
      <LoanHeader title="Resume Application" showDashboardButton={true} backHref="/dashboard" />

      <div className="p-4 space-y-4 flex-1 pb-48 animate-in fade-in duration-300">
        {/* State 1: Resolving a specific requested ID */}
        {loading || singleApp ? (
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">{statusMessage}</h3>
              <p className="text-xs text-slate-500 mt-1">Opening your last completed step...</p>
            </div>
          </div>
        ) : activeList.length > 0 ? (
          /* State 2: Dedicated List of In-Progress Loans to Resume */
          <div className="space-y-3.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> IN-PROGRESS APPLICATIONS
              </span>
              <h1 className="text-xl font-black text-slate-900">Select Loan to Resume</h1>
              <p className="text-xs text-slate-500 font-medium">
                Choose the application you want to continue working on:
              </p>
            </div>

            {/* SEPARATE DETAILED CARDS FOR EACH IN-PROGRESS LOAN */}
            <div className="space-y-3">
              {activeList.map((item) => {
                const { app, resumeInfo, isConstruction, isVirtual, loanCategoryTitle } = item;
                const amountVal = app.selected_amount || app.required_amount || (isConstruction ? 1500000 : 400000);
                const formattedAmount = new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(amountVal);
                const appNum = app.application_number || `OSL-${app.id}`;

                return (
                  <div
                    key={app.id}
                    className={`rounded-2xl p-4 shadow-lg relative overflow-hidden border-2 transition-all ${
                      isConstruction
                        ? 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white border-emerald-500/40'
                        : isVirtual
                        ? 'bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 text-white border-cyan-500/40'
                        : 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white border-purple-500/40'
                    }`}
                  >
                    {/* Glowing ambient spot */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                        isConstruction
                          ? 'bg-emerald-500/20'
                          : isVirtual
                          ? 'bg-cyan-500/20'
                          : 'bg-purple-500/20'
                      }`}
                    />

                    {/* Top Row: Category Tag & Application Number */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                            isConstruction
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : isVirtual
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {isConstruction ? (
                            <Hammer className="w-4 h-4" />
                          ) : isVirtual ? (
                            <CreditCard className="w-4 h-4" />
                          ) : (
                            <Banknote className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <span
                            className={`text-[11px] font-black uppercase tracking-wider block ${
                              isConstruction
                                ? 'text-emerald-400'
                                : isVirtual
                                ? 'text-cyan-300'
                                : 'text-purple-300'
                            }`}
                          >
                            {loanCategoryTitle}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300">#{appNum}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">
                          Loan Value
                        </span>
                        <span
                          className={`text-sm font-black ${
                            isConstruction
                              ? 'text-emerald-300'
                              : isVirtual
                              ? 'text-cyan-300'
                              : 'text-purple-300'
                          }`}
                        >
                          {formattedAmount}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Step details & Selected Partner */}
                    <div className="my-2 space-y-1 relative z-10">
                      <h3 className="text-sm font-black text-white leading-snug">{resumeInfo.stepTitle}</h3>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold border ${
                            isConstruction
                              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                              : isVirtual
                              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30'
                              : 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                          }`}
                        >
                          Step {resumeInfo.stepNumber} of 26
                        </span>
                        {app.selected_partner_name && (
                          <span className="text-slate-300 text-[10.5px]">
                            • Partner: <strong className="text-white">{app.selected_partner_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="my-2 space-y-1 relative z-10">
                      <div className="flex items-center justify-between text-[10.5px] font-bold">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Application Progress
                        </span>
                        <span
                          className={
                            isConstruction
                              ? 'text-emerald-400 font-extrabold'
                              : isVirtual
                              ? 'text-cyan-300 font-extrabold'
                              : 'text-purple-300 font-extrabold'
                          }
                        >
                          {resumeInfo.progressPercent}% Completed
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden border border-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isConstruction
                              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300'
                              : isVirtual
                              ? 'bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-300'
                              : 'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-300'
                          }`}
                          style={{ width: `${resumeInfo.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Resume Action Button for This Specific Loan */}
                    <button
                      onClick={() => handleResumeLoan(app.id, resumeInfo.routeUrl)}
                      className={`w-full py-2.5 px-3.5 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-white cursor-pointer mt-2.5 relative z-10 ${
                        isConstruction
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40'
                          : isVirtual
                          ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40'
                          : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40'
                      }`}
                    >
                      <span>{resumeInfo.actionText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 text-center">
              <Link
                href="/loan/apply"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline inline-flex items-center gap-1"
              >
                Or apply for a different loan category →
              </Link>
            </div>
          </div>
        ) : (
          /* State 3: No Active Applications in Progress */
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <FileText className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">No Active Loan Found</h3>
              <p className="text-xs text-slate-500 mt-1">You do not have an incomplete loan application at this time.</p>
            </div>

            <div className="pt-2 space-y-2">
              <Link
                href="/loan/apply"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                Apply for a New Loan <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default function LoanResumePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold animate-spin">
              OS
            </div>
            <p className="text-xs text-slate-400 font-medium">Loading Loan Application...</p>
          </div>
        </div>
      }
    >
      <LoanResumeContent />
    </Suspense>
  );
}
