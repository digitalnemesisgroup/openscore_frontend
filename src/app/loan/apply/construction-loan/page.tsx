'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import CooldownLockCard from '@/components/CooldownLockCard';
import CibilGaugeIcon from '@/components/CibilGaugeIcon';
import { Hammer, ArrowRight, RefreshCw, Play, Zap, Sparkles } from 'lucide-react';
import { getActiveLoanApplication, getResumeStepDetails, cancelLoanApplication, checkReapplicationCooldown, LoanAppRecord, ResumeStepInfo, CooldownInfo } from '@/lib/loan-resume';

export default function ConstructionLoanSelectorPage() {
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

  useEffect(() => {
    async function checkActiveApp() {
      setCheckingApp(true);
      const cdInfo = await checkReapplicationCooldown();
      setCooldownInfo(cdInfo);

      if (!cdInfo.isLocked) {
        const app = await getActiveLoanApplication('construction');
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
      await cancelLoanApplication(activeApp.id);
      setActiveApp(null);
      setResumeInfo(null);
      setCancellingApp(false);
    }
    setShowNewAppOptions(true);
  };

  const handleContinue = async (type: 'no_cibil' | 'low_cibil' | 'good_cibil') => {
    setError('');
    if (selectedType !== type || !consentAccepted) {
      setError('Please accept the processing fee consent for your selected construction option to proceed.');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('construction_cibil_type', type);
    }
    if (activeApp) {
      await cancelLoanApplication(activeApp.id);
    }
    router.push(`/loan/apply/construction-loan/applicant-details?cibil_type=${type}`);
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
      <LoanHeader title="Construction Loan Options" stepNumber={1} backHref="/loan/apply" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 mb-1">
            <Hammer className="w-3 h-3 text-emerald-600" /> HOUSE & PROPERTY CAPITAL
          </span>
          <h1 className="text-xl font-black text-slate-900">Select Construction Loan Type</h1>
          <p className="text-xs text-slate-500 font-medium">Choose according to your credit profile score tier</p>
        </div>

        {/* Track Existing Loan Bar */}
        <div
          onClick={() => router.push('/loan/track')}
          className="bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600 text-white rounded-xl">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-xs font-black text-indigo-950">Already applied for a loan?</p>
              <p className="text-[10px] text-indigo-700 font-medium">Check real-time approval status using your Loan ID</p>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-600 flex items-center gap-0.5">
            Track <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {cooldownInfo.isLocked ? (
          <CooldownLockCard cooldownInfo={cooldownInfo} />
        ) : (
          /* CONSTRUCTION LOAN SELECTION CARDS */
          <>
            {/* ⚡ ELITE FAST-TRACK CONSTRUCTION LOAN OPTION */}
            <div
              onClick={() => router.push('/loan/apply/construction-loan/urgent')}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-4.5 shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group border-2 border-amber-300 space-y-3 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-slate-950/90 text-amber-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-amber-400/40">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> ELITE EXPRESS LOAN
                    </span>
                    <span className="bg-white/20 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md">
                      24-48H DISBURSAL
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white pt-0.5">Elite Construction Loan</h3>
                  <p className="text-xs text-amber-100 font-medium leading-tight">
                    Fast-track property, income &amp; construction purpose review with direct verification.
                  </p>
                </div>
                <div className="shrink-0 bg-white/20 p-3 rounded-2xl group-hover:bg-white group-hover:text-amber-600 transition-colors text-white">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-xs p-2.5 rounded-xl text-xs text-amber-100 flex items-center justify-between">
                <span className="font-bold">Max Limit: Up to ₹1,00,00,000 (1 Crore)</span>
                <span className="bg-white text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg">
                  Apply Elite Now →
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-1">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Or Standard CIBIL Tiers
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* 1. WITHOUT CIBIL CONSTRUCTION LOAN (RED ZONE) */}
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
                      <h3 className="text-xs font-black text-slate-900">Without CIBIL Construction</h3>
                      <span className="text-[8px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded border border-rose-200 uppercase">
                        RED ZONE (0-300 / ZERO)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                      20% - 30% Monthly Income allocation formula
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Amount</span>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 inline-block">
                    Up to ₹10,00,000
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
                  I understand processing fee applies for zero CIBIL construction profile processing.
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

            {/* 2. LOW CIBIL CONSTRUCTION LOAN (ORANGE ZONE) */}
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
                      <h3 className="text-xs font-black text-slate-900">Low CIBIL Construction</h3>
                      <span className="text-[8px] font-extrabold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded border border-orange-200 uppercase">
                        ORANGE ZONE (300-620)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                      25% - 35% Monthly Income allocation formula
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Amount</span>
                  <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 inline-block">
                    Up to ₹40,00,000
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
                  I understand processing fee applies for low CIBIL construction profile processing.
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

            {/* 3. HIGH CIBIL CONSTRUCTION LOAN (GREEN ZONE) */}
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
                      <h3 className="text-xs font-black text-slate-900">High CIBIL Construction</h3>
                      <span className="text-[8px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 uppercase">
                        GREEN ZONE (750-900)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                      30% - 40% Monthly Income allocation formula
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Max Amount</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block">
                    Up to ₹1,00,00,000
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
                  I understand processing fee applies for construction profile processing.
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
