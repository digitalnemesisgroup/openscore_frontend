'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Send, CheckCircle2, ShieldCheck, Copy, ArrowRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export default function QrPaymentModal({ isOpen, onClose, onPaymentSuccess }: QrPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'pay' | 'receive'>('pay');
  
  // Pay Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // My QR Receive State
  const [qrData, setQrData] = useState<any>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [copied, setCopied] = useState(false);

  // Double-Click & Throttling Safety Ref
  const lastSubmitTimeRef = useRef<number>(0);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const generateIdempotencyKey = () => {
    return 'IDEM_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  };

  // Reset & prepare on modal open
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      setErrorMessage(null);
      setSuccessData(null);
      fetchQrCodeData();
    }
  }, [isOpen]);

  const fetchQrCodeData = async () => {
    setIsLoadingQr(true);
    try {
      const API_BASE = getApiBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/user/wallet-card/qr-code`, {
        headers,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setQrData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch QR Code details:', err);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleResolveRecipient = async (val?: string) => {
    const target = val !== undefined ? val : recipient;
    if (!target.trim()) return;

    setIsResolving(true);
    setErrorMessage(null);
    try {
      const API_BASE = getApiBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const res = await fetch(`${API_BASE}/user/wallet-card/qr-resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ recipient_identifier: target }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setRecipientName(data.data.recipient_name);
      } else {
        setRecipientName(null);
      }
    } catch (err) {
      console.error('Recipient resolution failed:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. CLIENT-SIDE DOUBLE CLICK THROTTLING (Prevent rapid duplicate clicks within 2000ms)
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 2000) {
      console.warn('Payment click throttled to prevent double submission');
      return;
    }
    lastSubmitTimeRef.current = now;

    if (!recipient.trim()) {
      setErrorMessage('Please enter a recipient UPI ID, mobile number, or email.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const API_BASE = getApiBaseUrl();
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      // Make secure payment request with idempotency key
      const res = await fetch(`${API_BASE}/user/wallet-card/qr-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipient_identifier: recipient,
          amount: numAmount,
          idempotency_key: idempotencyKey,
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setSuccessData(data);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        setErrorMessage(data.message || 'Payment failed. Please check your balance and try again.');
      }
    } catch (err: any) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUpi = () => {
    if (!qrData?.upi_id) return;
    navigator.clipboard.writeText(qrData.upi_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out max-h-[90vh] overflow-y-auto">
        {/* Top Handle bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Instant QR & P2P Pay <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-100" />
            </h3>
            <p className="text-xs text-slate-500 font-medium">Secure Idempotent Wallet Transfer</p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pay');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pay'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Pay via QR / UPI
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('receive');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'receive'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> My QR Code
          </button>
        </div>

        {/* TAB 1: PAY & TRANSFER */}
        {activeTab === 'pay' && (
          <div className="space-y-4 pt-1">
            {successData ? (
              /* Payment Success Screen */
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Payment Successful
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 mt-2">
                    ₹{numberFormat(successData.data?.transaction?.amount || amount)}
                  </h4>
                  <p className="text-xs text-slate-600 font-semibold mt-1">
                    Sent to {successData.data?.recipient_name || recipientName || 'Recipient'}
                  </p>
                </div>

                <div className="bg-white/80 rounded-xl p-3 text-left text-xs space-y-1.5 border border-emerald-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Transaction Ref:</span>
                    <span className="font-mono font-bold text-slate-800">{successData.transaction_id || successData.data?.transaction?.transaction_id}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-slate-800">OpenScore UPI QR</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>New Wallet Balance:</span>
                    <span className="font-black text-purple-700">₹{numberFormat(successData.data?.available_value || 0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSuccessData(null);
                    setAmount('');
                    setRecipient('');
                    setRecipientName(null);
                    setIdempotencyKey(generateIdempotencyKey());
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  Make Another Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Payment Form */
              <form onSubmit={handlePaySubmit} className="space-y-3.5">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Recipient Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient Mobile Number or UPI ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 or name@openscore"
                      value={recipient}
                      onChange={(e) => {
                        setRecipient(e.target.value);
                        setRecipientName(null);
                      }}
                      onBlur={() => handleResolveRecipient()}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => handleResolveRecipient()}
                      disabled={isResolving || !recipient.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      {isResolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                    </button>
                  </div>

                  {recipientName && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Recipient: {recipientName}
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transfer Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Fast Amount Chips */}
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    {[100, 500, 1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt.toString())}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 transition-colors shrink-0"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Idempotency Protection Indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Double-Click Safe
                  </span>
                  <span className="truncate max-w-[140px]">Key: {idempotencyKey.substring(0, 12)}...</span>
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !recipient.trim() || !amount}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing Secure Payment...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Pay ₹{amount ? numberFormat(parseFloat(amount)) : '0'} Now
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MY QR CODE (RECEIVE) */}
        {activeTab === 'receive' && (
          <div className="space-y-4 pt-1 text-center">
            {isLoadingQr ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-xs font-semibold">Loading Personal QR Code...</p>
              </div>
            ) : qrData ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* QR Display Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-3xl text-white shadow-xl relative border border-slate-700 flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" /> OpenScore Instant Receive QR
                  </div>

                  {/* Dynamic QR Code Canvas Image */}
                  <div className="p-3 bg-white rounded-2xl shadow-inner border-4 border-purple-500/30 relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=5&data=${encodeURIComponent(
                        qrData.qr_payload || `openscore://pay?upi_id=${qrData.upi_id}`
                      )}`}
                      alt="Personal OpenScore QR Code"
                      className="w-44 h-44 rounded-lg object-contain"
                    />
                  </div>

                  <div>
                    <h4 className="text-base font-black tracking-tight text-white">
                      {qrData.card_holder_name || 'OpenScore User'}
                    </h4>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Card: {qrData.card_number || '•••• •••• •••• 1234'}
                    </p>
                  </div>
                </div>

                {/* UPI ID Copy Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Your Personal UPI ID
                    </span>
                    <span className="text-xs font-black font-mono text-purple-700">{qrData.upi_id}</span>
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    className="py-1.5 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-xs text-slate-500 font-semibold">
                Unable to load QR Code details. Please try again.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function numberFormat(val: number | string) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

