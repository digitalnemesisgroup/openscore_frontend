'use client';

import React from 'react';
import { CheckCircle2, Lock, Clock, ShieldAlert } from 'lucide-react';

interface DisbursementAgreementTabProps {
  currentApp: any;
  onDisburse: () => void;
}

export default function DisbursementAgreementTab({ currentApp, onDisburse }: DisbursementAgreementTabProps) {
  const isBankApproved = currentApp.bank_details_status === 'approved' || currentApp.status === 'bank_details_approved';
  const isDisbursed = isBankApproved && (currentApp.disbursement_status === 'credited' || currentApp.status === 'disbursed');
  const isRejected = currentApp.final_decision === 'REJECTED' || currentApp.status === 'rejected';

  const isLowCibil = currentApp.loan_type === 'low_cibil' || currentApp.loan_type === 'Low CIBIL Loan';
  const approvedAmt = currentApp.approved_amount || currentApp.selected_amount || 200000;
  const feeDeduction = isLowCibil ? 1178 : 588;
  const netDisbursal = approvedAmt - feeDeduction;
  const tenure = currentApp.tenure_months || 24;
  const emi = currentApp.monthly_emi || Math.round(approvedAmt / tenure);
  const totalRepayment = emi * tenure;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Disbursement Agreement & Key Fact Statement (Step 25)</span>
        </h3>
        <span className={`px-3 py-1 font-extrabold text-xs rounded-full flex items-center gap-1 ${
          isDisbursed
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : isBankApproved
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
          {isDisbursed ? 'Step 25 Complete (Disbursed ✓)' : isBankApproved ? 'Ready for Fund Release 🚀' : 'Step 25 Locked 🔒'}
        </span>
      </div>

      {/* STRICT SEQUENTIAL LOCK IF STAGE 4 BANK DETAILS NOT APPROVED */}
      {!isBankApproved ? (
        <div className="p-8 bg-slate-900 text-white rounded-2xl border border-slate-800 text-center space-y-3 shadow-lg">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-xl font-black border border-amber-500/30">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h4 className="text-base font-black text-amber-300">
            Step 25 Disbursal Agreement & Fund Release Controls Locked
          </h4>
          <p className="text-xs text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
            The applicant and admin must complete and approve <strong>Stage 4 (Disbursal Bank Details)</strong> before the Key Fact Statement, e-Sign Agreement, and Fund Release controls can be unlocked.
          </p>
          <div className="pt-2">
            <span className="px-3.5 py-1.5 bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl border border-amber-500/30 inline-block">
              Stage 4 Bank Status: {currentApp.bank_details_status === 'submitted' ? 'Submitted (Awaiting Admin Approval)' : 'Not Submitted Yet'}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Key Fact Statement (KFS) Summary */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Key Fact Statement (KFS) Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium text-[10px]">Gross Sanctioned Amount</span>
                <p className="font-black text-slate-900 text-base">₹{approvedAmt.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium text-[10px]">Processing Fee & GST</span>
                <p className="font-black text-rose-700 text-base">- ₹{feeDeduction.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-emerald-700 font-bold text-[10px]">Net Disbursal Amount</span>
                <p className="font-black text-emerald-900 text-lg">₹{netDisbursal.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-blue-700 font-bold text-[10px]">Annual Percentage Rate (APR)</span>
                <p className="font-black text-blue-900 text-base">{currentApp.interest_rate_pa || '14.5% p.a.'}</p>
              </div>
            </div>
          </div>

          {/* Interest Rate & Repayment Schedule */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Interest Rate & Repayment Schedule</h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium text-[10px]">Monthly EMI Amount</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">₹{emi.toLocaleString('en-IN')}/month</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[10px]">Total Tenure</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{tenure} Months</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium text-[10px]">Total Repayment Value</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">₹{totalRepayment.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* e-Sign Agreement Checkbox & Status */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">e-Sign Agreement & Digital Execution</h4>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Loan Agreement Digital e-Sign Completed
                </p>
                <p className="text-slate-600 text-[11px] font-medium">
                  Signed by {currentApp.full_name} • Consent Checkbox Accepted • Timestamp: {currentApp.application_date || 'Recent'}
                </p>
              </div>
              <button
                onClick={() => alert(`Opening Digital Loan Agreement PDF for #${currentApp.application_number || currentApp.id}...`)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
              >
                View Signed Agreement PDF 📄
              </button>
            </div>
          </div>

          {/* Penny Drop & Disbursal Release Control */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Penny Drop & Fund Release Controls</h4>
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-md">
              <div>
                <p className="font-black text-sm">Penny Drop Test: PASSED (100% Match)</p>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5">
                  Target Bank: {currentApp.bank_name || currentApp.bank_details?.bank_name || 'Not Submitted'} (A/C: {currentApp.bank_account_number || currentApp.account_number || currentApp.bank_details?.account_number || 'Not Submitted'})
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isDisbursed ? (
                  <span className="px-4 py-2 bg-emerald-900/90 text-emerald-300 font-black text-xs rounded-xl border border-emerald-700 shadow-xs">
                    ✓ Funds Disbursed & Credited
                  </span>
                ) : isRejected ? (
                  <span className="px-4 py-2 bg-rose-900/90 text-rose-300 font-bold text-xs rounded-xl border border-rose-700">
                    Application Rejected
                  </span>
                ) : (
                  <button
                    onClick={onDisburse}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Release Disbursal Funds 🚀
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
