'use client';

import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

import { formatLoanType } from '@/lib/loan-resume';

interface LoanDetailsTabProps {
  currentApp: any;
}

export default function LoanDetailsTab({ currentApp }: LoanDetailsTabProps) {
  const isLowCibil = currentApp.loan_type === 'low_cibil' || currentApp.loan_type === 'Low CIBIL Loan';

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-600" />
        <span>Complete Loan Details & Financial Breakdown</span>
      </h3>

      {/* Step 3-9 Calculator Details */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Indicative Eligibility (Steps 3–9)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Application Reference</span>
            <p className="font-mono font-black text-slate-900 text-sm">#{currentApp.application_number || currentApp.id}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Loan Category</span>
            <p className="font-bold text-slate-900 text-sm">{formatLoanType(currentApp.loan_type)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Requested Amount</span>
            <p className="font-black text-blue-700 text-base">₹{(currentApp.requested_amount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Sanctioned / Approved Amount</span>
            <p className="font-black text-emerald-700 text-base">₹{(currentApp.approved_amount || currentApp.selected_amount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Tenure Duration</span>
            <p className="font-bold text-slate-900 text-sm">{currentApp.tenure_months || 24} Months</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Monthly EMI</span>
            <p className="font-bold text-slate-900 text-sm">₹{(currentApp.monthly_emi || Math.round((currentApp.requested_amount || 200000)/24)).toLocaleString('en-IN')}/mo</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold text-[10px]">Interest Rate</span>
            <p className="font-bold text-slate-900 text-sm">{currentApp.interest_rate_pa || '14.5% p.a.'}</p>
          </div>
        </div>
      </div>

      {/* Step 11-13 Bank & NBFC Partner Selection */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Partner Selection (Steps 11–13)</h4>
        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold text-[10px]">Selected Partner Bank/NBFC</span>
            <p className="font-black text-blue-900 text-sm mt-0.5">{currentApp.partner_bank || currentApp.selected_partner_name || 'Kotak Mahindra Bank'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold text-[10px]">Target Category</span>
            <p className="font-bold text-blue-900 text-sm mt-0.5">{isLowCibil ? 'Low CIBIL Profile' : 'High CIBIL Profile'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold text-[10px]">Partner Lock Status</span>
            <p className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Locked & Active
            </p>
          </div>
        </div>
      </div>

      {/* Step 15-17 Proof of Submission */}
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Proof of Submission (Steps 15–17)</h4>
        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold text-[10px]">Partner Reference Number</span>
            <p className="font-mono font-black text-amber-900 text-sm mt-0.5">#{currentApp.partner_app_no || `REF${Math.floor(100000 + Math.random()*900000)}`}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold text-[10px]">Portal Application Status</span>
            <p className="font-bold text-amber-900 text-sm mt-0.5">{currentApp.bank_portal_status || 'Pre-Approved / Under Review'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold text-[10px]">Proof Screenshot Upload</span>
            <p className="font-bold text-blue-700 text-sm mt-0.5 underline cursor-pointer">
              lender_confirmation_proof.png
            </p>
          </div>
        </div>
      </div>
      {/* Construction Loan Specification Details */}
      {(currentApp.loan_type === 'construction_loan' || currentApp.loan_type === 'construction' || currentApp.construction_details) && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Construction Loan Technical & Property Specification (19 Required Fields)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">1. Customer Name</span>
              <p className="font-bold text-slate-900">{currentApp.full_name || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">2. Mobile Number</span>
              <p className="font-mono font-bold text-slate-900">{currentApp.mobile_number || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">3. Date of Birth / Age</span>
              <p className="font-bold text-slate-900">{currentApp.dob || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">4. PAN Number</span>
              <p className="font-mono font-bold uppercase text-slate-900">{currentApp.pan_number || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100 md:col-span-2">
              <span className="text-slate-400 font-semibold text-[10px]">5. Residential Address</span>
              <p className="font-bold text-slate-900">{currentApp.address || currentApp.residential_address || 'N/A'}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">6. Occupation</span>
              <p className="font-bold text-slate-900">{currentApp.construction_details?.occupation || currentApp.employment_type || 'Salaried'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">7. Monthly Income</span>
              <p className="font-black text-emerald-700">₹{(currentApp.monthly_income || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">8. Existing EMI / Loans</span>
              <p className="font-bold text-slate-900">₹{(currentApp.existing_emi || 0).toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100 md:col-span-3">
              <span className="text-slate-400 font-semibold text-[10px]">9. Property Address</span>
              <p className="font-bold text-slate-900">{currentApp.construction_details?.property_address || currentApp.loan_purpose || 'N/A'}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">10. Property Ownership</span>
              <p className="font-bold text-slate-900">{currentApp.construction_details?.property_ownership || 'Self'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">11. Plot / Land Area</span>
              <p className="font-bold text-slate-900">{currentApp.construction_details?.plot_area_sqft || '1200'} Sq. Ft.</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">12. Construction Type</span>
              <p className="font-bold text-slate-900">{currentApp.construction_details?.construction_type || 'Residential'}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">13. Current Stage</span>
              <p className="font-bold text-emerald-700">{currentApp.construction_details?.current_construction_stage || 'Planning'}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">14. Estimated Total Cost</span>
              <p className="font-black text-slate-900">₹{parseFloat(currentApp.construction_details?.estimated_total_cost || '2500000').toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">15. Amount Already Spent</span>
              <p className="font-bold text-slate-900">₹{parseFloat(currentApp.construction_details?.amount_already_spent || '300000').toLocaleString('en-IN')}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">16. Own Contribution</span>
              <p className="font-bold text-slate-900">₹{parseFloat(currentApp.construction_details?.own_contribution_available || '500000').toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">17. Loan Amount Required</span>
              <p className="font-black text-emerald-700">₹{(currentApp.requested_amount || currentApp.required_amount || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold text-[10px]">18. Required Loan Tenure</span>
              <p className="font-bold text-slate-900">{currentApp.construction_details?.required_tenure_months || 120} Months</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-100 md:col-span-3">
              <span className="text-slate-400 font-semibold text-[10px]">19. Co-Applicant Status</span>
              <p className="font-bold text-slate-900">
                {currentApp.construction_details?.has_co_applicant === 'Yes'
                  ? `Yes — ${currentApp.construction_details?.co_applicant_name} (${currentApp.construction_details?.co_applicant_relation})`
                  : 'No Co-Applicant (Single Borrower)'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

