'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Home } from 'lucide-react';

interface LoanHeaderProps {
  title: string;
  stepNumber?: number;
  totalSteps?: number;
  backHref?: string;
  showDashboardButton?: boolean;
}

export default function LoanHeader({
  title,
  stepNumber,
  totalSteps = 26,
  showDashboardButton = true,
}: LoanHeaderProps) {
  return (
    <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 border-b border-slate-100 sticky top-0 z-40 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2.5">
        {/* OpenScore Brand Badge (No Back Option) */}
        <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0 border border-purple-500">
          OS
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-black text-slate-900 leading-tight">{title}</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold block leading-none mt-0.5">
            OpenScore Loan Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {showDashboardButton && (
          <Link
            href="/dashboard"
            className="text-[11px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Home className="w-3.5 h-3.5 text-purple-600" />
            <span>Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
}
