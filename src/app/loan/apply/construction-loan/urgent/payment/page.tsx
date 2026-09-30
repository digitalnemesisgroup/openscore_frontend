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
} from 'lucide-react';

function UrgentPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

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

  const calculatedFee = appData?.fee_amount || appData?.processing_fee || feeConfig?.construction_loan_without_cibil_fee_value || 999;
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
        <p className="text-xs font-bold text-slate-600">Generating Secure UPI Payment Gateway...</p>
      </div>
    );
  }

  return (
    <MobileContainer>
      <LoanHeader title="Processing Fee Payment" stepNumber={2} backHref={`/loan/apply/construction-loan/urgent`} />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-600" /> Step 2: Processing Fee
            </span>
            <h1 className="text-xl font-black text-slate-900">Urgent Fee Verification</h1>
            <p className="text-xs text-slate-500 font-medium">Fast-track technical &amp; site verification processing</p>
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

        {/* Itemized Construction Fee Breakdown Card */}
        <div className="bg-white border-2 border-amber-200 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Itemized Processing Fee Breakdown
            </span>
            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              Express Review
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>1. Application Login &amp; Portal Fee</span>
              <span className="font-bold text-slate-900">₹{Number(feeConfig?.construction_loan_login_fee ?? 500).toLocaleString('en-IN')}.00</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>2. Document &amp; Title Verification</span>
              <span className="font-bold text-slate-900">₹{Number(feeConfig?.construction_loan_doc_fee ?? 300).toLocaleString('en-IN')}.00</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 font-medium">
              <span>3. Site &amp; Technical Inspection Fee</span>
              <span className="font-bold text-slate-900">₹{Number(feeConfig?.construction_loan_site_verification_fee ?? 699).toLocaleString('en-IN')}.00</span>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-sm font-black text-amber-950">
              <span>Total Payable Processing Fee</span>
              <span className="text-base text-amber-700 font-mono font-black">
                ₹{Number(calculatedFee).toLocaleString('en-IN')}.00
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex flex-col items-center justify-center p-2 border-2 border-amber-400 relative shadow-inner">
            {/* eslint-disable-next-html-link */}
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
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-colors"
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
            <h3 className="text-xs font-black text-slate-900">Confirm Payment Details</h3>
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
                  className="text-slate-400 hover:text-rose-600 p-1.5"
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
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600'
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
