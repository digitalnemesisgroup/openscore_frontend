'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import { Building2, CheckCircle2, ArrowRight, RefreshCw, ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';

interface AffiliatePartner {
  id: string;
  name: string;
  category?: 'both' | 'low_cibil' | 'high_cibil';
  low_cibil_roi?: string;
  high_cibil_roi?: string;
  low_cibil_amount?: string;
  high_cibil_amount?: string;
  amount: string;
  roi: string;
  badge: string;
  url: string;
  is_active: boolean;
}

function SelectPartnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appId, setAppId] = useState<string | null>(null);
  const [loanType, setLoanType] = useState<'no_cibil' | 'low_cibil' | 'good_cibil'>('no_cibil');
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApp() {
      const { appId: targetId, appRecord } = await resolveTargetAppId(urlAppId, 'cash');
      if (targetId && appRecord) {
        setAppId(targetId);
        if (appRecord.loan_type) {
          setLoanType(appRecord.loan_type as any);
        }
        const statusStr = (appRecord.fee_payment_status || appRecord.payment_status || '').toLowerCase();
        const mainStatus = (appRecord.status || '').toLowerCase();
        const isVerified =
          statusStr.includes('approved') ||
          statusStr.includes('verified') ||
          appRecord.payment_status === 'approved' ||
          appRecord.payment_status === 'verified' ||
          appRecord.payment_status === 'paid' ||
          mainStatus === 'submitted_to_partners' ||
          mainStatus.includes('partner') ||
          mainStatus.includes('approved');

        if (!isVerified) {
          router.push(`/loan/apply/fee-payment?id=${targetId}`);
        }
      } else {
        router.push('/loan/apply/fee-payment');
      }
    }

    loadApp();

    // Fetch active affiliate partners list from backend API
    setFetching(true);
    apiRequest('/partners')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const activeList = res.data.filter((p: AffiliatePartner) => p.is_active !== false);
          setPartners(activeList);
          if (activeList.length > 0) setSelectedPartner(activeList[0].id);
        } else {
          setPartners([]);
        }
      })
      .catch(() => {
        setPartners([]);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [urlAppId, router]);

  // Filter partners according to loan_type
  const displayPartners = partners.filter((p) => {
    const cat = (p.category || 'both') as string;
    if (cat === 'both') return true;
    if (loanType === 'low_cibil') return cat === 'low_cibil' || cat === 'both';
    return cat === 'high_cibil' || cat === 'both';
  });

  // Fallback to all active partners if filtered is empty
  const activePartners = displayPartners.length > 0 ? displayPartners : partners;

  const handleConfirmPartner = async () => {
    const matched = activePartners.find((p) => p.id === selectedPartner) || activePartners[0];
    if (!matched) {
      setError('Please select a lending partner to proceed.');
      return;
    }

    setLoading(true);
    setError('');

    // Compute active ROI and Amount according to loanType
    const activeRoi = loanType === 'low_cibil' ? (matched.low_cibil_roi || matched.roi) : (matched.high_cibil_roi || matched.roi);
    const activeAmount = loanType === 'low_cibil' ? (matched.low_cibil_amount || matched.amount) : (matched.high_cibil_amount || matched.amount);

    const partnerPayload = {
      ...matched,
      active_roi: activeRoi,
      active_amount: activeAmount,
    };

    // Save active partner info to localStorage for Step 14 webview/redirect
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_partner_info', JSON.stringify(partnerPayload));
    }

    if (appId) {
      try {
        await apiRequest(`/loan/apply/${appId}/partner`, {
          method: 'POST',
          body: JSON.stringify({
            selected_partner_id: matched.id,
            selected_partner_name: matched.name,
            selected_partner_url: matched.url,
            selected_partner_roi: activeRoi,
          }),
        });
      } catch (err) {}
    }

    router.push('/loan/apply/partner-webview');
    setLoading(false);
  };

  return (
    <MobileContainer>
      <LoanHeader title="Select Lending Partner" stepNumber={11} backHref="/loan/apply/fee-payment" />

      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Scrollable Partner Cards Container */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-36 animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                Step 11 of 26
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                loanType === 'no_cibil'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : loanType === 'low_cibil'
                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {loanType === 'no_cibil'
                  ? '🔴 Without CIBIL Profile'
                  : loanType === 'low_cibil'
                  ? '🟠 Low CIBIL Profile'
                  : '🟢 High CIBIL Profile'}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">Matched Bank & NBFC Partners</h1>
            <p className="text-xs text-slate-500 font-medium">Select your preferred lender to lock your application & interest rate</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {fetching ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
              <p className="text-xs font-bold text-slate-600">Fetching live partner offers...</p>
            </div>
          ) : activePartners.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2 shadow-2xs">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Matched Lenders Available</p>
              <p className="text-xs text-slate-500">No active bank partners configured for this profile tier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePartners.map((partner) => {
                const isSelected = selectedPartner === partner.id || (selectedPartner === '' && partner === activePartners[0]);
                const displayRoi = loanType === 'low_cibil' ? (partner.low_cibil_roi || partner.roi) : (partner.high_cibil_roi || partner.roi);
                const displayAmount = loanType === 'low_cibil' ? (partner.low_cibil_amount || partner.amount) : (partner.high_cibil_amount || partner.amount);

                return (
                  <div
                    key={partner.id}
                    onClick={() => setSelectedPartner(partner.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-purple-600 shadow-md scale-[1.01]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                          isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md inline-block">
                              {partner.badge || 'RECOMMENDED'}
                            </span>
                            {loanType === 'no_cibil' ? (
                              <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <ShieldAlert className="w-2.5 h-2.5 text-rose-600" /> Without CIBIL Rate
                              </span>
                            ) : loanType === 'low_cibil' ? (
                              <span className="text-[9px] font-extrabold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <ShieldAlert className="w-2.5 h-2.5 text-orange-600" /> Low CIBIL Rate
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> High CIBIL Rate
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-black text-slate-900 mt-1 truncate">{partner.name}</h3>
                          <p className="text-xs font-extrabold text-purple-700 mt-0.5">{displayAmount}</p>
                          <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                            Interest Rate: <span className="text-slate-900 font-extrabold">{displayRoi}</span>
                          </p>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                        isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ACTION BUTTON INSIDE SCROLLABLE LIST */}
              <div className="pt-2">
                <button
                  onClick={handleConfirmPartner}
                  disabled={loading || activePartners.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Locking Lending Partner...</span>
                    </>
                  ) : (
                    <>
                      <span>Lock & Proceed to Lending Partner →</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileContainer>
  );
}

export default function SelectPartnerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading Lending Partners...</div>}>
      <SelectPartnerContent />
    </Suspense>
  );
}
