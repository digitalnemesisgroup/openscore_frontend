'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, CreditCard, ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, Clock, Lock, AlertCircle, QrCode, Upload, Image as ImageIcon, Trash2, Eye } from 'lucide-react';

function ConstructionFeePaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [txId, setTxId] = useState('');
  const [submittedTxId, setSubmittedTxId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [submittedScreenshot, setSubmittedScreenshot] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [isVerifiedByAdmin, setIsVerifiedByAdmin] = useState(false);
  const [assignedTier, setAssignedTier] = useState<string>('');
  const [error, setError] = useState('');

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

  const checkAppStatus = async (id: string) => {
    try {
      const res = await apiRequest(`/loan/applications/${id}`);
      if (res && res.data) {
        const app = res.data;
        setAppData(app);
        if (app.transaction_id) {
          setSubmittedTxId(app.transaction_id);
        }
        if (app.payment_screenshot) {
          setSubmittedScreenshot(app.payment_screenshot);
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
    if (!paymentScreenshot) {
      setError('Please upload a screenshot of your successful UPI payment for Admin Verification.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await apiRequest(`/loan/apply/${targetId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: txId.trim(),
          payment_screenshot: paymentScreenshot,
          payment_status: 'pending_verification',
          fee_payment_status: 'Submitted (Pending Admin Verification)',
        }),
      });

      if (res.data) {
        setSubmittedTxId(txId.trim());
        setSubmittedScreenshot(paymentScreenshot);
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

  const [feeConfig, setFeeConfig] = useState<any>({
    upi_id: 'flipflops@upi',
    upi_payee_name: 'OpenScore Finance',
    construction_loan_without_cibil_fee_type: 'fixed',
    construction_loan_without_cibil_fee_value: 0,
    construction_loan_low_cibil_fee_type: 'fixed',
    construction_loan_low_cibil_fee_value: 0,
    construction_loan_high_cibil_fee_type: 'fixed',
    construction_loan_high_cibil_fee_value: 0,
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
    const targetId = appId || (typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null);
    if (!isVerifiedByAdmin) {
      setError('Your application fee payment is pending verification. Please submit payment details to proceed.');
      return;
    }
    router.push(`/loan/apply/construction-loan/select-partner${targetId ? `?id=${targetId}` : ''}`);
  };

  // Priority: 1. Application-specific fee set by admin -> 2. Global fee config (3 tiers & fixed vs %)
  let calculatedFee = 0;
  if (appData?.processing_fee || appData?.fee_amount) {
    calculatedFee = Number(appData.processing_fee || appData.fee_amount);
  } else if (feeConfig) {
    const lType = (appData?.loan_type || '').toLowerCase();
    const cType = (appData?.cibil_type || '').toLowerCase();
    const isHigh = lType.includes('good') || lType.includes('high') || cType.includes('good') || cType.includes('high');
    const isLow = lType.includes('low') || cType.includes('low');

    let feeType = 'fixed';
    let rateOrVal = 0;

    if (isHigh) {
      feeType = feeConfig.construction_loan_high_cibil_fee_type || feeConfig.construction_loan_fee_type || 'fixed';
      rateOrVal = Number(feeConfig.construction_loan_high_cibil_fee_value ?? 0);
    } else if (isLow) {
      feeType = feeConfig.construction_loan_low_cibil_fee_type || feeConfig.construction_loan_fee_type || 'fixed';
      rateOrVal = Number(feeConfig.construction_loan_low_cibil_fee_value ?? 0);
    } else {
      // Without CIBIL or default
      feeType = feeConfig.construction_loan_without_cibil_fee_type || feeConfig.construction_loan_fee_type || 'fixed';
      rateOrVal = Number(feeConfig.construction_loan_without_cibil_fee_value ?? feeConfig.construction_loan_fee_value ?? 0);
    }

    if (feeType === 'percentage') {
      const principal = Number(appData?.required_amount || appData?.applied_amount || 100000);
      calculatedFee = Math.max(1, Math.round(principal * (rateOrVal / 100)));
    } else {
      calculatedFee = rateOrVal;
    }
  }

  const baseFee = calculatedFee;
  const gstAmount = Math.round(baseFee * 0.18);
  const feeAmountNumber = baseFee + gstAmount;
  const upiId = appData?.payment_upi_id || appData?.upi_id || feeConfig?.upi_id || 'flipflops@upi';
  const payeeName = appData?.upi_payee_name || feeConfig?.upi_payee_name || 'OpenScore Finance';
  const constructionQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${feeAmountNumber}&cu=INR`)}`;


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

      {/* Fee Amount Box */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 text-white p-5 rounded-3xl text-center space-y-1 relative overflow-hidden shadow-md">
        <span className="text-[10px] font-extrabold uppercase text-emerald-200 tracking-wider">
          TOTAL CONSTRUCTION PROCESSING FEE
        </span>
        <h2 className="text-3xl font-black">₹{feeAmountNumber.toLocaleString('en-IN')}.00</h2>
        <div className="flex justify-center gap-4 text-[10px] text-emerald-200 font-medium mt-1">
          <span>Base Fee: ₹{baseFee}</span>
          <span>+ 18% GST: ₹{gstAmount}</span>
        </div>
        <p className="text-[11px] text-emerald-100 flex items-center justify-center gap-1 font-semibold mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> 100% Encrypted & Protected Fee Gateway
        </p>
      </div>

      {!paymentSubmitted ? (
        <>
          {/* QR Code Container */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-2 border-2 border-emerald-300 relative shadow-inner">
              {/* eslint-disable-next-html-link */}
              <img
                src={constructionQrUrl}
                alt="Construction UPI QR"
                className="w-44 h-44 object-contain rounded-xl"
              />
              <span className="absolute -bottom-3 text-[9px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                SCAN & PAY WITH ANY UPI APP
              </span>
            </div>

            <div className="pt-2 text-center space-y-1">
              <p className="text-[11px] font-medium text-slate-500">Official UPI ID for Construction Fee:</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-slate-800 font-mono font-bold text-xs border border-slate-200">
                <span>{upiId}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined') navigator.clipboard.writeText(upiId);
                  }}
                  className="p-1 text-slate-500 hover:text-emerald-600 transition-colors text-xs font-bold"
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

          {/* Payment Screenshot Upload */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Upload Payment Screenshot / Receipt *
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">PNG, JPG up to 10MB</span>
            </div>

            {!paymentScreenshot ? (
              <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-emerald-700 hover:underline">Click to Upload Payment Screenshot</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Attach the UPI payment receipt screenshot</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-3 bg-white border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
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
                    className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
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
                <ArrowRight className="w-4 h-4" />
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
                      className="text-emerald-600 hover:underline text-[10px] font-bold ml-1 cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                )}

                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  {isWithoutCibil
                    ? 'Your details & processing fee screenshot have been submitted. OpenScore Admin is evaluating your credit profile to approve and assign your application under Low CIBIL or High CIBIL loan tier.'
                    : 'Your fee payment and screenshot have been submitted successfully. Admin is verifying your payment. Once approved, the button below will unlock automatically.'}
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
