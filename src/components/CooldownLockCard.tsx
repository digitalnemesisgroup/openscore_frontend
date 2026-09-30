'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, ShieldAlert, ArrowRight } from 'lucide-react';
import { CooldownInfo } from '@/lib/loan-resume';

interface CooldownLockCardProps {
  cooldownInfo: CooldownInfo;
}

export default function CooldownLockCard({ cooldownInfo }: CooldownLockCardProps) {
  const router = useRouter();

  if (!cooldownInfo.isLocked) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 text-white rounded-3xl p-5 shadow-xl border-2 border-amber-500/40 space-y-3.5 relative overflow-hidden animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
          <Clock className="w-3 h-3" /> RE-APPLICATION COOLDOWN ACTIVE
        </span>
        <span className="text-[10px] font-mono font-bold text-amber-200 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
          {cooldownInfo.daysRemaining} DAY{cooldownInfo.daysRemaining > 1 ? 'S' : ''} WAIT
        </span>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-base font-black text-white">Application Cooldown Locked</h3>
        </div>
        <p className="text-xs text-amber-100/90 font-medium mt-1.5 leading-relaxed">
          As per banking & eligibility regulations, a cool-down window is active following your previous application decision before submitting a new request.
        </p>
      </div>

      <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-amber-200/70 uppercase tracking-wider">Eligible To Re-Apply On</div>
          <div className="text-xs sm:text-sm font-black text-amber-300 font-mono mt-0.5">{cooldownInfo.formattedDate}</div>
        </div>
      </div>

      <button
        onClick={() => router.push('/loan/my-loans')}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
      >
        <span>View My Loan Applications & Status</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

