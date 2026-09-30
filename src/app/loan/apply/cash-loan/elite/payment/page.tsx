'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
  Lock,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  Zap,
  Sparkles,
  IndianRupee,
  FileText,
  BadgeCheck,
} from 'lucide-react';

function ElitePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('app_id') || searchParams.get('id');

  const [appId, setAppId] = useState<string | null>(appIdParam);
  const [appData, setAppData] = useState<any>(null);
  const [feeConfig, setFeeConfig] = useState<any>(null);
  const [step, setStep] = useState<'consent' | 'pay'>('consent');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [txId, setTxId] = useState<string>('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const targetId = appIdParam || (typeof window !== 'undefined' ? localStorage.getItem('active_elite_loan_app_id') : null);
      if (!targetId) {
        setLoading(false);
        return;
      }
      setAppId(targetId);
      try {
        const [appRes, feeRes] = await Promise.allSettled([
          apiRequest(`/loan/elite-cash/${targetId}`),
          apiRequest('/settings/fee-config'),
        ]);

        if (appRes.status === 'fulfilled' && appRes.value?.data) {
          setAppData(appRes.value.data);
          if (appRes.value.data.transaction_id) {
            setTxId(appRes.value.data.transaction_id);
          }
          if (appRes.value.data.payment_screenshot) {
            setPaymentScreenshot(appRes.value.data.payment_screenshot);
          }
        }
        if (feeRes.status === 'fulfilled' && feeRes.value?.data) {
          setFeeConfig(feeRes.value.data);
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    }
    loadData();
  }, [appIdParam]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      try {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          let finalUrl = rawUrl;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            finalUrl = canvas.toDataURL('image/jpeg', 0.7);
          }
          setPaymentScreenshot(finalUrl);
          setError('');
        };
        img.onerror = () => {
          setPaymentScreenshot(rawUrl);
          setError('');
        };
        img.src = rawUrl;
      } catch {
        setPaymentScreenshot(rawUrl);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Fees calculation
  const loginFee = feeConfig?.cash_loan_login_fee ?? 500;
  const docFee = feeConfig?.cash_loan_doc_fee ?? 200;
  const verifFee = feeConfig?.cash_loan_verification_fee ?? 299;
  const totalCalculatedFee = appData?.fee_amount || appData?.processing_fee || (loginFee + docFee + verifFee);

  const upiId = appData?.payment_upi_id || feeConfig?.upi_id || 'flipflops@upi';
  const payeeName = feeConfig?.upi_payee_name || 'OpenScore Finance';

  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${totalCalculatedFee}&cu=INR`;
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyUpi = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    if (!txId.trim() || txId.trim().length < 6) {
      setError('Please enter a valid Transaction ID / UTR reference number.');
      return;
    }

    if (!paymentScreenshot) {
      setError('Payment screenshot proof is mandatory. Without screenshot, your application cannot be processed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await apiRequest(`/loan/elite-cash/${appId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: txId.trim(),
          payment_screenshot: paymentScreenshot,
        }),
      });

      if (res && res.data) {
        router.push(`/loan/apply/cash-loan/elite/status?id=${appId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Payment Gateway...</p>
      </div>
    );
  }

  return (
    <MobileContainer>
      <LoanHeader
        title={step === 'consent' ? 'Fee Authorization & Consent' : 'UPI Payment & Proof'}
        stepNumber={3}
        backHref={step === 'pay' ? undefined : `/loan/apply/cash-loan/elite`}
        onBackClick={step === 'pay' ? () => setStep('consent') : undefined}
      />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Top Reference & Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200 inline-flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-purple-600 fill-purple-600" />
              {step === 'consent' ? 'Step 1 of 2: Fee Consent' : 'Step 2 of 2: Scan & Pay'}
            </span>
            <h1 className="text-xl font-black text-slate-900">
              {step === 'consent' ? 'Processing Fee & Consent' : 'Scan & Pay via UPI'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {step === 'consent'
                ? 'Review fee breakdown and confirm authorization'
                : 'Complete payment and upload transaction proof'}
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            #{appData?.application_number || `ECL-${appId}`}
          </span>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-bold flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: ITEMIZE BREAKDOWN & MANDATORY CONSENT ================= */}
        {step === 'consent' && (
          <div className="space-y-4">
            {/* Application Overview Mini Card */}
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-4.5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-purple-800/60 pb-2.5">
                <span className="text-[11px] font-bold text-purple-200 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  Application Verified &amp; Pre-Approved
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded-md border border-purple-400/30">
                  Express Disbursal
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-purple-300 block font-medium">Loan Product</span>
                  <span className="font-black text-white">Elite Personal Cash</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 block font-medium">Sanctioned Amount</span>
                  <span className="font-black text-emerald-400">
                    ₹{Number(appData?.loan_amount || 100000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Fee Breakdown Card */}
            <div className="bg-white border-2 border-purple-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Itemized Fee Breakdown
                </span>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  100% Transparent
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>1. Application Login &amp; Portal Fee</span>
                  <span className="font-bold text-slate-900">₹{Number(loginFee).toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>2. KYC &amp; Documentation Processing</span>
                  <span className="font-bold text-slate-900">₹{Number(docFee).toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>3. Express Sanction &amp; Risk Check</span>
                  <span className="font-bold text-slate-900">₹{Number(verifFee).toLocaleString('en-IN')}.00</span>
                </div>

                <div className="pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between text-sm font-black text-purple-950">
                  <span>Total Payable Amount</span>
                  <span className="text-lg text-purple-700 font-mono font-black">
                    ₹{Number(totalCalculatedFee).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Consent & Declaration Section */}
            <div className="bg-purple-50/70 border-2 border-purple-200 rounded-3xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-purple-950 font-black text-xs">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Applicant Consent &amp; Declaration</span>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none bg-white p-3.5 rounded-2xl border border-purple-200 shadow-2xs hover:border-purple-400 transition-colors">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked);
                    if (error) setError('');
                  }}
                  className="w-5 h-5 rounded-md text-purple-600 focus:ring-purple-500 border-slate-300 mt-0.5 cursor-pointer shrink-0 accent-purple-600"
                />
                <span className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  <strong className="text-slate-900 font-bold">I hereby agree and give voluntary consent</strong> to pay the nominal processing fee of{' '}
                  <strong className="text-purple-700 font-bold">₹{Number(totalCalculatedFee).toLocaleString('en-IN')}.00</strong> for my loan application. I acknowledge that this fee facilitates portal registration, document processing, and express admin review.
                </span>
              </label>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium px-1">
                <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Secure encrypted authorization. Next step will display UPI payment options.</span>
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <button
              type="button"
              onClick={() => {
                if (!consentChecked) {
                  setError('Please check the consent box to agree before proceeding to payment.');
                  return;
                }
                setError('');
                setStep('pay');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!consentChecked}
              className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
                !consentChecked
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 cursor-pointer shadow-purple-900/20'
              }`}
            >
              <span>I Agree &amp; Proceed to Pay (₹{Number(totalCalculatedFee).toLocaleString('en-IN')})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: QR CODE, UPI ID, UTR & SCREENSHOT PROOF ================= */}
        {step === 'pay' && (
          <div className="space-y-4">
            {/* Amount Banner */}
            <div className="bg-purple-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-purple-200 block uppercase font-bold tracking-wider">
                  Total Payable Amount
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ₹{Number(totalCalculatedFee).toLocaleString('en-IN')}.00
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('consent')}
                className="text-[11px] font-bold text-purple-200 hover:text-white bg-purple-800/80 hover:bg-purple-800 px-3 py-1.5 rounded-xl border border-purple-700 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                View Breakdown
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-2 border-2 border-purple-400 relative shadow-inner">
                <img
                  src={qrCodeImgUrl}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Scan &amp; Pay Using Any UPI App
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  GPay, PhonePe, Paytm, BHIM, Cred
                </span>
              </div>

              {/* UPI ID Copy Bar */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
                <div className="text-left truncate mr-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    Official Payee UPI ID
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">{upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Payment Confirmation Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
                    ✓
                  </span>
                  <h2 className="text-sm font-black text-slate-900">Enter Payment Details &amp; Proof</h2>
                </div>

                <div className="space-y-3">
                  {/* UTR Reference Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">
                      12-Digit Transaction Reference (UTR / Txn ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder="e.g. 427819827364 or UPI Ref ID"
                      className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-purple-600 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      You can copy the 12-digit UTR from your UPI payment success screen.
                    </p>
                  </div>

                  {/* Mandatory Screenshot Proof Upload */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Upload Payment Receipt Screenshot * (Mandatory)
                      </label>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Required
                      </span>
                    </div>

                    {paymentScreenshot ? (
                      <div className="mt-2 relative bg-purple-50 border-2 border-dashed border-purple-300 rounded-2xl p-3 flex items-center gap-3">
                        <img
                          src={paymentScreenshot}
                          alt="Payment Receipt Screenshot"
                          className="w-16 h-16 object-cover rounded-xl border border-purple-200 shadow-2xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-purple-950 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Screenshot Attached
                          </p>
                          <p className="text-[10px] text-slate-500">Ready for admin verification</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentScreenshot('')}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-1 block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          required
                          className="hidden"
                          onChange={handleScreenshotUpload}
                        />
                        <div className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-purple-600 rounded-2xl text-center space-y-1 transition-colors">
                          <Upload className="w-6 h-6 text-purple-600 mx-auto" />
                          <span className="text-xs font-bold text-slate-800 block">
                            Tap to Upload Payment Screenshot
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            PNG, JPG, JPEG accepted (Without screenshot, verification cannot proceed)
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !txId.trim() || !paymentScreenshot}
                className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
                  !txId.trim() || !paymentScreenshot
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 cursor-pointer shadow-purple-900/20'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Submitting Verification...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application for Admin Review</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-[11px] text-purple-900 font-medium text-center">
              🔒 Fast-Track Admin Review: Your application and fee payment will be reviewed by admin immediately.
            </div>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default function EliteLoanPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Payment Gateway...</div>}>
      <ElitePaymentContent />
    </Suspense>
  );
}

