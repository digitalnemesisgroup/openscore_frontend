'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, CreditCard, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, Clock, Lock, AlertCircle, QrCode } from 'lucide-react';

function ConstructionFeePaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [txId, setTxId] = useState('');
  const [submittedTxId, setSubmittedTxId] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [isVerifiedByAdmin, setIsVerifiedByAdmin] = useState(false);
  const [assignedTier, setAssignedTier] = useState<string>('');
  const [error, setError] = useState('');

  const checkAppStatus = async (id: string) => {
    try {
      const res = await apiRequest(`/loan/applications/${id}`);
      if (res && res.data) {
        const app = res.data;
        setAppData(app);
        if (app.transaction_id) {
          setSubmittedTxId(app.transaction_id);
        }

        const feeStatus = (app.fee_payment_status || '').toLowerCase();
        const mainStatus = (app.status || '').toLowerCase();
        const lType = (app.loan_type || '').toLowerCase();

        const isTierAssigned = lType.includes('low_cibil') || lType.includes('good_cibil') || mainStatus === 'cibil_tier_assigned';
        // Strictly check if admin approved fee payment
        const isApproved = feeStatus === 'approved' || app.payment_status === 'approved' || mainStatus === 'submitted_to_partners';
        const isSubmitted = !!app.transaction_id || app.payment_status === 'paid' || app.payment_status === 'pending_verification' || feeStatus.includes('pending') || feeStatus.includes('submitted') || feeStatus.includes('paid');

        if (isTierAssigned) {
          setAssignedTier(lType.includes('low_cibil') ? 'Low CIBIL (Orange Zone)' : 'High CIBIL (Green Zone)');
        }

        if (isApproved) {
          setIsVerifiedByAdmin(true);
          setPaymentSubmitted(true);
        } else if (isSubmitted) {
          setPaymentSubmitted(true);
          setIsVerifiedByAdmin(false);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (appId) {
      checkAppStatus(appId);
      setLoading(false);
    } else {
      const savedAppId = typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null;
      if (savedAppId) {
        checkAppStatus(savedAppId);
      }
      setLoading(false);
    }
  }, [appId]);

  // Poll DB status every 4 seconds if payment submitted but pending admin verification
  useEffect(() => {
    const targetId = appId || (typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null);
    if (!targetId || !paymentSubmitted || isVerifiedByAdmin) return;

    const interval = setInterval(() => {
      checkAppStatus(targetId);
    }, 4000);

    return () => clearInterval(interval);
  }, [appId, paymentSubmitted, isVerifiedByAdmin]);

  const handleSubmitPayment = async () => {
    const targetId = appId || (typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null);
    if (!targetId) return;
    if (!txId || txId.trim().length < 6) {
      setError('Please enter a valid 12-Digit Transaction / UTR reference number.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await apiRequest(`/loan/apply/${targetId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: txId.trim(),
          payment_status: 'paid_pending_admin_verification',
          fee_payment_status: 'Submitted (Pending Admin Verification)',
        }),
      });

      if (res.data) {
        setSubmittedTxId(txId.trim());
        setPaymentSubmitted(true);
        const feeStat = (res.data.fee_payment_status || res.data.payment_status || '').toLowerCase();
        if (feeStat === 'approved' || res.data.status?.includes('submitted') || res.data.status?.includes('approved')) {
          setIsVerifiedByAdmin(true);
        } else {
          checkAppStatus(targetId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error processing payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToNextStep = () => {
    const targetId = appId || (typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null);
    if (!isVerifiedByAdmin) {
      setError('Your application fee payment is pending verification. Please submit payment details to proceed.');
      return;
    }
    router.push(`/loan/apply/construction-loan/select-partner${targetId ? `?id=${targetId}` : ''}`);
  };

  const feeAmount = Number(appData?.processing_fee || appData?.fee_amount || 999);
  const upiId = 'flipflops@upi';
  const constructionQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=OpenScore%20Finance&am=${feeAmount}&cu=INR`)}`;

  const isWithoutCibil = (appData?.loan_type || '').includes('no_cibil');

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Construction Payment Gateway...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Construction Loan Fee & Verification</span>
        </div>
        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
          Step 5 of 26
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment Summary Box */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl space-y-2 text-center">
        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
          CONSTRUCTION LOAN FILE PROCESSING FEE
        </span>
        <h2 className="text-3xl font-black text-emerald-300">₹{feeAmount.toLocaleString('en-IN')}.00</h2>
        <p className="text-xs text-emerald-100 font-medium">Nominal application fee for partner identification & review</p>
      </div>

      {!paymentSubmitted ? (
        <>
          {/* QR Code Container */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-2 border-2 border-emerald-300 relative shadow-inner">
              {/* eslint-disable-next-html-link */}
              <img
                src={constructionQrUrl}
                alt="UPI QR Code"
                className="w-44 h-44 object-contain rounded-xl"
              />
              <span className="absolute -bottom-3 text-[9px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                SCAN & PAY WITH ANY UPI APP
              </span>
            </div>

            <div className="pt-2 text-center space-y-1">
              <p className="text-[11px] font-medium text-slate-500">Official UPI ID for Direct Transfer:</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-800 font-mono font-bold text-xs border border-slate-200">
                <span>{upiId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(upiId);
                    alert('UPI ID flipflops@upi copied to clipboard!');
                  }}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-sans font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex justify-center gap-2 text-[11px] font-bold text-slate-600 pt-1">
              <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">GPay</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">PhonePe</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Paytm</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">BHIM UPI</span>
            </div>
          </div>

          {/* Transaction ID Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Enter 12-Digit UPI UTR / Transaction ID *
            </label>
            <input
              type="text"
              required
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="e.g. 425896314785"
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmitPayment}
            disabled={submitting || !txId}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Payment Details...</span>
              </>
            ) : (
              <>
                <span>Submit Fee Payment for Admin Verification →</span>
              </>
            )}
          </button>
        </>
      ) : (
        /* Payment Submitted — Admin Verification & CIBIL Assignment Gate */
        <div className="space-y-4">
          {!isVerifiedByAdmin ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-center space-y-3 shadow-md animate-pulse">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-300">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                  PAYMENT SUBMITTED — WAITING FOR ADMIN REVIEW
                </span>
                <h3 className="text-base font-black text-amber-950 mt-2">
                  {isWithoutCibil
                    ? 'Without CIBIL Application & Fee Under Admin Review'
                    : 'Admin Verification Pending'}
                </h3>
                <p className="text-xs text-amber-900 font-mono font-bold mt-1">
                  Transaction Ref: {submittedTxId || txId}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  {isWithoutCibil
                    ? 'Your details & processing fee have been submitted. OpenScore Admin is evaluating your credit profile to approve and assign your application under Low CIBIL or High CIBIL loan tier.'
                    : 'Your fee payment has been submitted successfully. Admin is verifying your payment. Once approved, the button below will unlock automatically.'}
                </p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Auto-checking Admin status every 4 seconds...</span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 text-center space-y-3 shadow-md">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  VERIFIED & APPROVED BY ADMIN
                </span>
                <h3 className="text-base font-black text-emerald-950 mt-2">
                  Processing Fee Payment Approved!
                </h3>
                {assignedTier && (
                  <p className="text-xs font-extrabold text-emerald-700 bg-emerald-100 p-2 rounded-xl mt-1">
                    Assigned Loan Category: {assignedTier}
                  </p>
                )}
                <p className="text-xs text-emerald-800 font-medium mt-2 leading-relaxed">
                  Your application & fee payment have been verified by OpenScore Admin. You can now proceed to select your matched Housing Finance NBFC partners.
                </p>
              </div>
            </div>
          )}

          {/* ACTION BUTTON — LOCKED UNTIL ADMIN VERIFICATION */}
          <button
            onClick={handleProceedToNextStep}
            disabled={!isVerifiedByAdmin}
            className={`w-full py-4 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
              isVerifiedByAdmin
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            {!isVerifiedByAdmin ? (
              <>
                <Lock className="w-4 h-4 text-slate-200" />
                <span>Proceed to Housing Partners (Locked — Pending Admin Review)</span>
              </>
            ) : (
              <>
                <span>Proceed to Select Housing Partners →</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ConstructionFeePaymentPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Fee Payment" stepNumber={5} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading payment form...</div>}>
          <ConstructionFeePaymentForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}
