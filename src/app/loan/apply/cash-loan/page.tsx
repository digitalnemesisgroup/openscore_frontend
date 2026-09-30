'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { ArrowRight, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getActiveLoanApplication, getResumeStepDetails, checkReapplicationCooldown, LoanAppRecord, ResumeStepInfo, CooldownInfo } from '@/lib/loan-resume';
import CooldownLockCard from '@/components/CooldownLockCard';

export default function CashLoanSelectorPage() {
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

  return (
    <MobileContainer>
      <LoanHeader title="Personal Cash Loan" backHref="/loan/apply" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
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
          <div className="space-y-4 pt-2">
            {/* ⚡ CLEAN & MINIMAL ELITE CASH LOAN CARD */}
            <div
              onClick={() => router.push('/loan/apply/cash-loan/elite')}
              className="bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group border border-purple-400/30 space-y-4 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="bg-slate-950/80 text-purple-300 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-purple-400/30">
                  <Zap className="w-3.5 h-3.5 text-purple-400 fill-purple-400" /> Fast-Track Express
                </span>
                <span className="text-xs font-black text-white bg-white/20 px-2.5 py-1 rounded-xl">
                  Up to ₹15 Lakhs
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white">Elite Personal Cash Loan</h2>
                <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                  Fast-track AI document scanning &amp; direct bank disbursal in up to 3 days.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-purple-200 font-semibold pt-1 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Simple KYC
                </span>
                <span>•</span>
                <span>Direct Bank Transfer</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/loan/apply/cash-loan/elite');
                }}
                className="w-full py-3.5 bg-white text-slate-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 group-hover:bg-purple-50 transition-all active:scale-[0.99]"
              >
                <span>Apply for Elite Cash Loan</span>
                <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
