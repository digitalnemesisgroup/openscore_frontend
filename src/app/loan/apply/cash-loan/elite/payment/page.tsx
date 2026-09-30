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
} from 'lucide-react';

function ElitePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appIdParam = searchParams.get('app_id') || searchParams.get('id');

  const [appId, setAppId] = useState<string | null>(appIdParam);
  const [appData, setAppData] = useState<any>(null);
  const [feeConfig, setFeeConfig] = useState<any>(null);
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
      setPaymentScreenshot(event.target?.result as string);
      setError('');
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
        <p className="text-xs font-bold text-slate-600">Generating Secure UPI Gateway...</p>
      </div>
    );
  }

  return (
    <MobileContainer>
      <LoanHeader title="Processing Fee Payment" stepNumber={3} backHref={`/loan/apply/cash-loan/elite`} />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200 inline-flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-purple-600 fill-purple-600" /> Step 3: Nominal Processing Fee
            </span>
            <h1 className="text-xl font-black text-slate-900">Elite Loan Activation</h1>
            <p className="text-xs text-slate-500 font-medium">Nominal itemized processing fee payment</p>
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

        {/* Itemized Fee Breakdown Card */}
        <div className="bg-white border-2 border-purple-200 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Itemized Fee Breakdown
            </span>
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              Transparent
            </span>
          </div>

          <div className="space-y-2 text-xs">
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

            <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-sm font-black text-purple-950">
              <span>Total Payable Amount</span>
              <span className="text-base text-purple-700 font-mono font-black">
                ₹{Number(totalCalculatedFee).toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>
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
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
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
                      className="p-2 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"
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
                : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800'
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
