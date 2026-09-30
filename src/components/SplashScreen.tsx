'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, Zap, Lock } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export default function SplashScreen({ onFinish, duration = 2200 }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, duration - 400);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white flex flex-col justify-between items-center p-8 font-sans transition-all duration-500 overflow-hidden ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Particles Halo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div />

      {/* Center Branding & Animated Logo */}
      <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-90 duration-700 relative z-10">
        {/* Glowing Logo Badge */}
        <div className="relative group">
          <div className="absolute -inset-3 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl blur-xl opacity-60 animate-pulse" />
          <div className="w-22 h-22 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl border-2 border-blue-400/30 relative transform group-hover:scale-105 transition-transform">
            OS
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white fill-white" />
            </span>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            OpenScore
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </h1>
          <p className="text-xs font-bold text-blue-200/90 tracking-wider uppercase">
            Your Financial Growth Partner
          </p>
        </div>

        {/* Animated Progress Bar Loader */}
        <div className="w-48 h-1.5 bg-blue-950/90 rounded-full overflow-hidden border border-blue-500/30 mt-4 shadow-inner">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold pb-3 animate-in fade-in duration-1000 relative z-10">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>100% Encrypted & Authorized Partners</span>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
