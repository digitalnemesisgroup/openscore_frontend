'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Hammer, Building2, CreditCard, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

function ConstructionBankDetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    bank_name: '',
    account_holder_name: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        account_holder_name: prev.account_holder_name || user.name || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleIfscChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 11);
    setFormData((prev) => ({ ...prev, ifsc_code: val }));
  };

  const handleSubmitBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.account_number !== formData.confirm_account_number) {
      setError('Account numbers do not match.');
      return;
    }
    if (!appId) return;

    setLoading(true);
    try {
      const res = await apiRequest(`/loan/apply/${appId}/bank-details`, {
        method: 'POST',
        body: JSON.stringify({
          bank_account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
          bank_name: formData.bank_name || 'State Bank of India',
          account_holder_name: formData.account_holder_name,
        }),
      });

      if (res.status === 'success') {
        router.push(`/loan/apply/construction-loan/disbursement?id=${appId}`);
      } else {
        setError(res.message || 'Failed to save bank details.');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting bank details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmitBankDetails} className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
        <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Construction Loan Disbursal Bank Account Details</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name *</label>
          <input
            type="text"
            required
            name="account_holder_name"
            value={formData.account_holder_name}
            onChange={handleChange}
            placeholder="As per bank passbook"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
          <input
            type="text"
            required
            name="bank_name"
            value={formData.bank_name}
            onChange={handleChange}
            placeholder="e.g. State Bank of India, HDFC Bank"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number *</label>
          <input
            type="password"
            required
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            placeholder="Enter account number"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Account Number *</label>
          <input
            type="text"
            required
            name="confirm_account_number"
            value={formData.confirm_account_number}
            onChange={handleChange}
            placeholder="Re-enter account number"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code *</label>
          <input
            type="text"
            required
            maxLength={11}
            name="ifsc_code"
            value={formData.ifsc_code}
            onChange={handleIfscChange}
            placeholder="SBIN0001234"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Saving Bank Details...</span>
          </>
        ) : (
          <>
            <span>Proceed to Construction Disbursement Agreement →</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ConstructionBankDetailsPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Disbursal Bank Details" stepNumber={8} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading bank form...</div>}>
          <ConstructionBankDetailsForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}

