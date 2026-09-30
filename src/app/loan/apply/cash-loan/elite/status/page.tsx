'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Upload,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  XCircle,
  FileCheck2,
  Zap,
} from 'lucide-react';

function EliteStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('id') || searchParams.get('app_id');

  const [appId, setAppId] = useState<string | null>(appIdParam);
  const [appData, setAppData] = useState<any>(null);
  const [stageInfo, setStageInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Additional Docs Upload State
  const [additionalDocs, setAdditionalDocs] = useState<{ [key: string]: { name: string; preview: string } }>({});
  const [userRemarks, setUserRemarks] = useState<string>('');
  const [uploadingDocs, setUploadingDocs] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchStatus = async (isManual = false) => {
    const targetId = appIdParam || (typeof window !== 'undefined' ? localStorage.getItem('active_elite_loan_app_id') : null);
    if (!targetId) {
      setLoading(false);
      return;
    }
    setAppId(targetId);
    if (isManual) setRefreshing(true);

    try {
      const res = await apiRequest(`/loan/elite-cash/${targetId}`);
      if (res && res.data) {
        setAppData(res.data);
        setStageInfo(res.stage_info);
      }
    } catch (err) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Live polling every 10 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [appIdParam]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAdditionalDocs((prev) => ({
        ...prev,
        [key]: {
          name: file.name,
          preview: event.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalDocsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    if (Object.keys(additionalDocs).length === 0) {
      setErrorMsg('Please select at least one document to upload.');
      return;
    }

    setUploadingDocs(true);
    setErrorMsg('');
    try {
      const res = await apiRequest(`/loan/elite-cash/${appId}/additional-docs`, {
        method: 'POST',
        body: JSON.stringify({
          submitted_docs: additionalDocs,
          user_remarks: userRemarks,
        }),
      });

      if (res && res.data) {
        setUploadSuccessMsg('Additional documents submitted successfully! Your application is now back under admin review.');
        setAdditionalDocs({});
        setUserRemarks('');
        fetchStatus(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingDocs(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Fetching Live Application Status...</p>
      </div>
    );
  }

  const currentStage = appData?.urgent_stage || appData?.status || 'under_review';
  const isRejected = currentStage === 'rejected';
  const isDocsRequired = currentStage === 'docs_required';

  const stagesList = [
    { key: 'under_review', title: 'Under Review', subtitle: 'Admin Verification Pending' },
    { key: 'file_created', title: 'File Created', subtitle: 'Loan File Generated' },
    { key: 'technical_verification', title: 'Technical Verification', subtitle: 'Express Risk Verification' },
    { key: 'bank_processing', title: 'Bank Processing', subtitle: 'Disbursement Bank Processing' },
    { key: 'sanction_approved', title: 'Sanction Approved', subtitle: 'Elite Loan Approved' },
    { key: 'disbursement_pending', title: 'Disbursement Pending', subtitle: 'Express Transfer Initiated' },
    { key: 'amount_released', title: 'Amount Released', subtitle: 'Loan Disbursed' },
  ];

  const getStageStatus = (stageKey: string) => {
    const stageOrder = [
      'fee_payment_pending',
      'under_review',
      'docs_required',
      'file_created',
      'technical_verification',
      'bank_processing',
      'sanction_approved',
      'disbursement_pending',
      'amount_released',
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    const targetIndex = stageOrder.indexOf(stageKey);

    if (currentStage === stageKey) return 'active';
    if (currentIndex > targetIndex) return 'completed';
    return 'pending';
  };

  return (
    <MobileContainer>
      <LoanHeader title="Application Status Tracker" stepNumber={4} backHref="/dashboard" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Status Header Banner */}
        <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-purple-500/30 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 fill-slate-950" /> Elite Cash Loan
            </span>
            <button
              onClick={() => fetchStatus(true)}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-purple-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div>
            <span className="text-[10px] font-mono text-purple-200 font-bold block mb-1">
              Application Ref: #{appData?.application_number || `ECL-${appId}`}
            </span>
            <h1 className="text-xl font-black text-white">
              {stageInfo?.status_title || 'Under Review'}
            </h1>
            <p className="text-xs text-purple-200 font-medium mt-0.5">
              {stageInfo?.status_subtitle || 'Admin Verification Pending'}
            </p>
          </div>

          {/* Under Review Notice Message */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3 text-xs text-purple-100 flex items-start gap-2 backdrop-blur-xs">
            <Clock className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
            <span>
              Your application has been submitted successfully and is awaiting admin verification.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
            <div>
              <span className="text-[10px] font-bold text-purple-300 block uppercase">Requested Amount</span>
              <span className="font-mono font-black text-base text-white">
                ₹{Number(appData?.required_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-300 block uppercase">Fee Payment</span>
              <span className="font-mono font-black text-xs text-emerald-400">
                {appData?.transaction_id ? `UTR: ${appData.transaction_id}` : 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Alert if Documents Required */}
        {isDocsRequired && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-4 space-y-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                  Additional Documents Required by Admin
                </h3>
                <p className="text-xs text-rose-800 mt-1 font-medium">
                  {appData?.additional_docs_request || 'Please upload additional requested verification documents.'}
                </p>
                {appData?.proof_remarks && (
                  <p className="text-[11px] text-rose-700 italic mt-0.5">
                    Admin note: "{appData.proof_remarks}"
                  </p>
                )}
              </div>
            </div>

            {uploadSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
                {uploadSuccessMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-900 text-xs rounded-xl font-bold">
                {errorMsg}
              </div>
            )}

            {/* Document Upload Form */}
            <form onSubmit={handleAdditionalDocsSubmit} className="space-y-3 pt-2 border-t border-rose-200">
              <div className="space-y-2">
                {[
                  { key: 'additional_bank_stmt', label: 'Updated Bank Statement / Salary Slip' },
                  { key: 'additional_id_proof', label: 'Additional ID / Address Proof' },
                  { key: 'additional_income_proof', label: 'Employer ID / Income Tax Proof' },
                ].map((d) => (
                  <div key={d.key} className="flex items-center justify-between bg-white border border-rose-200 rounded-xl p-2.5">
                    <span className="text-xs font-bold text-slate-800 truncate mr-2">{d.label}</span>
                    <label className="shrink-0 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, d.key)}
                      />
                      <div className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs">
                        {additionalDocs[d.key] ? (
                          <span className="text-white font-black truncate max-w-[100px]">
                            ✓ {additionalDocs[d.key].name}
                          </span>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Remarks (Optional)</label>
                <input
                  type="text"
                  value={userRemarks}
                  onChange={(e) => setUserRemarks(e.target.value)}
                  placeholder="Notes for the review team..."
                  className="w-full mt-1 px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDocs || Object.keys(additionalDocs).length === 0}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:bg-slate-300"
              >
                {uploadingDocs ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Documents...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Requested Documents</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 8-STAGE PROGRESS TIMELINE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Live Application Stages
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Real-time Tracker
            </span>
          </div>

          <div className="space-y-4 relative pl-3">
            {/* Left Vertical Line */}
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-slate-200" />

            {stagesList.map((st, idx) => {
              const status = getStageStatus(st.key);
              const isCurrent = status === 'active';
              const isPast = status === 'completed';

              return (
                <div key={st.key} className="flex items-start gap-3.5 relative z-10">
                  {/* Status Indicator */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isPast
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-purple-700 border-purple-400 text-white shadow-md animate-pulse ring-4 ring-purple-100'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-[11px] font-black">{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Content */}
                  <div
                    className={`flex-1 p-2.5 rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-purple-50/80 border border-purple-200'
                        : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-xs font-black ${
                          isCurrent
                            ? 'text-purple-950'
                            : isPast
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {st.title}
                      </h3>
                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase bg-purple-700 text-white px-2 py-0.5 rounded-full shadow-2xs">
                          In Progress
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[9px] font-bold text-emerald-700">
                          Completed ✓
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isCurrent
                          ? 'text-purple-800 font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {st.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/loan/track')}
            className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-2xl shadow-2xs text-center"
          >
            Track by Loan ID
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl shadow-md text-center"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function EliteStatusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Application Status...</div>}>
      <EliteStatusContent />
    </Suspense>
  );
}
