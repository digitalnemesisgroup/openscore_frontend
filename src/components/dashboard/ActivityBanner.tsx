'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, Clock, ShieldCheck, History } from 'lucide-react';

interface ActivityBannerProps {
  onOpenActivity?: () => void;
}

export default function ActivityBanner({ onOpenActivity }: ActivityBannerProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onOpenActivity) {
      onOpenActivity();
    } else {
      router.push('/activity');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 relative overflow-hidden shadow-md border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:border-indigo-400/60 transition-all active:scale-[0.99] group"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            <h3 className="text-xs font-black tracking-wide text-white">Activity</h3>
          </div>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-extrabold px-2 py-0.2 rounded-full">
            Live Timeline & Logs
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
          <span className="flex items-center gap-1">
            <History className="w-2.5 h-2.5 text-indigo-400" /> Loan Progress
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-purple-400" /> Payments
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Audit Log
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 relative z-10">
        <div className="w-8 h-8 bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
