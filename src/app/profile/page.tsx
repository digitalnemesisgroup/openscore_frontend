'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import { useAuth } from '@/lib/auth-context';
import { User, LogOut, ShieldCheck, Phone, Mail, Sparkles, Rocket, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <MobileContainer>
      {/* Header */}
      <div className="bg-white px-4 py-3.5 border-b border-slate-100 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
            OS
          </div>
          <h1 className="text-base font-black text-slate-900">My Account Profile</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 animate-in fade-in zoom-in-95 duration-500">
        {user ? (
          <>
            {/* User Profile Card */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white p-5 rounded-3xl shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-14 h-14 bg-white/20 border-2 border-white/30 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">{user.name}</h2>
                  {user.email && (
                    <p className="text-xs text-blue-100 flex items-center gap-1.5 pt-0.5">
                      <Mail className="w-3.5 h-3.5" /> {user.email}
                    </p>
                  )}
                  {user.mobile && (
                    <p className="text-xs text-blue-100 flex items-center gap-1.5 pt-0.5">
                      <Phone className="w-3.5 h-3.5" /> +91 {user.mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coming Soon Settings Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Rocket className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Advanced Controls
                </span>
                <h3 className="text-sm font-black text-slate-900">Advanced Profile Settings — Coming Soon!</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Automatic bank statement fetch, biometric login, and document vault features are under development.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-3 space-y-2 shadow-2xs text-xs">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Security
                </div>
                <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px]">
                  100% Encrypted
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Account
            </button>
          </>
        ) : (
          <div className="text-center py-12 space-y-4 bg-slate-50 border border-slate-200 rounded-3xl p-6">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">You are not signed in</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sign in with your mobile number to track loan applications.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-3.5 bg-blue-600 text-white text-xs font-bold rounded-2xl shadow-md text-center"
            >
              Sign In with Mobile OTP
            </Link>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
