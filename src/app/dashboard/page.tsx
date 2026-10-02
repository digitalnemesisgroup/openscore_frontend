'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import { useAuth } from '@/lib/auth-context';
import { getAllActiveLoanApplications, AllActiveApps } from '@/lib/loan-resume';

// Modular Dashboard Components
import HeaderBar from '@/components/dashboard/HeaderBar';

import TopValueCards from '@/components/dashboard/TopValueCards';
import QuickActionsRow from '@/components/dashboard/QuickActionsRow';
import SecureTransactionsBanner from '@/components/dashboard/SecureTransactionsBanner';
import ActivityBanner from '@/components/dashboard/ActivityBanner';
import MarketplaceSection from '@/components/dashboard/MarketplaceSection';
import TrustBadgesRow from '@/components/dashboard/TrustBadgesRow';

// Modular Modal Dialogs
import SearchModal from '@/components/modals/SearchModal';
import NotificationsModal from '@/components/modals/NotificationsModal';
import HelpSupportModal from '@/components/modals/HelpSupportModal';
import ScanQrModal from '@/components/modals/ScanQrModal';
import PayIdModal from '@/components/modals/PayIdModal';
import SendMoneyModal from '@/components/modals/SendMoneyModal';
import ShowQrModal from '@/components/modals/ShowQrModal';
import RewardsModal from '@/components/modals/RewardsModal';
import EliteValueModal from '@/components/modals/EliteValueModal';
import VaultCardModal from '@/components/modals/VaultCardModal';
import SecurityModal from '@/components/modals/SecurityModal';
import MarketplaceModal from '@/components/modals/MarketplaceModal';
import { apiRequest } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeApps, setActiveApps] = useState<AllActiveApps>({
    cashApp: null,
    constructionApp: null,
    cashResumeInfo: null,
    constructionResumeInfo: null,
    activeList: [],
  });
  const [loadingApp, setLoadingApp] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Modal State Control
  const [activeModal, setActiveModal] = useState<
    'search' | 'notifications' | 'support' | 'scanQr' | 'payId' | 'sendMoney' | 'showQr' | 'rewards' | 'eliteValue' | 'vaultCard' | 'security' | 'marketplace' | null
  >(null);

  const [selectedProduct, setSelectedProduct] = useState<{ title: string; discount: string } | null>(null);

  // Enforce Login First
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch active applications & wallet balance
  useEffect(() => {
    async function fetchApplications() {
      if (!user) return;
      try {
        const [apps, cardRes] = await Promise.allSettled([
          getAllActiveLoanApplications(),
          apiRequest('/user/wallet-card'),
        ]);

        if (apps.status === 'fulfilled' && apps.value) {
          setActiveApps(apps.value);
        }

        if (cardRes.status === 'fulfilled' && cardRes.value && cardRes.value.data) {
          const bal = Number(cardRes.value.data.available_value) || 0;
          setWalletBalance(bal);
        }
      } catch (e) {
        console.error('Failed to load active applications:', e);
      } finally {
        setLoadingApp(false);
      }
    }

    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold animate-spin">
            OS
          </div>
          <p className="text-xs text-slate-400 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  const userNameUpper = user.name ? user.name.toUpperCase() : 'USER';
  const initialLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <MobileContainer onScanQr={() => setActiveModal('scanQr')}>
      {/* 1. Header Bar */}
      <HeaderBar
        userName={userNameUpper}
        userInitial={initialLetter}
        onOpenSearch={() => setActiveModal('search')}
        onOpenNotifications={() => setActiveModal('notifications')}
        onOpenSupport={() => setActiveModal('support')}
      />

      {/* 2. Scrollable Body Content */}
      <div className="p-3.5 space-y-4 pb-28 bg-slate-50/50">

        {/* Top Elite Value & Vault Cards */}
        <TopValueCards
          eliteValue={walletBalance}
          vaultValue={walletBalance}
          onOpenEliteValue={() => setActiveModal('eliteValue')}
          onOpenVaultCard={() => setActiveModal('vaultCard')}
        />

        {/* 5 Quick Action Grid Buttons */}
        <QuickActionsRow
          onScanQr={() => setActiveModal('scanQr')}
          onPayId={() => setActiveModal('payId')}
          onSendMoney={() => setActiveModal('sendMoney')}
          onShowQr={() => setActiveModal('showQr')}
          onRewards={() => setActiveModal('rewards')}
        />

        {/* Security Transaction Banner */}
        <SecureTransactionsBanner onOpenSecurity={() => setActiveModal('security')} />

        {/* Account Activity Banner */}
        <ActivityBanner />

        {/* Marketplace Category Slider */}
        <MarketplaceSection
          onSelectProduct={(prod) => {
            setSelectedProduct(prod);
            setActiveModal('marketplace');
          }}
        />

        {/* Trust Badges */}
        <TrustBadgesRow />
      </div>

      {/* 3. Rendered Modal Components */}
      <SearchModal isOpen={activeModal === 'search'} onClose={() => setActiveModal(null)} />
      <NotificationsModal isOpen={activeModal === 'notifications'} onClose={() => setActiveModal(null)} />
      <HelpSupportModal isOpen={activeModal === 'support'} onClose={() => setActiveModal(null)} />
      <ScanQrModal
        isOpen={activeModal === 'scanQr'}
        onClose={() => setActiveModal(null)}
        onManualInput={() => setActiveModal('payId')}
      />
      <PayIdModal isOpen={activeModal === 'payId'} onClose={() => setActiveModal(null)} />
      <SendMoneyModal isOpen={activeModal === 'sendMoney'} onClose={() => setActiveModal(null)} />
      <ShowQrModal
        isOpen={activeModal === 'showQr'}
        onClose={() => setActiveModal(null)}
        userName={user.name || 'User'}
        userMobile={user.mobile}
      />
      <RewardsModal isOpen={activeModal === 'rewards'} onClose={() => setActiveModal(null)} />
      <EliteValueModal isOpen={activeModal === 'eliteValue'} onClose={() => setActiveModal(null)} />
      <VaultCardModal isOpen={activeModal === 'vaultCard'} onClose={() => setActiveModal(null)} userName={user.name || 'User'} />
      <SecurityModal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} />
      <MarketplaceModal
        isOpen={activeModal === 'marketplace'}
        onClose={() => setActiveModal(null)}
        product={selectedProduct}
      />
    </MobileContainer>
  );
}
