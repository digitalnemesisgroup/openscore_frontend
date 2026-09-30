'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, X, CheckCircle2, AlertCircle, Building2, UserX, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SendMoneyModal({ isOpen, onClose, onSuccess }: SendMoneyModalProps) {
  const [sendAccount, setSendAccount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{
    recipient_name: string;
    upi_id: string;
    account_type: string;
    is_business: boolean;
    can_receive: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setSendAccount('');
      setSendAmount('');
      setRecipientInfo(null);
      setErrorMessage(null);
      setSuccessReceipt(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyRecipient = async (val?: string) => {
    const target = (val !== undefined ? val : sendAccount).trim();
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
        setErrorMessage(err.message || 'Account not found. Please verify beneficiary details.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = parseFloat(sendAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount.');
      return;
    }

    if (!recipientInfo || !recipientInfo.is_business) {
      setErrorMessage('Transfers are strictly restricted to verified Business accounts only.');
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = 'IDEM_SEND_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    try {
      const res = await apiRequest('/wallet-card/qr-pay', {
        method: 'POST',
        body: JSON.stringify({
          recipient_identifier: sendAccount.trim(),
          amount: numAmount,
          idempotency_key: idempotencyKey,
        }),
      });

      if (res && res.status === 'success') {
        setSuccessReceipt(res);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.message || 'Transfer failed.');
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
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> Send Money to Business Wallet
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successReceipt ? (
          <div className="text-center py-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Transfer Complete
              </span>
              <h4 className="text-2xl font-black text-slate-900 mt-2">
                ₹{parseFloat(sendAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-xs text-slate-600 font-bold mt-1">
                Transferred to {successReceipt.data?.recipient_name || recipientInfo?.recipient_name || 'Business Beneficiary'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 text-left text-xs space-y-1.5 border border-slate-200 font-mono">
              <div className="flex justify-between text-slate-500 font-sans">
                <span>Transaction ID:</span>
                <span className="font-bold text-slate-900">{successReceipt.transaction_id}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-sans">
                <span>Account Type:</span>
                <span className="font-bold text-emerald-700 uppercase">Verified Business</span>
              </div>
              <div className="flex justify-between text-slate-500 font-sans">
                <span>Available Balance:</span>
                <span className="font-black text-purple-700">₹{parseFloat(successReceipt.data?.available_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessReceipt(null);
                setSendAccount('');
                setSendAmount('');
                setRecipientInfo(null);
                onClose();
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleExecuteTransfer} className="space-y-3">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMessage}</span>
              </div>
            )}

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Transfers can only be received by <strong>Business Accounts</strong>.</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Beneficiary Mobile or UPI ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sendAccount}
                  onChange={(e) => {
                    setSendAccount(e.target.value);
                    setRecipientInfo(null);
                    setErrorMessage(null);
                  }}
                  onBlur={() => handleVerifyRecipient()}
                  placeholder="e.g. 9800000001 or quickstore@openscore"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold pr-20 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyRecipient()}
                  disabled={isVerifying || !sendAccount.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                </button>
              </div>

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

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Transfer Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400">₹</span>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-1.5 mt-2">
                {[500, 1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSendAmount(amt.toString())}
                    className="px-2 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Atomic Double-Click Protection
              </span>
              <span>OpenScore Protected</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !sendAccount || !sendAmount || (recipientInfo !== null && !recipientInfo.is_business)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing Transfer...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-4 h-4" /> Transfer ₹{sendAmount ? parseFloat(sendAmount).toLocaleString('en-IN') : '0'} Now
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
