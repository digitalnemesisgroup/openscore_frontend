'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import CibilGaugeIcon from '@/components/CibilGaugeIcon';
import { CheckCircle2, ArrowRight, Banknote, AlertTriangle, RefreshCw, Play, Info } from 'lucide-react';
import { getActiveLoanApplication, getResumeStepDetails, cancelLoanApplication, checkReapplicationCooldown, LoanAppRecord, ResumeStepInfo, CooldownInfo } from '@/lib/loan-resume';
import CooldownLockCard from '@/components/CooldownLockCard';

export default function CashLoanSelectorPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'no_cibil' | 'low_cibil' | 'good_cibil'>('no_cibil');
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [activeApp, setActiveApp] = useState<LoanAppRecord | null>(null);
  const [resumeInfo, setResumeInfo] = useState<ResumeStepInfo | null>(null);
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo>({ isLocked: false, reapplyLockedUntil: null, formattedDate: null, daysRemaining: 0 });
  const [checkingApp, setCheckingApp] = useState<boolean>(true);
  const [showNewAppOptions, setShowNewAppOptions] = useState<boolean>(false);
  const [cancellingApp, setCancellingApp] = useState<boolean>(false);
  const [cancelledNotice, setCancelledNotice] = useState<string>('');

  useEffect(() => {
    async function checkActiveApp() {
      setCheckingApp(true);
      const cdInfo = await checkReapplicationCooldown();
      setCooldownInfo(cdInfo);

      if (!cdInfo.isLocked) {
        const app = await getActiveLoanApplication('cash');
        if (app && app.final_decision !== 'REJECTED' && (app.status || '').toLowerCase() !== 'rejected') {
          const info = getResumeStepDetails(app);
          if (!info.isCompleted) {
            setActiveApp(app);
            setResumeInfo(info);
          }
        }
      }
      setCheckingApp(false);
    }
    checkActiveApp();
  }, []);

  const handleStartNewApplication = async () => {
    if (activeApp) {
      setCancellingApp(true);
      const appNo = activeApp.application_number || `OSL-${activeApp.id}`;
      await cancelLoanApplication(activeApp.id);
      setCancelledNotice(`Previous application #${appNo} automatically marked as CANCELLED BY USER in database.`);
      setActiveApp(null);
      setResumeInfo(null);
      setCancellingApp(false);
    }
    setShowNewAppOptions(true);
  };

  const handleContinue = async (type: 'no_cibil' | 'low_cibil' | 'good_cibil') => {
    setError('');
    if (selectedType !== type || !consentAccepted) {
      setError('Please accept the processing fee consent for your selected loan option to proceed.');
      return;
    }
    if (activeApp) {
      await cancelLoanApplication(activeApp.id);
    }
    router.push(`/loan/apply/applicant-details?type=${type}`);
  };

  const handleResumeActiveApp = () => {
    if (activeApp && resumeInfo) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_loan_app_id', activeApp.id.toString());
      }
      router.push(resumeInfo.routeUrl);
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Cash Loan Options" stepNumber={1} backHref="/loan/apply" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200 inline-flex items-center gap-1 mb-1">
            <Banknote className="w-3 h-3 text-purple-600" /> INSTANT CASH DISBURSAL
          </span>
          <h1 className="text-xl font-black text-slate-900">Select Cash Loan Type</h1>
          <p className="text-xs text-slate-500 font-medium">Choose according to your credit profile score</p>
        </div>

        {/* LOADING SKELETON */}
        {checkingApp ? (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 animate-pulse flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-slate-600">Checking for existing active loan application...</span>
          </div>
        ) : cooldownInfo.isLocked ? (
          <CooldownLockCard cooldownInfo={cooldownInfo} />
        ) : activeApp && resumeInfo && !showNewAppOptions ? (
          /* ACTIVE LOAN APPLICATION RESUME PROMPT CARD (SHOWN EXCLUSIVELY) */
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 shadow-xl border-2 border-purple-500/40 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Play className="w-3 h-3 fill-white" /> ACTIVE LOAN IN PROGRESS
              </span>
              <span className="text-[10px] font-mono font-bold text-purple-200 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                #{activeApp.application_number || `OSL-${activeApp.id}`}
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-white">{resumeInfo.stepTitle}</h3>
              <p className="text-xs text-purple-200 font-semibold mt-0.5 flex items-center gap-2">
                <span>Step {resumeInfo.stepNumber} of 26</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{resumeInfo.progressPercent}% Completed</span>
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-purple-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${resumeInfo.progressPercent}%` }}
              />
            </div>

            <button
              onClick={handleResumeActiveApp}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span>Resume Saved Application (Step {resumeInfo.stepNumber}) →</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartNewApplication}
              disabled={cancellingApp}
              className="w-full text-center text-[11px] font-bold text-rose-300 hover:text-white underline pt-1 flex items-center justify-center gap-1"
            >
              {cancellingApp ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Cancelling previous loan in database...</span>
                </>
              ) : (
                <span>Or Start a New Application instead (Cancels current active loan)</span>
              )}
            </button>
          </div>
        ) : (
          /* NEW APPLICATION OPTIONS */
          <>
            {cancelledNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-bold flex items-start gap-2 animate-in fade-in">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{cancelledNotice}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* 1. WITHOUT CIBIL LOAN (RED ZONE) */}
            <div
              onClick={() => {
                setSelectedType('no_cibil');
                setError('');
              }}
              className={`rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer border-2 ${
                selectedType === 'no_cibil'
                  ? 'bg-gradient-to-r from-rose-50/90 via-red-50/40 to-white border-rose-600 shadow-md ring-2 ring-rose-400/20'
                  : 'bg-white border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 p-0.5">
                    <CibilGaugeIcon type="none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-black text-slate-900">Without CIBIL Loan</h3>
                      <span className="text-[8px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-200 uppercase">
                        RED ZONE (0-300 / ZERO)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                      First-time & zero credit history
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Amount</span>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 inline-block">
                    Up to ₹2,50,000
                  </span>
                </div>
              </div>

              <label
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded-xl border transition-all ${
                  selectedType === 'no_cibil' ? 'bg-rose-100/70 border-rose-300' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedType === 'no_cibil' && consentAccepted}
                  onChange={(e) => {
                    setSelectedType('no_cibil');
                    setConsentAccepted(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
                />
                <span className="text-[10px] text-slate-700 font-bold leading-tight">
                  I understand processing fee applies for zero CIBIL profile processing.
                </span>
              </label>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('no_cibil');
                }}
                disabled={selectedType !== 'no_cibil'}
                className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all ${
                  selectedType === 'no_cibil'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Accept & Continue (Without CIBIL)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. LOW CIBIL LOAN (ORANGE ZONE) */}
            <div
              onClick={() => {
                setSelectedType('low_cibil');
                setError('');
              }}
              className={`rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer border-2 ${
                selectedType === 'low_cibil'
                  ? 'bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border-orange-500 shadow-md ring-2 ring-orange-400/20'
                  : 'bg-white border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 p-0.5">
                    <CibilGaugeIcon type="low" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-black text-slate-900">Low CIBIL Loan</h3>
                      <span className="text-[8px] font-extrabold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded border border-orange-200 uppercase">
                        ORANGE ZONE (300-620)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                      Matched to profile with NBFC partners
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Amount</span>
                  <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 inline-block">
                    Up to ₹4,00,000
                  </span>
                </div>
              </div>

              <label
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded-xl border transition-all ${
                  selectedType === 'low_cibil' ? 'bg-orange-100/70 border-orange-300' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedType === 'low_cibil' && consentAccepted}
                  onChange={(e) => {
                    setSelectedType('low_cibil');
                    setConsentAccepted(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 shrink-0"
                />
                <span className="text-[10px] text-slate-700 font-bold leading-tight">
                  I understand processing fee applies for low CIBIL profile processing.
                </span>
              </label>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('low_cibil');
                }}
                disabled={selectedType !== 'low_cibil'}
                className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all ${
                  selectedType === 'low_cibil'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Accept & Continue (Low CIBIL)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. HIGH CIBIL LOAN (GREEN ZONE) */}
            <div
              onClick={() => {
                setSelectedType('good_cibil');
                setError('');
              }}
              className={`rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer border-2 ${
                selectedType === 'good_cibil'
                  ? 'bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white border-emerald-600 shadow-md ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 p-0.5">
                    <CibilGaugeIcon type="high" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-black text-slate-900">High CIBIL Loan</h3>
                      <span className="text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 uppercase">
                        GREEN ZONE (750-900)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                      Lowest ROI from 10.5% p.a. & fast approvals
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Amount</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block">
                    Up to ₹50,00,000
                  </span>
                </div>
              </div>

              <label
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded-xl border transition-all ${
                  selectedType === 'good_cibil' ? 'bg-emerald-100/70 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedType === 'good_cibil' && consentAccepted}
                  onChange={(e) => {
                    setSelectedType('good_cibil');
                    setConsentAccepted(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
                />
                <span className="text-[10px] text-slate-700 font-bold leading-tight">
                  I understand processing fee applies for profile processing.
                </span>
              </label>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('good_cibil');
                }}
                disabled={selectedType !== 'good_cibil'}
                className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all ${
                  selectedType === 'good_cibil'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Accept & Continue (High CIBIL)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </MobileContainer>
  );
}
