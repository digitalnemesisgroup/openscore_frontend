'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, Headphones, ArrowUpRight } from 'lucide-react';

interface HeaderBarProps {
  userName: string;
  userInitial: string;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenSupport: () => void;
}

export default function HeaderBar({
  userName,
  userInitial,
  onOpenSearch,
  onOpenNotifications,
  onOpenSupport,
}: HeaderBarProps) {
  const router = useRouter();

  return (
    <div className="bg-white px-3 py-3 flex items-center justify-between border-b border-slate-100 sticky top-0 z-40">
      {/* User Greeting - Clicking opens Profile Page */}
      <div
        onClick={() => router.push('/profile')}
        title="Click to view Profile"
        className="flex items-center gap-2 cursor-pointer group active:scale-98 transition-transform"
      >
        <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-base flex items-center justify-center shadow-md group-hover:bg-purple-700 transition-colors">
          {userInitial}
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium block leading-none">
            Welcome back,
          </span>
          <span className="text-sm font-black text-slate-900 tracking-wide block mt-0.5 group-hover:text-purple-600 transition-colors">
            {userName} 👋
          </span>
        </div>
      </div>

      {/* Live Users Pill Badge */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-2xs shrink-0">
        <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[3px]" />
        <span>10,611 LIVE USERS</span>
      </div>

      {/* Right Header Icons */}
      <div className="flex items-center gap-2 text-slate-600 shrink-0">
        <button
          onClick={onOpenSearch}
          title="Search Services"
          className="p-1.5 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenNotifications}
          title="Notifications"
          className="p-1.5 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
        </button>
        <button
          onClick={onOpenSupport}
          title="Help & Support"
          className="p-1.5 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-colors"
        >
          <Headphones className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

