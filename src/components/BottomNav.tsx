'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home as HomeIcon,
  HandCoins,
  QrCode,
  ShoppingBag,
  History,
  User as UserIcon,
  MapPin,
} from 'lucide-react';

interface BottomNavProps {
  onScanQr?: () => void;
}

export default function BottomNav({ onScanQr }: BottomNavProps = {}) {
  const rawPathname = usePathname();
  const cleanPath = (rawPathname || '').replace(/\/$/, '');

  const isHomeActive = cleanPath === '/dashboard' || cleanPath === '';
  const isWithdrawActive = cleanPath.includes('/withdraw');
  const isLoansActive = (cleanPath.startsWith('/loan/apply') || cleanPath === '/loan');
  const isMarketActive = cleanPath === '/offers';
  const isHistoryActive = cleanPath === '/loan/my-loans';
  const isProfileActive = cleanPath === '/profile';

  return (
    <div className="fixed bottom-5 sm:bottom-6 left-3.5 right-3.5 z-[9999]">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full px-2 py-1.5 flex justify-between items-center shadow-2xl shadow-purple-900/20 w-full mb-[env(safe-area-inset-bottom,0px)]">
        {/* 1. HOME ICON */}
      <Link
        href="/dashboard"
        title="Home Dashboard"
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
          isHomeActive
            ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
        }`}
      >
        <HomeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isHomeActive ? 'text-white' : 'text-slate-600'}`} />
      </Link>

      {/* 2. LOANS ICON (Hand Taking Money) */}
      <Link
        href="/loan/apply"
        title="Loans Portal"
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
          isLoansActive
            ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
        }`}
      >
        <HandCoins className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoansActive ? 'text-white' : 'text-slate-600'}`} />
      </Link>

      {/* 3. WITHDRAW CASH ICON (ATM Dispensing Out Money) */}
      <Link
        href="/withdraw"
        title="Withdraw / Cash Out"
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
          isWithdrawActive
            ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
        }`}
      >
        {/* ATM Out Money SVG */}
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 ${isWithdrawActive ? 'text-white' : 'text-slate-600'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* ATM Screen & Body */}
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="7" y1="7" x2="17" y2="7" />
          {/* ATM Dispenser Slot */}
          <line x1="7" y1="11" x2="17" y2="11" />
          {/* Money Cash Note Coming Out of ATM Slot */}
          <rect x="8" y="13" width="8" height="6" rx="1" fill={isWithdrawActive ? 'currentColor' : '#a855f7'} fillOpacity="0.2" />
          <circle cx="12" cy="16" r="1.2" />
        </svg>
      </Link>

      {/* 4. CENTER ELEVATED QR PAY BUTTON */}
      <div className="flex items-center justify-center relative -top-3 px-0.5">
        <Link
          href="/dashboard"
          title="Scan & Pay"
          onClick={(e) => {
            if (onScanQr) {
              e.preventDefault();
              onScanQr();
            }
          }}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 border-4 border-white active:scale-95 transition-transform"
        >
          <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </Link>
      </div>

      {/* 5. MARKET ICON */}
      <Link
        href="/offers"
        title="Marketplace"
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
          isMarketActive
            ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
        }`}
      >
        <ShoppingBag className={`w-4 h-4 sm:w-5 sm:h-5 ${isMarketActive ? 'text-white' : 'text-slate-600'}`} />
      </Link>

      {/* 6. HISTORY ICON */}
      <Link
        href="/loan/my-loans"
        title="Loan History"
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
          isHistoryActive
            ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
        }`}
      >
        <History className={`w-4 h-4 sm:w-5 sm:h-5 ${isHistoryActive ? 'text-white' : 'text-slate-600'}`} />
      </Link>

      {/* 7. PROFILE ICON (MUST BE LAST) */}
      <Link
        href="/profile"
        title="User Profile"
        className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
          isProfileActive
            ? 'bg-purple-600 text-white shadow-md scale-105 ring-2 ring-purple-200'
            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-100'
        }`}
      >
        <UserIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isProfileActive ? 'text-white' : 'text-slate-600'}`} />
      </Link>
      </div>
    </div>
  );
}
