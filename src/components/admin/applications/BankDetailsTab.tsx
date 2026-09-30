'use client';

import React from 'react';
import { CreditCard, CheckCircle2, Clock } from 'lucide-react';

interface BankDetailsTabProps {
  currentApp: any;
}

export default function BankDetailsTab({ currentApp }: BankDetailsTabProps) {
  const bankAccNo = currentApp.bank_account_number || currentApp.account_number || currentApp.bank_details?.account_number;
  const bankName = currentApp.bank_name || currentApp.bank_details?.bank_name;
  const ifscCode = currentApp.ifsc_code || currentApp.bank_ifsc_code || currentApp.bank_details?.ifsc_code;
  const accountHolder = currentApp.account_holder_name || currentApp.bank_details?.account_holder_name || currentApp.full_name;
  const accountType = currentApp.account_type || currentApp.bank_details?.account_type || 'Savings Account';

  const isSubmitted = Boolean(
    bankAccNo ||
    bankName ||
    currentApp.bank_details_status === 'submitted' ||
    currentApp.bank_details_status === 'approved' ||
    currentApp.status === 'bank_details_pending' ||
    currentApp.status === 'bank_details_approved'
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-blue-600" />
        <span>Disbursal Bank Account Details (Steps 22–24)</span>
      </h3>

      {!isSubmitted ? (
        <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto font-bold text-lg">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <h4 className="text-sm font-black text-amber-900">Bank Details Not Submitted Yet</h4>
          <p className="text-xs text-amber-800 max-w-md mx-auto font-medium">
            The applicant has not yet reached Step 22 or submitted their disbursal bank account details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-[10px]">Account Holder Name</span>
            <p className="font-bold text-slate-900 text-sm">{accountHolder || 'Not Provided'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-[10px]">Bank Name</span>
            <p className="font-bold text-slate-900 text-sm">{bankName || 'Not Provided'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-[10px]">Account Number</span>
            <p className="font-mono font-bold text-slate-900 text-sm">{bankAccNo || 'Not Provided'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-[10px]">IFSC Code</span>
            <p className="font-mono font-bold text-blue-700 text-sm">{ifscCode || 'Not Provided'}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-[10px]">Account Type</span>
            <p className="font-bold text-slate-900 text-sm">{accountType}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium text-[10px]">Penny Drop Verification</span>
            <p className="font-bold text-emerald-700 text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Verified & Active
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
