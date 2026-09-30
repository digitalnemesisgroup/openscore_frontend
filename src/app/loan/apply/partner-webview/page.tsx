'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { ShieldCheck, Lock, ArrowRight, Building2, CheckCircle2, ExternalLink, RefreshCw, Copy, Check, Globe } from 'lucide-react';

interface ActivePartnerInfo {
  id: string;
  name: string;
  amount: string;
  roi: string;
  active_roi?: string;
  active_amount?: string;
  badge: string;
  url: string;
}

const DEFAULT_PARTNER: ActivePartnerInfo = {
  id: 'kotak',
  name: 'Kotak Mahindra Bank',
  amount: 'Up to ₹40,00,000',
  roi: '10.99% p.a.',
  badge: 'POPULAR CHOICE',
  url: 'https://onboarding.kotak.bank.in/pl?utm_source=website&utm_medium=Apply_now&utm_campaign=Loans_page',
};

export default function PartnerWebviewPage() {
  const router = useRouter();
  const [appId, setAppId] = useState<string | null>(null);
  const [partner, setPartner] = useState<ActivePartnerInfo>(DEFAULT_PARTNER);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedAppId = typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null;
    if (savedAppId) setAppId(savedAppId);

    const savedPartner = typeof window !== 'undefined' ? localStorage.getItem('active_partner_info') : null;
    if (savedPartner) {
      try {
        const parsed = JSON.parse(savedPartner);
        setPartner(parsed);
      } catch (e) {}
    }
  }, []);

  const handleOpenAffiliateLink = () => {
    if (typeof window !== 'undefined' && partner.url) {
      window.open(partner.url, '_blank');
    }
  };

  const handleNextToProof = () => {
    router.push('/loan/apply/proof-submission');
  };

  const handleCopyRefNo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText('HDPL987654321');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCleanDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch (e) {
      return 'onboarding.lender.bank.in';
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Lending Partner" stepNumber={14} backHref="/loan/apply/select-partner" />

      <div className="p-4 pb-28 space-y-4 flex-1 overflow-y-auto animate-in fade-in duration-300">
        <div>
          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
            Step 14 of 26
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Lending Partner</h1>
          <p className="text-xs text-slate-500 font-medium">Complete application on official lender portal</p>
        </div>

        {/* EMBEDDED MINI BROWSER CONTAINER (NO URL BAR) */}
        <div className="rounded-2xl border border-slate-300 shadow-md bg-white overflow-hidden">
          {/* Mini Browser Top Title Bar */}
          <div className="bg-slate-900 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center gap-1.5 ml-1 text-slate-200 font-semibold text-xs truncate min-w-0">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{getCleanDomain(partner.url)}</span>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md shrink-0 ml-2">
              SECURE WEBVIEW
            </span>
          </div>

          {/* Mini Browser Interactive Webview Body */}
          <div className="bg-slate-50 p-4 space-y-3.5">
            {/* Bank Header Card */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{partner.name}</h3>
                    <p className="text-[10px] text-blue-200">Interest {partner.active_roi || partner.roi} • {partner.active_amount || partner.amount}</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-md border border-blue-400/30 shrink-0">
                  {partner.badge}
                </span>
              </div>
            </div>

            {/* Application Progress & Reference Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-700">Application Onboarding Status:</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pre-Approved & Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Reference Number</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono font-bold text-blue-700 text-xs">HDPL987654321</span>
                    <button
                      type="button"
                      onClick={handleCopyRefNo}
                      className="p-1 text-slate-400 hover:text-blue-600"
                      title="Copy Reference Number"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Sanction Amount</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">₹2,00,000</span>
                </div>
              </div>

              {/* Direct Open Link for Live Bank Portal */}
              <button
                type="button"
                onClick={handleOpenAffiliateLink}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <Globe className="w-4 h-4" />
                <span>Open {partner.name} Official Portal →</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-medium leading-relaxed">
                ✅ Application pre-approved on {partner.name} portal! Click the button above to visit the official portal, copy your Reference Number (<strong className="font-mono text-emerald-800">HDPL987654321</strong>) or take a screenshot, then click Next below to upload proof.
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Next to Submit Application Proof */}
        <button
          onClick={handleNextToProof}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
        >
          <span>Next: Submit Application Proof →</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </MobileContainer>
  );
}
