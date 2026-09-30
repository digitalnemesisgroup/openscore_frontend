'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
    router.push('/login');
  };

  return (
    <>
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} duration={2200} />
      ) : (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              OS
            </div>
            <p className="text-xs text-slate-400 font-medium">Redirecting to Login...</p>
          </div>
        </div>
      )}
    </>
  );
}
