'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import LoanCategoryHub from '@/components/LoanCategoryHub';
import CooldownLockCard from '@/components/CooldownLockCard';
import ResumeLoanCard from '@/components/dashboard/ResumeLoanCard';
import { getAllActiveLoanApplications, checkReapplicationCooldown, AllActiveApps, CooldownInfo } from '@/lib/loan-resume';
import { RefreshCw } from 'lucide-react';

export default function LoanApplyPage() {
  const router = useRouter();
  const [activeApps, setActiveApps] = useState<AllActiveApps>({
    cashApp: null,
    constructionApp: null,
    cashResumeInfo: null,
    constructionResumeInfo: null,
    activeList: [],
  });
  const [cooldownInfo, setCooldownInfo] = useState<CooldownInfo>({
    isLocked: false,
    reapplyLockedUntil: null,
    formattedDate: null,
    daysRemaining: 0,
  });
  const [checkingApp, setCheckingApp] = useState<boolean>(true);

  useEffect(() => {
    async function checkActiveApps() {
      setCheckingApp(true);
      const cdInfo = await checkReapplicationCooldown();
      setCooldownInfo(cdInfo);

      if (!cdInfo.isLocked) {
        const apps = await getAllActiveLoanApplications();
        setActiveApps(apps);
      }
      setCheckingApp(false);
    }
    checkActiveApps();
  }, []);

  return (
    <MobileContainer>
      <LoanHeader title="Select Loan Category" showDashboardButton={true} />

      <div className="p-4 space-y-4 flex-1 animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden max-w-full pb-52">
        {/* CHECKING SKELETON */}
        {checkingApp ? (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 animate-pulse flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
            <span className="text-xs font-bold text-slate-600">Checking application status & cooldown policy...</span>
          </div>
        ) : cooldownInfo.isLocked ? (
          /* RE-APPLICATION COOLDOWN ACTIVE CARD */
          <CooldownLockCard cooldownInfo={cooldownInfo} />
        ) : (
          /* ACTIVE LOAN APPLICATION RESUME CARDS (SHOWS BOTH IF BOTH ARE IN PROGRESS) */
          <ResumeLoanCard
            loadingApp={false}
            cashApp={activeApps.cashApp}
            constructionApp={activeApps.constructionApp}
            cashResumeInfo={activeApps.cashResumeInfo}
            constructionResumeInfo={activeApps.constructionResumeInfo}
            activeList={activeApps.activeList}
            hideEmptyBanner={true}
          />
        )}

        {/* LOAN CATEGORY SELECTOR */}
        <LoanCategoryHub
          onSelectCashLoan={() => {
            if (!cooldownInfo.isLocked) {
              router.push('/loan/apply/cash-loan');
            }
          }}
          selectedLoanType={null}
          onSelectLoanOption={() => {}}
          consentLowCibil={false}
          setConsentLowCibil={() => {}}
          consentGoodCibil={false}
          setConsentGoodCibil={() => {}}
          loanTypeError=""
          setLoanTypeError={() => {}}
          onContinueLoan={(type) => {
            if (!cooldownInfo.isLocked) {
              if (type === 'construction_loan' || type === 'construction') {
                router.push('/loan/apply/construction-loan');
              } else {
                router.push(`/loan/apply/applicant-details?type=${type}`);
              }
            }
          }}
        />
      </div>
    </MobileContainer>
  );
}
