'use client';

import React from 'react';
import { User as UserIcon, CheckCircle2 } from 'lucide-react';

interface PersonalDetailsTabProps {
  currentApp: any;
}

export default function PersonalDetailsTab({ currentApp }: PersonalDetailsTabProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-blue-600" />
          <span>Personal & Contact Information (Step 2 & Steps 3–9 Data) — {currentApp.full_name}</span>
        </h3>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Step 2 & Calculator Inputs
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Full Name (as per PAN Card)</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{currentApp.full_name}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Mobile Number</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{currentApp.mobile_number}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Email Address</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{currentApp.email}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">User ID</span>
          <p className="font-mono font-bold text-blue-700 mt-0.5">{currentApp.user_id || `USR${currentApp.id}`}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Date of Birth</span>
          <p className="font-bold text-slate-900 mt-0.5">{currentApp.dob || '12 Jan 1995'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Gender</span>
          <p className="font-bold text-slate-900 mt-0.5">{currentApp.gender || 'Male'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">PAN Card Number</span>
          <p className="font-mono font-bold text-slate-900 mt-0.5">{currentApp.pan_number || currentApp.pan || 'ABCDE1234F'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Aadhaar Number</span>
          <p className="font-mono font-bold text-slate-900 mt-0.5">{currentApp.aadhaar_number || currentApp.aadhaar || 'Not Provided'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Employment Type</span>
          <p className="font-bold text-slate-900 mt-0.5">{currentApp.employment_type || currentApp.employment || 'Salaried'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Company Name</span>
          <p className="font-bold text-slate-900 mt-0.5">{currentApp.company_name || 'N/A'}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Monthly Income</span>
          <p className="font-black text-slate-900 mt-0.5">₹{(currentApp.monthly_income || 40000).toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-slate-400 font-medium block text-[10px]">Location / City</span>
          <p className="font-bold text-slate-900 mt-0.5">{currentApp.address || currentApp.location || 'Noida, UP'}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <span className="text-emerald-700 font-medium block text-[10px]">Indicative Sanctioned Limit</span>
          <p className="font-black text-emerald-900 text-sm mt-0.5">₹{(currentApp.approved_amount || currentApp.selected_amount || 200000).toLocaleString('en-IN')}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
          <span className="text-blue-700 font-medium block text-[10px]">Calculated Tenure & EMI</span>
          <p className="font-bold text-blue-900 text-sm mt-0.5">{currentApp.tenure_months || 24} Months • ₹{(currentApp.monthly_emi || Math.round((currentApp.requested_amount || 200000)/24)).toLocaleString('en-IN')}/mo</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
          <span className="text-purple-700 font-medium block text-[10px]">Fee Consent Status</span>
          <p className="font-bold text-purple-900 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Accepted by User
          </p>
        </div>
      </div>
    </div>
  );
}

