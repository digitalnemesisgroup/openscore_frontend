'use client';

import React, { useState } from 'react';
import { User as UserIcon, FileText, CreditCard, CheckCircle2, Save, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { formatLoanType } from '@/lib/loan-resume';

interface OverviewTabProps {
  currentApp: any;
  onVerifyFee: () => void;
  onRefresh?: () => void;
}

export default function OverviewTab({ currentApp, onVerifyFee, onRefresh }: OverviewTabProps) {
  const isLowCibil = currentApp.loan_type === 'low_cibil' || currentApp.loan_type === 'Low CIBIL Loan';
  const defaultFee = currentApp.processing_fee || currentApp.fee_amount || (isLowCibil ? 999 : 499);
  const [feeInput, setFeeInput] = useState<string>(defaultFee.toString());
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeSuccessMsg, setFeeSuccessMsg] = useState('');

  // Loan Terms Config State
  const initialAmount = currentApp.approved_amount || currentApp.selected_amount || currentApp.requested_amount || 500000;
  const initialTenure = currentApp.selected_tenure || currentApp.tenure_months || 36;
  const initialRoi = currentApp.indicative_interest_rate || (currentApp.interest_rate_pa ? parseFloat(currentApp.interest_rate_pa) : 8.5);

  const [amountInput, setAmountInput] = useState<string>(initialAmount.toString());
  const [tenureInput, setTenureInput] = useState<string>(initialTenure.toString());
  const [roiInput, setRoiInput] = useState<string>(initialRoi.toString());
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [termsSuccessMsg, setTermsSuccessMsg] = useState('');

  // Linked Real-Time EMI Calculation
  const numAmount = parseFloat(amountInput) || 0;
  const numTenure = parseInt(tenureInput) || 36;
  const numRoi = parseFloat(roiInput) || 8.5;
  const r = (numRoi / 12) / 100;
  const calculatedEmi = (numAmount > 0 && numTenure > 0 && r > 0)
    ? Math.round((numAmount * r * Math.pow(1 + r, numTenure)) / (Math.pow(1 + r, numTenure) - 1))
    : 0;

  const handleSaveTerms = async () => {
    if (numAmount <= 0 || numTenure <= 0 || numRoi <= 0) {
      alert('Please enter valid amount, tenure and interest rate.');
      return;
    }

    setIsSavingTerms(true);
    setTermsSuccessMsg('');
    try {
      await apiRequest(`/admin/applications/${currentApp.id}/configure-terms`, {
        method: 'POST',
        body: JSON.stringify({
          approved_amount: numAmount,
          selected_amount: numAmount,
          selected_tenure: numTenure,
          tenure_months: numTenure,
          indicative_interest_rate: numRoi,
          interest_rate_pa: `${numRoi}% p.a.`,
          monthly_emi: calculatedEmi,
          estimated_emi: calculatedEmi,
        }),
      });
      setTermsSuccessMsg('Loan terms & interest rate updated and linked successfully!');
      if (onRefresh) onRefresh();
      setTimeout(() => setTermsSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update loan terms.');
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleSaveFee = async () => {
    const num = parseFloat(feeInput);
    if (isNaN(num) || num < 0) {
      alert('Please enter a valid fee amount.');
      return;
    }

    setIsSavingFee(true);
    setFeeSuccessMsg('');
    try {
      await apiRequest(`/admin/applications/${currentApp.id}/configure-terms`, {
        method: 'POST',
        body: JSON.stringify({ processing_fee: num, fee_amount: num }),
      });
      setFeeSuccessMsg('Processing fee updated successfully!');
      if (onRefresh) onRefresh();
      setTimeout(() => setFeeSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update processing fee.');
    } finally {
      setIsSavingFee(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Applicant Basic Details Summary (Step 2 Data) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span>Applicant Overview (Step 2 Data)</span>
            </h3>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
              currentApp.loan_type === 'construction_loan' || currentApp.loan_type === 'construction'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : isLowCibil
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {formatLoanType(currentApp.loan_type)}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Full Name (as per PAN):</span>
              <p className="font-bold text-slate-900">{currentApp.full_name || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Mobile Number:</span>
              <p className="font-bold text-slate-900">{currentApp.mobile_number || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Email Address:</span>
              <p className="font-bold text-slate-900">{currentApp.email || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">PAN Card Number:</span>
              <p className="font-mono font-bold text-slate-900">{currentApp.pan_number || currentApp.pan || 'ABCDE1234F'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Aadhaar Number:</span>
              <p className="font-mono font-bold text-slate-900">{currentApp.aadhaar_number || currentApp.aadhaar || 'Not Provided'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Employment & Income:</span>
              <p className="font-bold text-slate-900">{currentApp.employment_type || currentApp.employment || 'Salaried'} • ₹{(currentApp.monthly_income || 40000).toLocaleString('en-IN')}/mo</p>
            </div>
          </div>
        </div>

        {/* Indicative Eligibility & Loan Terms Config (Steps 3-9) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Loan Terms, Tenure & Interest Rate Configuration</span>
            </h3>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
              Admin Configurable
            </span>
          </div>

          {/* Real-time Linked Form */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Approved Amount (₹):</label>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tenure (Months):</label>
                <select
                  value={tenureInput}
                  onChange={(e) => setTenureInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-purple-500"
                >
                  {[6, 12, 18, 24, 36, 48, 60, 120, 180, 240, 300, 360].map((m) => (
                    <option key={m} value={m}>
                      {m < 12 ? `${m} Months` : `${m / 12} Yrs (${m}M)`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Interest Rate (% p.a.):</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  step="0.1"
                  value={roiInput}
                  onChange={(e) => setRoiInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-purple-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 font-bold">Auto-Linked Monthly EMI:</span>
                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  ₹{calculatedEmi.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveTerms}
                disabled={isSavingTerms}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSavingTerms ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Loan Terms</span>
              </button>
            </div>
            {termsSuccessMsg && (
              <p className="text-xs text-emerald-600 font-bold">{termsSuccessMsg}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-4 text-xs">
            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <span className="text-slate-500 font-medium text-[10px] block">Requested Amount</span>
              <p className="font-black text-purple-900 text-sm mt-0.5">₹{(currentApp.requested_amount || 200000).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <span className="text-slate-500 font-medium text-[10px] block">Active Sanctioned Limit</span>
              <p className="font-black text-emerald-900 text-sm mt-0.5">₹{(currentApp.approved_amount || currentApp.selected_amount || 200000).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <span className="text-slate-500 font-medium text-[10px] block">Active Tenure & EMI</span>
              <p className="font-bold text-blue-900 text-sm mt-0.5">{currentApp.selected_tenure || currentApp.tenure_months || 24} Mo • ₹{(currentApp.monthly_emi || currentApp.estimated_emi || calculatedEmi).toLocaleString('en-IN')}/mo</p>
            </div>
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
              <span className="text-slate-500 font-medium text-[10px] block">Active Interest Rate</span>
              <p className="font-bold text-amber-900 text-sm mt-0.5">{currentApp.indicative_interest_rate ? `${currentApp.indicative_interest_rate}% p.a.` : (currentApp.interest_rate_pa || '8.5% p.a.')}</p>
            </div>
          </div>
        </div>

        {/* Service & Processing Fee Overview & Config (Step 10) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Processing Fee Setup & Admin Verification</span>
            </h3>
            {currentApp.fee_payment_status === 'approved' || currentApp.payment_status === 'approved' || currentApp.fee_payment_status?.includes('Verified') ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">
                ✓ Fee Verified & Approved
              </span>
            ) : (
              <button
                onClick={onVerifyFee}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Approve Fee Payment</span>
              </button>
            )}
          </div>

          {/* Admin Custom Fee Configuration */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-700">Set Custom Processing Fee (₹):</span>
              <p className="text-[10px] text-slate-500">Applicant will be charged this exact amount at payment screen (UPI: flipflops@upi)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="0"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                  className="w-28 pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveFee}
                disabled={isSavingFee}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSavingFee ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>
          </div>
          {feeSuccessMsg && (
            <p className="text-xs text-emerald-600 font-bold">{feeSuccessMsg}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Active Fee Amount:</span>
              <p className="font-black text-slate-900">₹{Number(defaultFee).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Payment Status:</span>
              <p className={`font-bold mt-0.5 flex items-center gap-1 ${
                currentApp.fee_payment_status === 'approved' || currentApp.payment_status === 'approved'
                  ? 'text-emerald-700'
                  : currentApp.transaction_id || currentApp.payment_status?.includes('pending')
                  ? 'text-amber-700'
                  : 'text-slate-600'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {currentApp.fee_payment_status || currentApp.payment_status || 'Unpaid'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium text-[10px]">Submitted Transaction ID / UTR:</span>
              <p className="font-mono font-bold text-slate-800">{currentApp.transaction_id || 'Not Submitted Yet'}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

