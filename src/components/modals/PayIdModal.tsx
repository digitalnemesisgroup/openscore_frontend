'use client';

import React, { useState, useEffect } from 'react';
import { Send, X, CheckCircle2, AlertCircle, Building2, UserX, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface PayIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PayIdModal({ isOpen, onClose, onSuccess }: PayIdModalProps) {
  const [payUpiId, setPayUpiId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{
    recipient_name: string;
    upi_id: string;
    account_type: string;
    is_business: boolean;
    can_receive: boolean;
    badge?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setPayUpiId('');
      setPayAmount('');
      setRecipientInfo(null);
      setErrorMessage(null);
      setSuccessReceipt(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyRecipient = async (val?: string) => {
    const target = (val !== undefined ? val : payUpiId).trim();
    if (!target) return;

    setIsVerifying(true);
    setErrorMessage(null);
    setRecipientInfo(null);

    try {
      const res = await apiRequest('/wallet-card/qr-resolve', {
        method: 'POST',
        body: JSON.stringify({ recipient_identifier: target }),
      });

      if (res && res.status === 'success') {
        setRecipientInfo(res.data);
      }
    } catch (err: any) {
      if (err.status === 422) {
        setErrorMessage(err.message || 'Transfers can ONLY be sent to verified Business accounts.');
        if (err.data) {
          setRecipientInfo(err.data);
        }
      } else {
        setErrorMessage(err.message || 'Account not found. Please check UPI ID or mobile number.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount (minimum ₹1).');
      return;
    }

    if (!recipientInfo || !recipientInfo.is_business) {
      setErrorMessage('Transfers are strictly restricted to verified Business accounts only.');
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = 'IDEM_PAY_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    try {
      const res = await apiRequest('/wallet-card/qr-pay', {
        method: 'POST',
        body: JSON.stringify({
          recipient_identifier: payUpiId.trim(),
          amount: numAmount,
          idempotency_key: idempotencyKey,
        }),
      });

      if (res && res.status === 'success') {
        setSuccessReceipt(res);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message || 'Payment failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Transaction could not be processed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> Pay via UPI ID / Mobile
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successReceipt ? (
          /* Payment Receipt Screen */
          <div className="text-center py-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Transfer Successful
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-2">
                ₹{parseFloat(payAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-xs text-slate-600 font-bold mt-1">
                Sent to {successReceipt.data?.recipient_name || recipientInfo?.recipient_name || 'Business Merchant'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-left text-xs space-y-1.5 border border-slate-200 font-mono">
              <div className="flex justify-between text-slate-500 font-sans">
                <span>Txn Reference:</span>
                <span className="font-bold text-slate-900">{successReceipt.transaction_id}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-sans">
                <span>Recipient Type:</span>
                <span className="font-bold text-emerald-700 uppercase">Verified Business</span>
              </div>
              <div className="flex justify-between text-slate-500 font-sans">
                <span>Remaining Balance:</span>
                <span className="font-black text-purple-700">₹{parseFloat(successReceipt.data?.available_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessReceipt(null);
                setPayUpiId('');
                setPayAmount('');
                setRecipientInfo(null);
                onClose();
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleExecutePayment} className="space-y-3">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Quick Helper Banner for Business Account Requirement */}
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Transfers are permitted exclusively to <strong>Business Accounts</strong> (e.g. <code className="bg-blue-100 px-1 rounded">9800000001</code>).</span>
            </div>

            {/* Input Recipient UPI / Phone */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Recipient UPI ID or 10-Digit Mobile
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={payUpiId}
                  onChange={(e) => {
                    setPayUpiId(e.target.value);
                    setRecipientInfo(null);
                    setErrorMessage(null);
                  }}
                  onBlur={() => handleVerifyRecipient()}
                  placeholder="e.g. 9800000001 or quickstore@openscore"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyRecipient()}
                  disabled={isVerifying || !payUpiId.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                </button>
              </div>

              {/* Recipient Verification Feedback Badge */}
              {recipientInfo && (
                <div className="mt-2">
                  {recipientInfo.is_business ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-extrabold">{recipientInfo.recipient_name}</div>
                          <div className="text-[10px] text-emerald-600 font-mono">{recipientInfo.upi_id}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                        Business Merchant
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                      <UserX className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <div className="font-bold">{recipientInfo.recipient_name} (Personal Account)</div>
                        <div className="text-[10px] text-rose-600">Personal accounts cannot receive transfers.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Amount */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Transfer Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400">₹</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 500)"
                  min="1"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="flex gap-1.5 mt-2">
                {[100, 500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPayAmount(amt.toString())}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Idempotent Transfer
              </span>
              <span>OpenScore Protected</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !payUpiId || !payAmount || (recipientInfo !== null && !recipientInfo.is_business)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Proceed to Pay ₹{payAmount ? parseFloat(payAmount).toLocaleString('en-IN') : '0'}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
