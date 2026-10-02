'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { Phone, MapPin } from 'lucide-react';
import PhoneSupportModal from '@/components/modals/PhoneSupportModal';
import LocationStatusModal from '@/components/modals/LocationStatusModal';
import QrPaymentModal from '@/components/modals/QrPaymentModal';

interface MobileContainerProps {
  children: React.ReactNode;
  showNav?: boolean;
  onScanQr?: () => void;
}

export default function MobileContainer({ children, showNav, onScanQr }: MobileContainerProps) {
  const pathname = usePathname() || '';

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto-hide bottom nav & action buttons on scroll down, show on scroll up
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleCaptureScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target || typeof target.scrollTop !== 'number') return;

      const currentScrollY = target.scrollTop;
      const diff = currentScrollY - lastScrollY.current;

      // Threshold to prevent jitter on micro-scrolls
      if (Math.abs(diff) > 6) {
        if (diff > 0 && currentScrollY > 40) {
          // Scrolling Down -> Hide bottom bar & 2 floating call/location icons
          setIsNavVisible(false);
        } else {
          // Scrolling Up -> Show bottom bar & 2 floating call/location icons
          setIsNavVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    // Capture phase listener catches scroll events on ANY scrollable child element anywhere in the app
    window.addEventListener('scroll', handleCaptureScroll, true);
    return () => {
      window.removeEventListener('scroll', handleCaptureScroll, true);
    };
  }, []);

  const handleScanQr = () => {
    if (onScanQr) {
      onScanQr();
    }
    setShowQrModal(true);
  };

  // Auth & Admin pages don't show user app bottom nav by default
  const isAuthOrAdmin =
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password') ||
    pathname.startsWith('/admin');

  const shouldShowNav = showNav !== undefined ? showNav : !isAuthOrAdmin;

  return (
    <div className="w-full max-w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex justify-center items-center text-slate-800 font-sans p-0 sm:p-4 md:p-6 overflow-hidden overflow-x-hidden">
      {/* Background Glow Accents */}
      <div className="fixed top-10 left-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Fixed Viewport Mobile App Shell */}
      <div className="w-full max-w-md mx-auto bg-white h-[100dvh] sm:h-[840px] sm:max-h-[calc(100vh-2rem)] sm:rounded-[40px] shadow-2xl relative flex flex-col pt-[env(safe-area-inset-top,0px)] border border-slate-200/80 overflow-hidden overflow-x-hidden sm:ring-8 sm:ring-slate-800/40">
        {/* Main Scrollable Body Container */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-y-auto overflow-x-hidden w-full scroll-smooth">
          {children}
        </div>

        {shouldShowNav && (
          <div
            className={`transition-all duration-300 ease-in-out z-[9999] pointer-events-auto ${
              isNavVisible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-28 opacity-0 pointer-events-none'
            }`}
          >
            {/* Sticky Floating Action Buttons (Phone/Call & Location Icons) */}
            <button
              onClick={() => setShowPhoneModal(true)}
              title="WhatsApp / Phone Support"
              className="absolute bottom-[96px] sm:bottom-[108px] left-4 z-[9999] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-all border-2 border-white pointer-events-auto cursor-pointer"
            >
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            </button>

            {/* Location Icon on Right (Hidden on /location map) */}
            {pathname !== '/location' && (
              <Link
                href="/location"
                title="Location / Stores"
                className="absolute bottom-[96px] sm:bottom-[108px] right-4 z-[9999] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-slate-600 hover:text-purple-600 flex items-center justify-center shadow-xl shadow-slate-200/50 active:scale-95 transition-all border-2 border-white pointer-events-auto cursor-pointer"
              >
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            )}


            {/* Bottom Navigation Bar */}
            <BottomNav onScanQr={handleScanQr} />
          </div>
        )}

        {/* Modular Floating Action Dialogs */}
        <PhoneSupportModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} />
        <LocationStatusModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
        <QrPaymentModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
      </div>
    </div>
  );
}
