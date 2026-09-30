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
  FileText,
  BadgeCheck,
} from 'lucide-react';

function UrgentPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

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
      if (!appId) {
        setLoading(false);
        return;
      }
      try {
        const [appRes, feeRes] = await Promise.allSettled([
          apiRequest(`/loan/urgent-construction/${appId}`),
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
  }, [appId]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPaymentScreenshot(event.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const loginFee = feeConfig?.construction_loan_login_fee ?? 500;
  const docFee = feeConfig?.construction_loan_doc_fee ?? 300;
  const siteFee = feeConfig?.construction_loan_site_verification_fee ?? 699;
  const calculatedFee = appData?.fee_amount || appData?.processing_fee || (loginFee + docFee + siteFee);

  const upiId = appData?.payment_upi_id || feeConfig?.upi_id || 'flipflops@upi';
  const payeeName = feeConfig?.upi_payee_name || 'OpenScore Finance';

  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${calculatedFee}&cu=INR`;
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
      setError('Please enter a valid 12-Digit Transaction / UTR reference number.');
      return;
    }

    if (!paymentScreenshot) {
      setError('Payment screenshot proof is mandatory. Without screenshot, verification cannot proceed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await apiRequest(`/loan/urgent-construction/${appId}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: txId.trim(),
          payment_screenshot: paymentScreenshot,
        }),
      });

      if (res && res.data) {
        router.push(`/loan/apply/construction-loan/urgent/status?id=${appId}`);
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
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Loading Payment Gateway...</p>
      </div>
    );
  }

  return (
    <MobileContainer>
      <LoanHeader
        title={step === 'consent' ? 'Fee Breakdown & Consent' : 'UPI Payment & Proof'}
        stepNumber={2}
        backHref={step === 'pay' ? undefined : `/loan/apply/construction-loan/urgent`}
        onBackClick={step === 'pay' ? () => setStep('consent') : undefined}
      />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
              {step === 'consent' ? 'Step 1 of 2: Fee Consent' : 'Step 2 of 2: Scan & Pay'}
            </span>
            <h1 className="text-xl font-black text-slate-900">
              {step === 'consent' ? 'Urgent Loan Fee & Consent' : 'Scan & Pay via UPI'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {step === 'consent'
                ? 'Review fee breakdown and confirm authorization'
                : 'Fast-track technical & site verification payment'}
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
            #{appData?.application_number || `UCL-${appId}`}
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: ITEMIZE BREAKDOWN & MANDATORY CONSENT ================= */}
        {step === 'consent' && (
          <div className="space-y-4">
            {/* Overview Card */}
            <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-slate-900 text-white rounded-3xl p-4.5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-amber-800/60 pb-2.5">
                <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  Application Verified &amp; Pre-Approved
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Priority Clearance
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-amber-300 block font-medium">Loan Product</span>
                  <span className="font-black text-white">Elite Urgent Construction</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-300 block font-medium">Sanctioned Amount</span>
                  <span className="font-black text-emerald-400">
                    ₹{Number(appData?.loan_amount || 2500000).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Construction Fee Breakdown Card */}
            <div className="bg-white border-2 border-amber-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Itemized Processing Fee Breakdown
                </span>
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  100% Transparent
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>1. Application Login &amp; Portal Fee</span>
                  <span className="font-bold text-slate-900">₹{Number(loginFee).toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>2. Document &amp; Title Verification</span>
                  <span className="font-bold text-slate-900">₹{Number(docFee).toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>3. Site &amp; Technical Inspection Fee</span>
                  <span className="font-bold text-slate-900">₹{Number(siteFee).toLocaleString('en-IN')}.00</span>
                </div>

                <div className="pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between text-sm font-black text-amber-950">
                  <span>Total Payable Processing Fee</span>
                  <span className="text-lg text-amber-700 font-mono font-black">
                    ₹{Number(calculatedFee).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Consent & Declaration Section */}
            <div className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Applicant Consent &amp; Declaration</span>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked);
                    if (error) setError('');
                  }}
                  className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300 mt-0.5 cursor-pointer shrink-0 accent-amber-600"
                />
                <span className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  <strong className="text-slate-900 font-bold">I hereby agree and give voluntary consent</strong> to pay the nominal processing fee of{' '}
                  <strong className="text-amber-700 font-bold">₹{Number(calculatedFee).toLocaleString('en-IN')}.00</strong> for my construction loan application. I understand this fee facilitates fast-track technical clearance, site verification, and admin review.
                </span>
              </label>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium px-1">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
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
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 cursor-pointer shadow-amber-900/20'
              }`}
            >
              <span>I Agree &amp; Proceed to Pay (₹{Number(calculatedFee).toLocaleString('en-IN')})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ================= STEP 2: QR CODE, UPI ID, UTR & SCREENSHOT PROOF ================= */}
        {step === 'pay' && (
          <div className="space-y-4">
            {/* Amount Banner */}
            <div className="bg-amber-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-200 block uppercase font-bold tracking-wider">
                  Total Payable Amount
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  ₹{Number(calculatedFee).toLocaleString('en-IN')}.00
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep('consent')}
                className="text-[11px] font-bold text-amber-200 hover:text-white bg-amber-800/80 hover:bg-amber-800 px-3 py-1.5 rounded-xl border border-amber-700 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                View Breakdown
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-2 border-2 border-amber-400 relative shadow-inner">
                <img
                  src={qrCodeImgUrl}
                  alt="UPI QR Code"
                  className="w-44 h-44 object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-slate-800">Scan via Google Pay, PhonePe, Paytm or BHIM</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Merchant: <strong className="font-bold text-slate-700">{payeeName}</strong>
                </p>
              </div>

              {/* Copyable UPI ID Box */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Receiving UPI ID</span>
                  <span className="text-xs font-mono font-black text-slate-900">{upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-950" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Form to submit UTR & Screenshot */}
            <form onSubmit={handleSubmitPayment} className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900">Confirm Payment Details &amp; Proof</h3>
                <p className="text-[11px] text-slate-500">
                  Enter the 12-digit UTR transaction ID from your UPI app receipt and attach screenshot.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">12-Digit UTR / Transaction Reference Number *</label>
                <input
                  type="text"
                  required
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="e.g. 427819384910"
                  className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Payment Screenshot Receipt * (Mandatory)</label>
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Required
                  </span>
                </div>
                {paymentScreenshot ? (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={paymentScreenshot}
                        alt="Receipt preview"
                        className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-2xs"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-emerald-900 block">Screenshot Attached ✓</span>
                        <span className="text-[10px] text-emerald-700">Ready for review</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentScreenshot('')}
                      className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-1 w-full border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-amber-600" />
                    <span className="text-xs font-bold text-slate-700 mt-1">Tap to Upload Payment Screenshot</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG under 10MB (Mandatory to proceed)</span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !txId.trim() || !paymentScreenshot}
                className={`w-full py-3.5 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
                  !txId.trim() || !paymentScreenshot
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 cursor-pointer'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Urgent Loan Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}

export default function UrgentPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading Payment...</div>}>
      <UrgentPaymentContent />
    </Suspense>
  );
}

