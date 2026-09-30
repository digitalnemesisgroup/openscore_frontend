'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { ArrowRight, Zap, Building2, ShieldCheck } from 'lucide-react';
import { getActiveLoanApplication, getResumeStepDetails, checkReapplicationCooldown, LoanAppRecord, ResumeStepInfo, CooldownInfo } from '@/lib/loan-resume';
import CooldownLockCard from '@/components/CooldownLockCard';

export default function ConstructionLoanSelectorPage() {
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<LoanAppRecord | null>(null);
  const [resumeInfo, setResumeInfo] = useState<ResumeStepInfo | null>(null);
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo>({ isLocked: false, reapplyLockedUntil: null, formattedDate: null, daysRemaining: 0 });
  const [checkingApp, setCheckingApp] = useState<boolean>(true);

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

  return (
    <MobileContainer>
      <LoanHeader title="Construction Loan" backHref="/loan/apply" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Track Existing Loan Bar */}
        <div
          onClick={() => router.push('/loan/track')}
          className="bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-xl">
              <Building2 className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="text-xs font-black text-emerald-950">Track existing construction loan?</p>
              <p className="text-[10px] text-emerald-700 font-medium">Check real-time verification &amp; disbursal status</p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5">
            Track <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {cooldownInfo.isLocked ? (
          <CooldownLockCard cooldownInfo={cooldownInfo} />
        ) : (
          <div className="space-y-4 pt-2">
            {/* 🏗️ CLEAN & MINIMAL ELITE CONSTRUCTION LOAN CARD */}
            <div
              onClick={() => router.push('/loan/apply/construction-loan/urgent')}
              className="bg-gradient-to-br from-amber-600 via-orange-600 to-slate-900 text-white rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group border border-amber-400/30 space-y-4 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="bg-slate-950/80 text-amber-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-amber-400/30">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Fast-Track Express
                </span>
                <span className="text-xs font-black text-white bg-white/20 px-2.5 py-1 rounded-xl">
                  Up to ₹1 Crore
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white">Elite Construction Loan</h2>
                <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                  House construction, property development &amp; renovation credit with expedited sanction.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-amber-100 font-semibold pt-1 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Property Fast-Track
                </span>
                <span>•</span>
                <span>Direct Bank Mandate</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/loan/apply/construction-loan/urgent');
                }}
                className="w-full py-3.5 bg-white text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 group-hover:bg-amber-50 transition-all active:scale-[0.99]"
              >
                <span>Apply for Elite Construction Loan</span>
                <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
