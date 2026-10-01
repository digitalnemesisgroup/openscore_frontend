'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CibilGaugeIcon from '@/components/CibilGaugeIcon';
import {
  Banknote,
  Building2,
  Home,
  UserCheck,
  Hammer,
  CreditCard,
  Briefcase,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowRight,
  X,
  Zap,
  ArrowLeft,
  AlertTriangle,
  Wallet,
  Gift,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface LoanCategoryHubProps {
  onSelectCashLoan: () => void;
  selectedLoanType: 'no_cibil' | 'low_cibil' | 'good_cibil' | null;
  onSelectLoanOption: (type: 'no_cibil' | 'low_cibil' | 'good_cibil') => void;
  consentLowCibil: boolean;
  setConsentLowCibil: (val: boolean) => void;
  consentGoodCibil: boolean;
  setConsentGoodCibil: (val: boolean) => void;
  loanTypeError: string;
  setLoanTypeError: (msg: string) => void;
  onContinueLoan: (type: string) => void;
}

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  maxAmount: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  badge: string;
  isAvailable: boolean;
  features: string[];
}

export default function LoanCategoryHub({
  onSelectCashLoan,
  selectedLoanType,
  onSelectLoanOption,
  consentLowCibil,
  setConsentLowCibil,
  consentGoodCibil,
  setConsentGoodCibil,
  loanTypeError,
  setLoanTypeError,
  onContinueLoan,
}: LoanCategoryHubProps) {
  const router = useRouter();
  const [activeComingSoonModal, setActiveComingSoonModal] = useState<CategoryItem | null>(null);
  
  // View Modes:
  // 'HUB' -> Main Category List (Personal Loan on top)
  // 'PERSONAL_SUBTYPES' -> Choice between Cash Loan & Virtual Loan
  // 'CASH_LOAN_OPTIONS' -> Low CIBIL vs High CIBIL Options
  // 'VIRTUAL_LOAN_OPTIONS' -> OpenScore App Wallet Virtual Credit
  const [viewMode, setViewMode] = useState<
    'HUB' | 'PERSONAL_SUBTYPES' | 'CONSTRUCTION_SUBTYPES' | 'CASH_LOAN_OPTIONS' | 'VIRTUAL_LOAN_OPTIONS'
  >('HUB');

  const [consentVirtual, setConsentVirtual] = useState<boolean>(false);

  const categories: CategoryItem[] = [
    {
      id: 'personal_loan',
      title: 'Personal Loan',
      subtitle: 'Instant Personal Loan for all your everyday needs',
      maxAmount: 'Up to ₹50,00,000',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      badge: 'AVAILABLE NOW',
      isAvailable: true,
      features: ['Nominal Documentation', 'Flexible Tenure', 'Low & High CIBIL Options'],
    },
    {
      id: 'construction_loan',
      title: 'Construction Loan',
      subtitle: 'House construction, renovation & home expansion capital',
      maxAmount: 'Up to ₹50,00,000',
      icon: Hammer,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badge: 'AVAILABLE NOW',
      isAvailable: true,
      features: ['Instant Bank Disbursal', 'Custom House Construction Limits', 'Low & High CIBIL Options'],
    },
    {
      id: 'business_loan',
      title: 'Business Loan',
      subtitle: 'Collateral-free business expansion capital',
      maxAmount: 'Up to ₹1,00,00,000',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badge: 'COMING SOON',
      isAvailable: false,
      features: ['No Security Needed', 'Tax Savings Benefits', 'Custom Repayment Tenure'],
    },
    {
      id: 'lap',
      title: 'Loan Against Property',
      subtitle: 'Unlock maximum value from your property',
      maxAmount: 'Up to ₹5,00,00,000',
      icon: Home,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      badge: 'COMING SOON',
      isAvailable: false,
      features: ['Lowest Interest Rates', 'Longer Tenure (Up to 15 Yrs)', 'Residential & Commercial'],
    },
    {
      id: 'credit_card',
      title: 'Credit Cards',
      subtitle: 'Instant approval with exclusive reward points',
      maxAmount: 'Limit Up to ₹10,00,000',
      icon: CreditCard,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      badge: 'COMING SOON',
      isAvailable: false,
      features: ['Lifetime Free Options', 'Airport Lounge Access', 'Cashback on All Spends'],
    },
    {
      id: 'other_services',
      title: 'Other Services',
      subtitle: 'MSME, Machinery & Custom Financial Products',
      maxAmount: 'Custom Loan Quotes',
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      badge: 'COMING SOON',
      isAvailable: false,
      features: ['Government Subsidized Schemes', 'Machinery & Equipment Finance', 'Invoice Discounting'],
    },
  ];

  return (
    <div className="space-y-3 pb-36 animate-in fade-in duration-300">
      {/* ==================================================================== */}
      {/* VIEW 1: MAIN CATEGORIES HUB (PERSONAL LOAN ON TOP) */}
      {/* ==================================================================== */}
      {viewMode === 'HUB' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-4 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 text-purple-100 px-2.5 py-0.5 rounded-full border border-white/30 backdrop-blur-md inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
                  FINANCIAL PRODUCTS HUB
                </span>
                <h1 className="text-xl font-black tracking-tight mt-1">Select Loan Category</h1>
                <p className="text-xs text-purple-100 font-medium">Select a loan category below to get started</p>
              </div>
              <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 text-amber-300 shrink-0">
                <Zap className="w-6 h-6 fill-amber-300" />
              </div>
            </div>
          </div>

          {/* Quick Track Application Status Bar */}
          <div
            onClick={() => router.push('/loan/track')}
            className="bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-600 text-white rounded-xl">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-indigo-950">Track Loan Status</h4>
                <p className="text-[10px] text-indigo-700 font-medium">Check real-time application updates using your Loan ID</p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-600 flex items-center gap-0.5">
              Track <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'construction_loan') {
                      setViewMode('CONSTRUCTION_SUBTYPES');
                    } else if (cat.id === 'personal_loan') {
                      setViewMode('PERSONAL_SUBTYPES');
                    } else if (cat.isAvailable) {
                      onContinueLoan(cat.id);
                    } else {
                      setActiveComingSoonModal(cat);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border ${cat.borderColor} ${cat.bgColor} hover:shadow-md transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99]`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${cat.isAvailable ? (cat.id === 'construction_loan' ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200' : 'bg-purple-600 text-white shadow-md ring-2 ring-purple-200') : 'bg-white text-slate-700 shadow-2xs'} flex items-center justify-center font-bold shrink-0`}>
                        <IconComp className={`w-5 h-5 ${cat.isAvailable ? 'text-white' : cat.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-slate-900">{cat.title}</h3>
                          {cat.isAvailable ? (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              {cat.badge}
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">{cat.subtitle}</p>
                        <p className={`text-xs font-black mt-1 ${cat.id === 'construction_loan' ? 'text-emerald-700' : cat.isAvailable ? 'text-purple-700' : 'text-slate-700'}`}>
                          {cat.maxAmount}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:bg-white shadow-2xs border border-slate-200 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW: CONSTRUCTION LOAN SUB-TYPES (URGENT vs STANDARD) */}
      {/* ==================================================================== */}
      {viewMode === 'CONSTRUCTION_SUBTYPES' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-300">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <button
              onClick={() => setViewMode('HUB')}
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Loan Categories</span>
            </button>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
              CONSTRUCTION LOAN
            </span>
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Hammer className="w-6 h-6 text-emerald-600" />
              Construction Loan Options
            </h1>
            <p className="text-xs text-slate-500 font-medium">Select your construction application speed & process</p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* TYPE 1: ELITE CONSTRUCTION LOAN (⚡ EXPRESS FAST-TRACK) */}
            <div
              onClick={() => router.push('/loan/apply/construction-loan/urgent')}
              className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl p-4.5 space-y-3 cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-[0.99] group border-2 border-amber-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950/80 text-amber-300 flex items-center justify-center font-bold shadow-md border border-amber-400/40 shrink-0">
                    <Zap className="w-6 h-6 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-white">Elite Construction Loan</h3>
                      <span className="bg-slate-950/90 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-400/40">
                        ⚡ EXPRESS 24H
                      </span>
                    </div>
                    <p className="text-xs text-amber-100 font-medium leading-tight mt-0.5">
                      Direct single-form submission with express admin verification.
                    </p>
                    <p className="text-xs font-black text-white mt-1">
                      Up to ₹1,00,00,000 (1 Crore) • Property &amp; Document Fast-Track
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shadow-2xs border border-white/30 group-hover:bg-white group-hover:text-amber-600 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-xs p-3 rounded-2xl border border-white/20 text-xs text-amber-50 space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Single-step comprehensive property &amp; applicant form</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Direct QR Fee payment &amp; UTR screenshot submission</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Live 8-stage verification tracking on your portal</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/loan/apply/construction-loan/urgent');
                }}
                className="w-full py-3 bg-white text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:bg-amber-50 active:scale-[0.99] transition-all"
              >
                <span>Apply for Elite Construction Loan →</span>
                <ArrowRight className="w-4 h-4 text-amber-600" />
              </button>
            </div>

            {/* TYPE 2: STANDARD CONSTRUCTION LOAN (CIBIL TIER-BASED) - HIDDEN BY REQUEST */}
            {/*
            <div
              onClick={() => router.push('/loan/apply/construction-loan')}
              className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white border-2 border-emerald-200 hover:border-emerald-500 rounded-3xl p-4 space-y-3 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                    <Hammer className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-slate-900">Standard Construction Loan</h3>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        CIBIL TIERS
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                      Multi-tier construction capital based on your credit score profile.
                    </p>
                    <p className="text-xs font-black text-emerald-700 mt-1">
                      Up to ₹1,00,00,000 • Without CIBIL, Low & High CIBIL
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-2xs border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-emerald-100 text-xs text-slate-700 space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Without CIBIL (Up to ₹10,00,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Low CIBIL (Up to ₹40,00,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>High CIBIL (Up to ₹1,00,00,000)</span>
                </div>
              </div>
            </div>
            */}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: PERSONAL LOAN SUB-TYPES (CASH LOAN vs VIRTUAL LOAN) */}
      {/* ==================================================================== */}
      {viewMode === 'PERSONAL_SUBTYPES' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-300">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <button
              onClick={() => setViewMode('HUB')}
              className="text-xs font-extrabold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Loan Categories</span>
            </button>
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-300">
              PERSONAL LOAN
            </span>
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-purple-600" />
              Personal Loan Types
            </h1>
            <p className="text-xs text-slate-500 font-medium">Select your preferred personal loan disbursal mode</p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* TYPE 0: ELITE PERSONAL CASH LOAN (⚡ EXPRESS 2-MIN SANCTION) */}
            <div
              onClick={() => router.push('/loan/apply/cash-loan/elite')}
              className="bg-gradient-to-br from-purple-800 via-indigo-800 to-purple-900 text-white rounded-3xl p-4.5 space-y-3 cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-[0.99] group border-2 border-purple-300 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950/80 text-purple-300 flex items-center justify-center font-bold shadow-md border border-purple-400/40 shrink-0">
                    <Zap className="w-6 h-6 fill-purple-400 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-black text-white">Elite Personal Cash Loan</h3>
                      <span className="bg-slate-950/90 text-purple-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-purple-400/40">
                        ⚡ 2-MIN SANCTION
                      </span>
                      <span className="bg-purple-500/30 text-purple-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md border border-purple-300/30">
                        UP TO 3 DAYS
                      </span>
                    </div>
                    <p className="text-xs text-purple-100 font-medium leading-tight mt-0.5">
                      Instant 2-minute live validation, simple KYC &amp; bank disbursal in up to 3 days.
                    </p>
                    <p className="text-xs font-black text-white mt-1">
                      Up to ₹15,00,000 • Disbursal in Up to 3 Days
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shadow-2xs border border-white/30 group-hover:bg-white group-hover:text-purple-800 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-xs p-3 rounded-2xl border border-white/20 text-xs text-purple-50 space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>2-minute automated live credit &amp; KYC verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Nominal processing fee payment &amp; instant token</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Direct disbursal into applicant bank account (takes up to 3 days)</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/loan/apply/cash-loan/elite');
                }}
                className="w-full py-3 bg-white text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:bg-purple-50 active:scale-[0.99] transition-all"
              >
                <span>Apply for Elite Cash Loan →</span>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </button>
            </div>

            {/* TYPE 1: CASH LOAN (CIBIL TIERS) - HIDDEN BY REQUEST */}
            {/*
            <div
              onClick={() => {
                setViewMode('CASH_LOAN_OPTIONS');
                onSelectCashLoan();
              }}
              className="bg-gradient-to-br from-purple-50 via-purple-50/50 to-white border-2 border-purple-200 hover:border-purple-500 rounded-3xl p-4 space-y-3 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-slate-900">Standard Cash Loan (CIBIL Tiers)</h3>
                      <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        BANK DISBURSAL
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                      Direct cash transfer into your bank account.
                    </p>
                    <p className="text-xs font-black text-purple-700 mt-1">
                      Up to ₹50,00,000 • Low &amp; High CIBIL Options
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-2xs border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-purple-100 text-xs text-slate-700 space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Low CIBIL Option (Up to ₹4,00,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>High CIBIL Option (Up to ₹50,00,000)</span>
                </div>
              </div>
            </div>
            */}

            {/* TYPE 2: VIRTUAL LOAN */}
            <div
              onClick={() => setViewMode('VIRTUAL_LOAN_OPTIONS')}
              className="bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-white border-2 border-indigo-200 hover:border-indigo-500 rounded-3xl p-4 space-y-3 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.99] group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-slate-900">Virtual Loan</h3>
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        APP WALLET CREDIT
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                      Credited directly to your OpenScore App Wallet.
                    </p>
                    <p className="text-xs font-black text-indigo-700 mt-1">
                      Up to ₹1,00,000 • Instant In-App Wallet Credit
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-2xs border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-indigo-100 text-xs text-slate-700 space-y-1.5 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Instant OpenScore Wallet balance credit</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Usable for in-app wallet transfers & bill payments (Non-withdrawable to ATM)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: CASH LOAN OPTIONS (LOW CIBIL vs HIGH CIBIL) */}
      {/* ==================================================================== */}
      {viewMode === 'CASH_LOAN_OPTIONS' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <button
              onClick={() => setViewMode('PERSONAL_SUBTYPES')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Personal Loan Types</span>
            </button>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
              CASH LOAN ACTIVE
            </span>
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Banknote className="w-6 h-6 text-purple-600" />
              Cash Loan Options
            </h1>
            <p className="text-xs text-slate-500 font-medium">Select Loan Type based on your credit profile</p>
          </div>

          {loanTypeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {loanTypeError}
            </div>
          )}

          {/* 1. WITHOUT CIBIL LOAN (BLUE ZONE) */}
          <div
            onClick={() => {
              onSelectLoanOption('no_cibil');
              setLoanTypeError('');
            }}
            className={`rounded-3xl p-4 space-y-3 transition-all cursor-pointer border-2 ${
              selectedLoanType === 'no_cibil'
                ? 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                : 'bg-white border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                  <CibilGaugeIcon type="none" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900">Without CIBIL Loan</h3>
                    <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.2 rounded-md border border-blue-200">
                      BLUE ZONE (0-300 / ZERO)
                    </span>
                  </div>
                  <p className="text-xs font-black text-blue-600">Up to ₹2,50,000</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-snug">
              Special loan option for freshers, first-time borrowers & zero CIBIL history.
            </p>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold leading-tight">
                Note: Company service & processing fee will be charged extra for zero CIBIL score profile processing.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-700 font-semibold bg-white p-3 rounded-xl border border-blue-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>No prior CIBIL credit history required</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Instant income & Aadhaar based fast-track verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Multiple partner options with flexible repayment terms</span>
              </li>
            </ul>

            <label
              onClick={(e) => e.stopPropagation()}
              className={`flex items-start gap-2.5 cursor-pointer pt-1 p-2.5 rounded-xl border transition-all ${
                selectedLoanType === 'no_cibil' ? 'bg-blue-100/60 border-blue-300' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLoanType === 'no_cibil' && consentLowCibil}
                onChange={(e) => {
                  onSelectLoanOption('no_cibil');
                  setConsentLowCibil(e.target.checked);
                  if (e.target.checked) setLoanTypeError('');
                }}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
              />
              <span className="text-[11px] text-slate-800 font-medium leading-snug">
                I understand that processing fee is applicable for this service and I am interested in proceeding with the applicable fee.
              </span>
            </label>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onContinueLoan('no_cibil');
              }}
              disabled={selectedLoanType !== 'no_cibil'}
              className={`w-full py-3.5 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all ${
                selectedLoanType === 'no_cibil'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Accept & Continue (Without CIBIL)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. LOW CIBIL LOAN */}
          <div
            onClick={() => {
              onSelectLoanOption('low_cibil');
              setLoanTypeError('');
            }}
            className={`rounded-3xl p-4 space-y-3 transition-all cursor-pointer border-2 ${
              selectedLoanType === 'low_cibil'
                ? 'bg-gradient-to-br from-rose-50 via-rose-50/50 to-white border-rose-600 shadow-md ring-2 ring-rose-400/30'
                : 'bg-white border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                  <CibilGaugeIcon type="low" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900">Low CIBIL Loan</h3>
                    <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.2 rounded-md border border-rose-200">
                      RED ZONE (300-620)
                    </span>
                  </div>
                  <p className="text-xs font-black text-rose-600">Up to ₹4,00,000</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-snug">
              Suitable Bank & NBFC loan options matched to your profile.
            </p>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-start gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold leading-tight">
                Note: Company service & processing fee will be charged extra for low CIBIL score profile processing.
              </p>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-700 font-semibold bg-white p-3 rounded-xl border border-rose-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Special low CIBIL eligibility consideration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Nominal documentation requirement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Multiple partner NBFC options</span>
              </li>
            </ul>

            <label
              onClick={(e) => e.stopPropagation()}
              className={`flex items-start gap-2.5 cursor-pointer pt-1 p-2.5 rounded-xl border transition-all ${
                selectedLoanType === 'low_cibil' ? 'bg-rose-100/60 border-rose-300' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLoanType === 'low_cibil' && consentLowCibil}
                onChange={(e) => {
                  onSelectLoanOption('low_cibil');
                  setConsentLowCibil(e.target.checked);
                  if (e.target.checked) setLoanTypeError('');
                }}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 shrink-0"
              />
              <span className="text-[11px] text-slate-800 font-medium leading-snug">
                I understand that processing fee is applicable for this service and I am interested in proceeding with the applicable fee.
              </span>
            </label>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onContinueLoan('low_cibil');
              }}
              disabled={selectedLoanType !== 'low_cibil'}
              className={`w-full py-3.5 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all ${
                selectedLoanType === 'low_cibil'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Accept & Continue (Low CIBIL)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. HIGH CIBIL LOAN */}
          <div
            onClick={() => {
              onSelectLoanOption('good_cibil');
              setLoanTypeError('');
            }}
            className={`rounded-3xl p-4 space-y-3 transition-all cursor-pointer border-2 ${
              selectedLoanType === 'good_cibil'
                ? 'bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white border-emerald-600 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-white border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center p-1 shadow-2xs shrink-0">
                  <CibilGaugeIcon type="high" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-slate-900">High CIBIL Loan</h3>
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-md border border-emerald-200">
                      GREEN ZONE (750-900)
                    </span>
                  </div>
                  <p className="text-xs font-black text-emerald-600">Up to ₹50,00,000</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-snug">
              Top Bank & NBFC loan options with fast approvals & lowest interest rates.
            </p>

            <ul className="space-y-1.5 text-xs text-slate-700 font-semibold bg-white p-3 rounded-xl border border-emerald-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>High approval limit up to ₹50 Lakhs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Lowest ROI starting from 10.5% p.a.</span>
              </li>
            </ul>

            <label
              onClick={(e) => e.stopPropagation()}
              className={`flex items-start gap-2.5 cursor-pointer pt-1 p-2.5 rounded-xl border transition-all ${
                selectedLoanType === 'good_cibil' ? 'bg-emerald-100/60 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedLoanType === 'good_cibil' && consentGoodCibil}
                onChange={(e) => {
                  onSelectLoanOption('good_cibil');
                  setConsentGoodCibil(e.target.checked);
                  if (e.target.checked) setLoanTypeError('');
                }}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0"
              />
              <span className="text-[11px] text-slate-800 font-medium leading-snug">
                I understand that processing fee is applicable for this service and I am interested in proceeding with the applicable fee.
              </span>
            </label>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onContinueLoan('good_cibil');
              }}
              disabled={selectedLoanType !== 'good_cibil'}
              className={`w-full py-3.5 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all ${
                selectedLoanType === 'good_cibil'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Accept & Continue (High CIBIL)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: VIRTUAL LOAN OPTIONS (APP WALLET CREDIT ONLY) */}
      {/* ==================================================================== */}
      {viewMode === 'VIRTUAL_LOAN_OPTIONS' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <button
              onClick={() => setViewMode('PERSONAL_SUBTYPES')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Personal Loan Types</span>
            </button>
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-300">
              VIRTUAL LOAN ACTIVE
            </span>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white p-4 rounded-3xl shadow-xl space-y-2.5 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-amber-300 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white leading-tight">Wallet Virtual Loan</h2>
                <p className="text-xs text-indigo-100 font-medium">Credit limit up to ₹1,00,000</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 text-xs font-medium text-purple-100">
              <p className="text-[11px] leading-relaxed text-indigo-50">
                💡 <strong className="text-white">Note:</strong> Credited to OpenScore App Wallet for in-app transfers & payments. Non-withdrawable to ATM/Bank.
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-indigo-100 rounded-3xl p-4 space-y-3 shadow-xs">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Approval</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Zero Doc Fee</span>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1 bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200/80">
              <input
                type="checkbox"
                checked={consentVirtual}
                onChange={(e) => setConsentVirtual(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
              />
              <span className="text-[11px] text-slate-800 font-bold leading-tight">
                I accept credit into OpenScore App Wallet
              </span>
            </label>

            <button
              disabled={!consentVirtual}
              onClick={(e) => {
                e.stopPropagation();
                router.push('/loan/apply/virtual-loan');
              }}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] transition-all"
            >
              <span>Apply for Virtual Loan →</span>
            </button>
          </div>
        </div>
      )}

      {/* COMING SOON MODAL */}
      {activeComingSoonModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveComingSoonModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className={`w-16 h-16 rounded-3xl ${activeComingSoonModal.bgColor} ${activeComingSoonModal.color} flex items-center justify-center mx-auto shadow-md border border-slate-200 relative`}>
                {React.createElement(activeComingSoonModal.icon, { className: 'w-8 h-8' })}
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                  🚀
                </span>
              </div>

              <div>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block mb-1">
                  LAUNCHING VERY SOON
                </span>
                <h3 className="text-lg font-black text-slate-900">{activeComingSoonModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium">{activeComingSoonModal.subtitle}</p>
                <p className="text-sm font-black text-purple-700 mt-1">{activeComingSoonModal.maxAmount}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Key Product Highlights:</h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {activeComingSoonModal.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              We are expanding our partner bank integrations for {activeComingSoonModal.title}. In the meantime, you can apply for an instant <span className="font-bold text-purple-700">Personal Loan</span>!
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setActiveComingSoonModal(null);
                  setViewMode('PERSONAL_SUBTYPES');
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Apply for Personal Loan Now →</span>
              </button>

              <button
                onClick={() => setActiveComingSoonModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close & Explore Other Options
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
