'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import { QrCode, ShieldCheck, CheckCircle2, ArrowRight, RefreshCw, Clock, Lock, AlertCircle, Copy, Check, Upload, Image as ImageIcon, Trash2, Eye } from 'lucide-react';

function FeePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appId, setAppId] = useState<string | null>(null);
  const [appData, setAppData] = useState<any>(null);
  const [txId, setTxId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [isVerifiedByAdmin, setIsVerifiedByAdmin] = useState(false);
  const [loanType, setLoanType] = useState<'without_cibil' | 'low_cibil' | 'good_cibil'>('low_cibil');
  const [submittedTxId, setSubmittedTxId] = useState('');
  const [submittedScreenshot, setSubmittedScreenshot] = useState('');
  const [copied, setCopied] = useState(false);

  // Handle Screenshot Upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Screenshot size must be under 10MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPaymentScreenshot(base64);
    };
    reader.readAsDataURL(file);
  };

  // Check application status and verify fee status from DB
  const checkAppStatus = async (id: string) => {
    try {
      const res = await apiRequest(`/loan/applications/${id}`);
      if (res.data) {
        const app = res.data;
        setAppData(app);
        const lType = (app.loan_type || '').toLowerCase();
        const cType = (app.cibil_type || '').toLowerCase();
        if (lType.includes('good') || lType.includes('high') || cType.includes('good') || cType.includes('high')) {
          setLoanType('good_cibil');
        } else if (lType.includes('without') || lType.includes('no_cibil') || cType.includes('without') || cType.includes('no_cibil')) {
          setLoanType('without_cibil');
        } else {
          setLoanType('low_cibil');
        }
        if (app.transaction_id) {
          setSubmittedTxId(app.transaction_id);
        }
        if (app.payment_screenshot) {
          setSubmittedScreenshot(app.payment_screenshot);
        }

        const feeStatus = (app.fee_payment_status || app.payment_status || '').toLowerCase();
        const mainStatus = (app.status || '').toLowerCase();
        
        // Strict Admin Verification Check
        const isApproved = feeStatus === 'approved' || (mainStatus === 'submitted_to_partners' || mainStatus === 'proof_pending' || mainStatus === 'approved' || mainStatus === 'disbursed');
        const isSubmitted = !!app.transaction_id || app.payment_status === 'paid' || feeStatus.includes('submitted') || feeStatus.includes('pending');

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
    async function loadApp() {
      const { appId: targetId } = await resolveTargetAppId(urlAppId, 'cash');
      if (targetId) {
        setAppId(targetId);
        checkAppStatus(targetId);
      }
    }

    loadApp();
  }, [urlAppId]);

  // Poll DB status every 3 seconds if payment is submitted but not verified yet
  useEffect(() => {
    if (!appId || !paymentSubmitted || isVerifiedByAdmin) return;

    const interval = setInterval(() => {
      checkAppStatus(appId);
    }, 3000);

    return () => clearInterval(interval);
  }, [appId, paymentSubmitted, isVerifiedByAdmin]);

  const handleSubmitPayment = async () => {
    if (!appId) return;
    if (!txId || txId.trim().length < 6) {
      setError('Please enter a valid 12-Digit Transaction / UTR reference number.');
      return;
    }
    if (!paymentScreenshot) {
      setError('Please upload a screenshot of your successful UPI payment for Admin Verification.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await apiRequest(`/loan/apply/${appId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: txId.trim(),
          payment_screenshot: paymentScreenshot,
          payment_status: 'pending_verification',
          fee_payment_status: 'pending_approval',
        }),
      });

      if (res.data) {
        setSubmittedTxId(txId.trim());
        setSubmittedScreenshot(paymentScreenshot);
        setPaymentSubmitted(true);
        setIsVerifiedByAdmin(false); // ALWAYS require admin approval first!
      }
    } catch (err: any) {
      setError(err.message || 'Payment submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const [feeConfig, setFeeConfig] = useState<any>({
    upi_id: 'flipflops@upi',
    upi_payee_name: 'OpenScore Finance',
    cash_loan_without_cibil_fee_type: 'fixed',
    cash_loan_without_cibil_fee_value: 999,
    cash_loan_low_cibil_fee_type: 'fixed',
    cash_loan_low_cibil_fee_value: 999,
    cash_loan_high_cibil_fee_type: 'fixed',
    cash_loan_high_cibil_fee_value: 499,
  });

  useEffect(() => {
    async function fetchFeeConfig() {
      try {
        const res = await apiRequest('/settings/fee-config');
        if (res && res.data) {
          setFeeConfig(res.data);
        }
      } catch (err) {}
    }
    fetchFeeConfig();
  }, []);

  const handleProceedToNextStep = () => {
    if (!isVerifiedByAdmin) {
      setError('Your processing fee payment is pending Admin verification. Please wait for admin approval.');
      return;
    }
    const targetId = appId || (typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null);
    router.push(targetId ? `/loan/apply/select-partner?id=${targetId}` : '/loan/apply/select-partner');
  };

  // Priority: 1. Application-specific fee set by admin -> 2. Global fee config (3 tiers & fixed vs %)
  let calculatedFee = 999;
  if (appData?.processing_fee || appData?.fee_amount) {
    calculatedFee = Number(appData.processing_fee || appData.fee_amount);
  } else if (feeConfig) {
    let feeType = 'fixed';
    let rateOrVal = 999;

    if (loanType === 'good_cibil') {
      feeType = feeConfig.cash_loan_high_cibil_fee_type || feeConfig.cash_loan_fee_type || 'fixed';
      rateOrVal = Number(feeConfig.cash_loan_high_cibil_fee_value ?? feeConfig.cash_loan_good_cibil_fee_value ?? 499);
    } else if (loanType === 'without_cibil') {
      feeType = feeConfig.cash_loan_without_cibil_fee_type || feeConfig.cash_loan_fee_type || 'fixed';
      rateOrVal = Number(feeConfig.cash_loan_without_cibil_fee_value ?? feeConfig.cash_loan_fee_value ?? 999);
    } else {
      feeType = feeConfig.cash_loan_low_cibil_fee_type || feeConfig.cash_loan_fee_type || 'fixed';
      rateOrVal = Number(feeConfig.cash_loan_low_cibil_fee_value ?? 999);
    }

    if (feeType === 'percentage') {
      const principal = Number(appData?.required_amount || appData?.applied_amount || 50000);
      calculatedFee = Math.max(1, Math.round(principal * (rateOrVal / 100)));
    } else {
      calculatedFee = rateOrVal;
    }
  }

  const upiId = appData?.payment_upi_id || appData?.upi_id || feeConfig?.upi_id || 'flipflops@upi';
  const payeeName = appData?.upi_payee_name || feeConfig?.upi_payee_name || 'OpenScore Finance';
  const feeAmountNumber = calculatedFee;
  const feeAmount = `₹${feeAmountNumber.toLocaleString('en-IN')}.00`;
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${feeAmountNumber}&cu=INR`;
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };


  return (
    <MobileContainer>
      <LoanHeader title="Processing Fee Payment" stepNumber={10} backHref="/loan/apply/indicative-calculator" />

      <div className="p-4 space-y-4 flex-1 animate-in fade-in duration-300 pb-36 overflow-y-auto">
        <div>
          <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
            Step 10 of 26
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Processing Fee Payment</h1>
          <p className="text-xs text-slate-500 font-medium">Nominal application fee for partner identification & review</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Box */}
        <div className="bg-gradient-to-tr from-purple-800 via-indigo-800 to-blue-800 text-white p-5 rounded-3xl shadow-md text-center space-y-1 relative overflow-hidden">
          <span className="text-[10px] font-extrabold uppercase text-purple-200 tracking-wider">
            APPLICABLE PROCESSING FEE
          </span>
          <h2 className="text-3xl font-black">{feeAmount}</h2>
          <p className="text-[11px] text-purple-100 flex items-center justify-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Secure Transaction • Admin Verification Required
          </p>
        </div>

        {!paymentSubmitted ? (
          <>
            {/* QR Code Container */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-2 border-2 border-purple-300 relative shadow-inner">
                {/* eslint-disable-next-html-link */}
                <img
                  src={qrCodeImgUrl}
                  alt="UPI QR Code"
                  className="w-44 h-44 object-contain rounded-xl"
                />
                <span className="absolute -bottom-3 text-[9px] font-black bg-purple-600 text-white px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  SCAN & PAY WITH ANY UPI APP
                </span>
              </div>

              <div className="pt-2 text-center space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Official UPI ID for Direct Transfer:</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-800 font-mono font-bold text-xs border border-slate-200">
                  <span>{upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {copied && <p className="text-[10px] text-emerald-600 font-bold">UPI ID Copied to clipboard!</p>}
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
                className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {/* Payment Screenshot Upload */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Upload Payment Screenshot / Receipt *
                </label>
                <span className="text-[10px] text-slate-500 font-semibold">PNG, JPG up to 10MB</span>
              </div>

              {!paymentScreenshot ? (
                <label className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-purple-700 hover:underline">Click to Upload Payment Screenshot</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Take a screenshot of UPI success screen & attach here</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-3 bg-white border border-purple-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative">
                      {/* eslint-disable-next-html-link */}
                      <img
                        src={paymentScreenshot}
                        alt="Payment Screenshot"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Screenshot Attached</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Ready for Admin Verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(true)}
                      className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Preview Screenshot"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentScreenshot('')}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitPayment}
              disabled={submitting || !txId || !paymentScreenshot}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Payment Details...</span>
                </>
              ) : (
                <>
                  <span>Submit Payment for Admin Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          /* Payment Submitted State — Admin Verification Gate */
          <div className="space-y-4">
            {!isVerifiedByAdmin ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-center space-y-3 shadow-md animate-pulse">
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto border border-amber-300">
                  <Clock className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                    PAYMENT SUBMITTED — WAITING FOR ADMIN VERIFICATION
                  </span>
                  <h3 className="text-base font-black text-amber-950 mt-2">
                    Admin Verification Pending
                  </h3>
                  <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                    Transaction Ref: <span className="font-mono font-bold">{submittedTxId || txId}</span>
                  </p>

                  {(submittedScreenshot || paymentScreenshot) && (
                    <div className="mt-3 p-2 bg-white rounded-xl border border-amber-200 inline-flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        {/* eslint-disable-next-html-link */}
                        <img
                          src={submittedScreenshot || paymentScreenshot}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">Payment Screenshot Attached</span>
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="text-purple-600 hover:underline text-[10px] font-bold ml-1 cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                    Your payment details and screenshot have been submitted successfully. Admin is verifying your payment. Once approved, the button below will unlock automatically.
                  </p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Auto-checking Admin Verification status every 3 seconds...</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 text-center space-y-3 shadow-md">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto border border-emerald-300">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                    PAYMENT VERIFIED BY ADMIN
                  </span>
                  <h3 className="text-base font-black text-emerald-950 mt-2">
                    Processing Fee Payment Approved!
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium mt-1">
                    Your fee payment has been verified by OpenScore Admin. You can now proceed to select your matched Bank & NBFC partners.
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
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 active:scale-[0.99] cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              {!isVerifiedByAdmin ? (
                <>
                  <Lock className="w-4 h-4 text-slate-200" />
                  <span>Proceed to Select Partner (Locked — Pending Admin Verification)</span>
                </>
              ) : (
                <>
                  <span>Proceed to Select Partner →</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Screenshot Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-900">Payment Screenshot Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 bg-slate-100 rounded-lg cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              {/* eslint-disable-next-html-link */}
              <img
                src={submittedScreenshot || paymentScreenshot}
                alt="Receipt Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <p className="text-[11px] font-mono text-center text-slate-600 font-bold">
              Ref: {submittedTxId || txId}
            </p>
          </div>
        </div>
      )}
    </MobileContainer>
  );
}

export default function FeePaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading Fee Payment...</div>}>
      <FeePaymentContent />
    </Suspense>
  );
}
