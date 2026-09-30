'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import { Building, CreditCard, ArrowRight, RefreshCw, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

function BankDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appId, setAppId] = useState<string | null>(null);
  const [bankData, setBankData] = useState({
    bank_account_holder_name: '',
    bank_name: '',
    bank_account_number: '',
    confirm_bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_type: 'Savings',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApp() {
      const { appId: targetId } = await resolveTargetAppId(urlAppId, 'cash');
      if (targetId) setAppId(targetId);
    }
    loadApp();
  }, [urlAppId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBankData({
      ...bankData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const { bank_account_holder_name, bank_name, bank_account_number, confirm_bank_account_number, bank_ifsc_code } = bankData;

    if (!bank_account_holder_name.trim() || bank_account_holder_name.trim().length < 3) {
      return 'Please enter valid account holder name (minimum 3 characters).';
    }

    if (!bank_name.trim() || bank_name.trim().length < 2) {
      return 'Please enter your bank name.';
    }

    const cleanAccNo = bank_account_number.replace(/[^0-9]/g, '');
    if (cleanAccNo.length < 9 || cleanAccNo.length > 18) {
      return 'Account number must be between 9 and 18 digits.';
    }

    if (bank_account_number !== confirm_bank_account_number) {
      return 'Account number and Confirm account number do not match.';
    }

    const cleanIfsc = bank_ifsc_code.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(cleanIfsc)) {
      return 'Please enter a valid 11-character Indian IFSC Code (e.g., HDFC0001234).';
    }

    return null;
  };

  const handleSubmitBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) {
      setError('No active application found. Please restart eligibility step.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await apiRequest(`/loan/apply/${appId}/bank-details`, {
        method: 'POST',
        body: JSON.stringify({
          bank_account_holder_name: bankData.bank_account_holder_name.trim(),
          bank_name: bankData.bank_name.trim(),
          bank_account_number: bankData.bank_account_number.trim(),
          bank_ifsc_code: bankData.bank_ifsc_code.trim().toUpperCase(),
          bank_account_type: bankData.bank_account_type,
        }),
      });

      if (res.data) {
        router.push('/loan/apply/disbursement');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit bank account details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Disbursement Bank Account" stepNumber={20} backHref="/loan/apply/status" />

      <div className="p-4 pb-36 space-y-4 flex-1 overflow-y-auto animate-in fade-in duration-300">
        <div>
          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
            Step 20 of 26
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Disbursement Bank Details</h1>
          <p className="text-xs text-slate-500 font-medium">Enter your bank account details for instant loan credit</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitBankDetails} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Account Holder Name *
            </label>
            <input
              type="text"
              name="bank_account_holder_name"
              required
              value={bankData.bank_account_holder_name}
              onChange={handleChange}
              placeholder="Full name as registered in bank"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              name="bank_name"
              required
              value={bankData.bank_name}
              onChange={handleChange}
              placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Account Number *
            </label>
            <input
              type="password"
              name="bank_account_number"
              required
              maxLength={18}
              value={bankData.bank_account_number}
              onChange={(e) => setBankData({ ...bankData, bank_account_number: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="Enter 9 to 18-digit account number"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Confirm Account Number *
            </label>
            <input
              type="text"
              name="confirm_bank_account_number"
              required
              maxLength={18}
              value={bankData.confirm_bank_account_number}
              onChange={(e) => setBankData({ ...bankData, confirm_bank_account_number: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="Re-enter account number"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                name="bank_ifsc_code"
                required
                maxLength={11}
                value={bankData.bank_ifsc_code}
                onChange={(e) => setBankData({ ...bankData, bank_ifsc_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                placeholder="HDFC0001234"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Account Type *
              </label>
              <select
                name="bank_account_type"
                value={bankData.bank_account_type}
                onChange={handleChange}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
            </div>
          </div>

          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Bank Details...</span>
                </>
              ) : (
                <>
                  <span>Submit & Track Disbursement SLA →</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MobileContainer>
  );
}

export default function BankDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading Disbursal Bank Details...</div>}>
      <BankDetailsContent />
    </Suspense>
  );
}
