'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Camera,
  Lock,
  Upload,
  AlertCircle,
  FileCheck,
  Sparkles,
} from 'lucide-react';

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appId, setAppId] = useState<string | null>(null);
  const [appData, setAppData] = useState<any>(null);
  
  // Admin-configured timer state
  const [seconds, setSeconds] = useState<number>(180);
  const [timerInitialized, setTimerInitialized] = useState<boolean>(false);
  
  // Selfie upload states
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieSubmitted, setSelfieSubmitted] = useState<boolean>(false);
  const [submittingSelfie, setSubmittingSelfie] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to calculate persistent remaining seconds based on real timestamp
  const getRemainingSeconds = (id: string, configuredDuration: number = 180): number => {
    if (typeof window === 'undefined') return configuredDuration;

    const storageKey = `verification_start_time_${id}`;
    let startTimeStr = localStorage.getItem(storageKey);
    let startTime = startTimeStr ? parseInt(startTimeStr, 10) : 0;

    if (!startTime || isNaN(startTime)) {
      startTime = Date.now();
      localStorage.setItem(storageKey, startTime.toString());
    }

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, configuredDuration - elapsedSeconds);
    return remaining;
  };

  // Load active application ID
  useEffect(() => {
    async function loadApp() {
      const { appId: targetId } = await resolveTargetAppId(urlAppId, 'cash');
      if (targetId) setAppId(targetId);
    }
    loadApp();
  }, [urlAppId]);

  // Poll application status every 3 seconds & sync persistent timer
  useEffect(() => {
    if (!appId) return;

    let isMounted = true;
    const fetchAppStatus = async () => {
      try {
        const res = await apiRequest(`/loan/applications/${appId}`);
        if (res.data && isMounted) {
          setAppData(res.data);

          const configuredDuration = res.data.verification_timer_seconds ?? 180;
          const remaining = getRemainingSeconds(appId, configuredDuration);
          setSeconds(remaining);

          // Check if selfie already exists in database
          if (res.data.selfie_with_agent) {
            setSelfieSubmitted(true);
          }
        }
      } catch (err) {
        console.warn('Status polling error:', err);
      }
    };

    fetchAppStatus();
    const interval = setInterval(fetchAppStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [appId]);

  // Countdown Timer Interval (updates remaining seconds every 1s)
  useEffect(() => {
    if (!appId) return;

    const timer = setInterval(() => {
      const duration = appData?.verification_timer_seconds ?? 180;
      const remaining = getRemainingSeconds(appId, duration);
      setSeconds(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [appId, appData]);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Document Verification Status Flags
  const isDocAdminApproved =
    appData?.lender_status === 'proof_verified' ||
    appData?.status === 'proof_verified' ||
    appData?.final_decision === 'APPROVED';

  // Camera & Selfie Unlocked Condition: Timer is 0 OR Admin approved documents
  const isCameraUnlocked = seconds === 0 || isDocAdminApproved;

  // Final Disbursement Unlocked Condition: Selfie submitted AND Admin approved application
  const isApprovedByAdmin =
    appData?.final_decision === 'APPROVED' || appData?.status === 'approved';

  // Handle Selfie Image Selection
  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelfiePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Selfie with Agent to Backend
  const handleSubmitSelfie = async () => {
    if (!appId || !selfiePreview) {
      setErrorMsg('Please capture or choose a selfie photo first.');
      return;
    }

    setSubmittingSelfie(true);
    setErrorMsg('');

    try {
      const res = await apiRequest(`/loan/apply/${appId}/agent-selfie`, {
        method: 'POST',
        body: JSON.stringify({
          selfie_with_agent: selfiePreview,
          agent_selfie: selfiePreview,
        }),
      });

      if (res.data) {
        setAppData(res.data);
        setSelfieSubmitted(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload selfie. Please try again.');
    } finally {
      setSubmittingSelfie(false);
    }
  };

  // Proceed to Next Step (Disbursement Bank Details)
  const handleProceedToDisbursement = () => {
    router.push('/loan/apply/bank-details');
  };

  return (
    <MobileContainer>
      <LoanHeader title="Live Validation & Agent Selfie" stepNumber={16} backHref="/loan/apply/proof-submission" />

      <div className="p-4 space-y-4 pb-36 flex-1 overflow-y-auto min-h-0 animate-in fade-in duration-300">
        <div>
          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
            Step 16 of 26
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Live Application Verification</h1>
          <p className="text-xs text-slate-500 font-medium">
            Admin review SLA & Agent Selfie verification active
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TIMER & ADMIN REVIEW CLOCK BOX (Only shown while timer > 0 and not approved) */}
        {/* ==================================================================== */}
        {seconds > 0 && !isDocAdminApproved ? (
          <div className="bg-gradient-to-tr from-slate-950 via-indigo-950 to-purple-950 text-white p-5 rounded-3xl text-center space-y-3 shadow-lg border border-purple-900/40 relative overflow-hidden animate-in fade-in duration-300">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 shadow-inner">
              <Clock
                className="w-7 h-7 text-amber-300 animate-spin"
                style={{ animationDuration: '6s' }}
              />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                ADMIN VERIFICATION SLA TIMER
              </span>
              <h2 className="text-4xl font-black tracking-widest font-mono text-amber-400 mt-1">
                {formatTimer(seconds)}
              </h2>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs font-medium">
              <div className="flex items-center justify-center gap-1.5 text-amber-300 bg-amber-950/60 p-2 rounded-xl border border-amber-800/60">
                <Lock className="w-3.5 h-3.5" />
                <span>Admin is verifying submitted documents. Camera unlocks when timer ends or Admin approves.</span>
              </div>
            </div>
          </div>
        ) : (
          /* When timer reaches 00:00 (or Admin approved), dialer is removed and verified status is shown */
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300 shadow-xs">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 border border-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                DOCUMENTS VERIFIED
              </span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {isApprovedByAdmin
                  ? 'Application Fully Verified & Approved by Admin!'
                  : 'Documents verified by Admin ✓ Please take & upload your Selfie with Agent.'}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* AGENT SELFIE CAPTURE & UPLOAD SECTION */}
        {/* ==================================================================== */}
        <div
          className={`bg-white p-4 rounded-2xl border transition-all space-y-3 shadow-xs ${
            !isCameraUnlocked
              ? 'opacity-60 border-slate-200 pointer-events-none bg-slate-50'
              : selfieSubmitted
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-purple-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  selfieSubmitted
                    ? 'bg-emerald-500 text-white'
                    : isCameraUnlocked
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-300 text-slate-600'
                }`}
              >
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Selfie with Agent *</h3>
                <p className="text-[10px] text-slate-500 font-medium">Live picture verification with agent</p>
              </div>
            </div>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selfieSubmitted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isCameraUnlocked
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {selfieSubmitted
                ? 'Uploaded ✓'
                : isCameraUnlocked
                ? 'Camera Unlocked'
                : 'Locked 🔒'}
            </span>
          </div>

          {!isCameraUnlocked ? (
            /* LOCKED STATE NOTICE */
            <div className="p-4 text-center space-y-2 bg-slate-100/70 rounded-xl border border-slate-200">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Camera Access Locked</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Admin is currently verifying your submitted documents. Until the timer finishes or Admin approves, you cannot capture/upload selfie or proceed.
              </p>
            </div>
          ) : (
            /* UNLOCKED & INTERACTIVE CAMERA STATE */
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="user"
                onChange={handleSelfieSelect}
                className="hidden"
              />

              {/* Selfie Image Preview Box */}
              {selfiePreview || appData?.selfie_with_agent ? (
                <div className="relative w-full h-44 bg-slate-900 rounded-xl overflow-hidden border-2 border-purple-400 shadow-md group">
                  <img
                    src={selfiePreview || appData?.selfie_with_agent}
                    alt="Agent Selfie Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!selfieSubmitted && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-lg shadow-md"
                      >
                        Retake Photo
                      </button>
                    )}
                  </div>
                  {selfieSubmitted && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED SELFIE
                    </div>
                  )}
                </div>
              ) : (
                /* Camera Capture Button */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-md">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-purple-900">
                    Open Camera & Take Selfie with Agent
                  </span>
                  <span className="text-[10px] text-purple-600 font-medium">
                    Click to capture or choose photo
                  </span>
                </button>
              )}

              {/* Upload Selfie Button */}
              {selfiePreview && !selfieSubmitted && (
                <button
                  type="button"
                  onClick={handleSubmitSelfie}
                  disabled={submittingSelfie}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  {submittingSelfie ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Uploading Selfie to Admin...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Selfie with Agent for Final Review →</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* NEXT STEP ACTION BUTTON */}
        {/* ==================================================================== */}
        {!isCameraUnlocked ? (
          /* State 1: Locked Timer Running */
          <button
            disabled
            className="w-full py-4 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300"
          >
            <Lock className="w-4 h-4" />
            <span>Awaiting Admin Document Verification ({formatTimer(seconds)})...</span>
          </button>
        ) : !selfieSubmitted ? (
          /* State 2: Camera Unlocked but Selfie Not Submitted */
          <button
            disabled
            className="w-full py-4 bg-purple-100 text-purple-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-purple-200"
          >
            <Camera className="w-4 h-4" />
            <span>Take & Upload Agent Selfie First →</span>
          </button>
        ) : !isApprovedByAdmin ? (
          /* State 3: Selfie Submitted but Awaiting Admin Approval */
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-4 bg-amber-500/20 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2 animate-pulse"
            >
              <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
              <span>Selfie Submitted! Admin is verifying for instant approval...</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center font-medium">
              This page automatically updates as soon as Admin approves your application.
            </p>
          </div>
        ) : (
          /* State 4: Fully Approved by Admin! Proceed to Disbursement */
          <button
            onClick={handleProceedToDisbursement}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] border border-emerald-400/40"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Proceed to Disbursement Bank Details →</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </MobileContainer>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading Selfie Verification...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
