'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
  RefreshCw,
  Building2,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Sparkles,
  IndianRupee,
  Phone,
  Mail,
  Home,
} from 'lucide-react';

function UrgentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get('id');

  const [appId, setAppId] = useState<string | null>(urlAppId);
  const [appData, setAppData] = useState<any>(null);
  const [stageInfo, setStageInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Additional Docs upload state
  const [additionalFiles, setAdditionalFiles] = useState<{ [key: string]: { name: string; uploaded: boolean; base64?: string } }>({});
  const [userRemarks, setUserRemarks] = useState<string>('');
  const [submittingDocs, setSubmittingDocs] = useState<boolean>(false);
  const [docsMsg, setDocsMsg] = useState<string>('');

  const fetchStatus = async (targetId: string) => {
    try {
      const res = await apiRequest(`/loan/urgent-construction/${targetId}`);
      if (res && res.data) {
        setAppData(res.data);
        if (res.stage_info) setStageInfo(res.stage_info);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch application status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (urlAppId) {
        setAppId(urlAppId);
        fetchStatus(urlAppId);
      } else {
        try {
          const res = await apiRequest('/loan/urgent-construction/active');
          if (res && res.data) {
            setAppId(res.data.id);
            setAppData(res.data);
            if (res.stage_info) setStageInfo(res.stage_info);
          }
        } catch (err) {} finally {
          setLoading(false);
        }
      }
    }
    init();
  }, [urlAppId]);

  // Real-time polling every 3.5 seconds
  useEffect(() => {
    if (!appId) return;
    const interval = setInterval(() => {
      fetchStatus(appId);
    }, 3500);
    return () => clearInterval(interval);
  }, [appId]);

  const handleAdditionalFileUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAdditionalFiles((prev) => ({
        ...prev,
        [docKey]: {
          name: file.name,
          uploaded: true,
          base64: event.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAdditionalDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    if (Object.keys(additionalFiles).length === 0 && !userRemarks.trim()) {
      alert('Please upload the requested document(s) before submitting.');
      return;
    }

    setSubmittingDocs(true);
    setDocsMsg('');

    try {
      const res = await apiRequest(`/loan/urgent-construction/${appId}/additional-docs`, {
        method: 'POST',
        body: JSON.stringify({
          submitted_docs: additionalFiles,
          user_remarks: userRemarks.trim(),
        }),
      });

      if (res && res.data) {
        setAppData(res.data);
        setDocsMsg('Additional documents submitted successfully! Admin will review shortly.');
        setAdditionalFiles({});
        setUserRemarks('');
        fetchStatus(appId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit documents.');
    } finally {
      setSubmittingDocs(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Urgent Application Status...</p>
      </div>
    );
  }

  if (!appData && !loading) {
    return (
      <MobileContainer>
        <LoanHeader title="Urgent Loan Status" stepNumber={3} backHref="/loan/apply/construction-loan" />
        <div className="p-6 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-black text-slate-900">No Active Urgent Loan Found</h2>
          <p className="text-xs text-slate-500">You do not have any urgent construction loan in progress.</p>
          <button
            onClick={() => router.push('/loan/apply/construction-loan/urgent')}
            className="px-4 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs"
          >
            Apply for Urgent Construction Loan →
          </button>
        </div>
      </MobileContainer>
    );
  }

  const currentStage = appData?.urgent_stage || appData?.status || 'under_review';

  // 8 Process Stages Matrix
  const processStages = [
    { key: 'under_review', title: 'Under Review', subtitle: 'Admin Verification Pending' },
    { key: 'docs_required', title: 'Documents Required', subtitle: 'Additional Documents Needed' },
    { key: 'file_created', title: 'File Created', subtitle: 'Loan File Generated' },
    { key: 'technical_verification', title: 'Technical Verification', subtitle: 'Property Verification Running' },
    { key: 'bank_processing', title: 'Bank Processing', subtitle: 'Bank Review Stage' },
    { key: 'sanction_approved', title: 'Sanction Approved', subtitle: 'Loan Approved' },
    { key: 'disbursement_pending', title: 'Disbursement Pending', subtitle: 'Payment Processing' },
    { key: 'amount_released', title: 'Amount Released', subtitle: 'Loan Disbursed' },
  ];

  const getStageIndex = (stageKey: string) => {
    if (stageKey === 'rejected') return -1;
    const idx = processStages.findIndex((s) => s.key === stageKey);
    return idx >= 0 ? idx : 0;
  };

  const activeIndex = getStageIndex(currentStage);
  const isRejected = currentStage === 'rejected';
  const isApproved = currentStage === 'sanction_approved' || currentStage === 'amount_released' || currentStage === 'disbursement_pending';

  return (
    <MobileContainer>
      <LoanHeader title="Urgent Loan Status" stepNumber={3} backHref="/loan/apply/construction-loan" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Top Status Banner */}
        <div
          className={`p-5 rounded-3xl text-white shadow-md relative overflow-hidden space-y-2 border-2 ${
            isRejected
              ? 'bg-gradient-to-br from-rose-900 via-red-950 to-slate-900 border-rose-500/40'
              : isApproved
              ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 border-emerald-400/40'
              : currentStage === 'docs_required'
              ? 'bg-gradient-to-br from-rose-800 via-orange-900 to-slate-900 border-rose-400/40'
              : 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 border-amber-400/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1 border border-white/20">
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" /> Urgent Construction Loan
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-200 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
              #{appData?.application_number || `UCL-${appId}`}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-center gap-2">
              {isRejected ? (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              ) : isApproved ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : currentStage === 'docs_required' ? (
                <AlertTriangle className="w-6 h-6 text-rose-300 shrink-0" />
              ) : (
                <Clock className="w-6 h-6 text-amber-300 shrink-0 animate-pulse" />
              )}
              <h2 className="text-xl font-black">{stageInfo?.status_title || 'Under Review'}</h2>
            </div>
            <p className="text-xs text-slate-200 font-semibold mt-1">
              {stageInfo?.status_subtitle || 'Admin Verification Pending'}
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span>Requested Amount: <strong className="text-white font-bold">₹{Number(appData?.required_amount || 0).toLocaleString('en-IN')}</strong></span>
            <span>Fee Status: <strong className="text-emerald-300 font-bold">{appData?.fee_payment_status === 'approved' ? 'Verified ✓' : 'Submitted'}</strong></span>
          </div>
        </div>

        {/* REJECTION ALERT IF REJECTED */}
        {isRejected && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl space-y-1">
            <p className="text-xs font-black flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Application Not Approved
            </p>
            <p className="text-xs text-rose-700">
              Reason: {appData?.rejection_reason || 'Application does not meet current urgent construction criteria.'}
            </p>
          </div>
        )}

        {/* ADDITIONAL DOCUMENTS REQUIRED UPLOAD FORM */}
        {currentStage === 'docs_required' && (
          <div className="bg-rose-50/80 border-2 border-rose-300 rounded-3xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-xs font-black">Action Required: Upload Additional Documents</h3>
                <p className="text-[11px] text-rose-700 font-medium">
                  {appData?.proof_remarks || appData?.additional_docs_request || 'Admin has requested additional verification documents.'}
                </p>
              </div>
            </div>

            {docsMsg && (
              <div className="p-2 bg-emerald-100 text-emerald-900 text-xs rounded-xl font-bold">
                {docsMsg}
              </div>
            )}

            <form onSubmit={handleSubmitAdditionalDocs} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Additional Property Doc / Khata', 'Updated Bank Statement', 'Co-Applicant KYC', 'Other Document'].map((label, i) => {
                  const key = `additional_doc_${i + 1}`;
                  const isUploaded = !!additionalFiles[key]?.uploaded;
                  return (
                    <div key={key} className="p-2.5 bg-white border border-rose-200 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{label}</span>
                      {isUploaded ? (
                        <span className="text-[10px] font-black text-emerald-700">Uploaded ✓</span>
                      ) : (
                        <label className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Attach</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleAdditionalFileUpload(key, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Remarks / Clarification for Admin</label>
                <input
                  type="text"
                  value={userRemarks}
                  onChange={(e) => setUserRemarks(e.target.value)}
                  placeholder="Optional message regarding uploaded documents"
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingDocs}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                {submittingDocs ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Documents...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Submit Additional Documents</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 8-STAGE WORKFLOW TIMELINE TRACKER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900">Application Progress Pipeline</h3>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Live Tracker
            </span>
          </div>

          <div className="space-y-3">
            {processStages.map((stage, idx) => {
              const isCompleted = activeIndex > idx;
              const isCurrent = activeIndex === idx;
              return (
                <div key={stage.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    {idx < processStages.length - 1 && (
                      <div
                        className={`w-0.5 h-6 my-0.5 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>

                  <div className="pt-0.5">
                    <p
                      className={`text-xs font-black ${
                        isCurrent
                          ? 'text-amber-600'
                          : isCompleted
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      {stage.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* APPLICATION SUMMARY CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
            Application Overview
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Applicant</span>
              <span className="font-bold text-slate-900">{appData?.full_name}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Contact</span>
              <span className="font-mono font-bold text-slate-900">{appData?.mobile_number}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Property Type</span>
              <span className="font-bold text-slate-900">{appData?.property_type}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Disbursement Bank</span>
              <span className="font-bold text-slate-900">{appData?.bank_name}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5 text-xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Site Address</span>
            <span className="text-slate-700 font-medium leading-tight block">
              {appData?.property_address}, {appData?.property_city} - {appData?.property_pincode}
            </span>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function UrgentStatusPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading Application Status...</div>}>
      <UrgentStatusContent />
    </Suspense>
  );
}
