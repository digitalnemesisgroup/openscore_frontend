'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { User, IndianRupee, ArrowRight, RefreshCw, Briefcase, Hammer, Home, MapPin, Users, Layers, ShieldCheck } from 'lucide-react';

function ConstructionApplicantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    // 1. Personal & Contact
    full_name: '',
    mobile_number: '',
    dob: '',
    pan_number: '',
    aadhaar_number: '',
    residential_address: '',

    // 2. Occupation & Income
    occupation: 'Salaried',
    monthly_income: '',
    existing_emi: '0',

    // 3. Property & Construction Details
    property_address: '',
    property_ownership: 'Self',
    plot_area: '1200',
    construction_type: 'Residential',
    current_construction_stage: 'Planning',
    estimated_total_cost: '2500000',
    amount_already_spent: '300000',
    own_contribution_available: '500000',

    // 4. Loan & Co-Applicant
    required_amount: '1500000',
    required_tenure: '120',
    has_co_applicant: 'No',
    co_applicant_name: '',
    co_applicant_relation: 'Spouse',
  });

  const [appId, setAppId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    async function initAndAutoDraftConstruction() {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          full_name: prev.full_name || user.name || '',
          mobile_number: prev.mobile_number || user.mobile || '',
        }));
      }

      try {
        const { resolveTargetAppId } = await import('@/lib/loan-resume');
        const { appId: targetId, appRecord } = await resolveTargetAppId(null, 'construction');

        if (targetId && appRecord) {
          setAppId(targetId);
          if (appRecord.full_name) {
            setFormData((prev) => ({
              ...prev,
              full_name: appRecord.full_name || prev.full_name,
              mobile_number: appRecord.mobile_number || prev.mobile_number,
              pan_number: appRecord.pan_number || prev.pan_number,
              aadhaar_number: appRecord.aadhaar_number || prev.aadhaar_number,
              monthly_income: appRecord.monthly_income ? String(appRecord.monthly_income) : prev.monthly_income,
              required_amount: appRecord.required_amount ? String(appRecord.required_amount) : prev.required_amount,
            }));
          }
          return;
        }

        // Fetch historical profile
        const profileRes = await apiRequest('/loan/applicant-profile');
        if (profileRes && profileRes.profile) {
          const p = profileRes.profile;
          setFormData((prev) => ({
            ...prev,
            pan_number: p.pan_number || prev.pan_number,
            aadhaar_number: p.aadhaar_number || prev.aadhaar_number,
            dob: p.dob || prev.dob,
          }));
        }
      } catch (e) {
        console.error('Failed to fetch applicant profile:', e);
      }
    }

    initAndAutoDraftConstruction();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, pan_number: val }));
  };

  const handleDigitsOnly = (fieldName: string, maxLen: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setFormData((prev) => ({ ...prev, [fieldName]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError('');

    try {
      const loanTypeIdentifier =
        cibilType === 'no_cibil'
          ? 'construction_no_cibil'
          : cibilType === 'low_cibil'
          ? 'construction_low_cibil'
          : 'construction_good_cibil';

      const payload = {
        loan_type: loanTypeIdentifier,
        cibil_type: cibilType,
        consent_accepted: true,
        full_name: formData.full_name.trim(),
        dob: formData.dob,
        mobile_number: formData.mobile_number,
        email: user?.email || `user${formData.mobile_number}@openscore.com`,
        pan_number: formData.pan_number,
        aadhaar_number: formData.aadhaar_number,
        gender: 'Male',
        address: formData.residential_address,
        employment_type: formData.occupation,
        monthly_income: parseFloat(formData.monthly_income),
        existing_emi: parseFloat(formData.existing_emi || '0'),
        required_amount: parseFloat(formData.required_amount),
        loan_purpose: `Construction Loan Details (${cibilType}) - Stage: ${formData.current_construction_stage}, Type: ${formData.construction_type}, Property: ${formData.property_address}`,
        construction_details: {
          occupation: formData.occupation,
          property_address: formData.property_address,
          property_ownership: formData.property_ownership,
          plot_area_sqft: formData.plot_area,
          construction_type: formData.construction_type,
          current_construction_stage: formData.current_construction_stage,
          estimated_total_cost: formData.estimated_total_cost,
          amount_already_spent: formData.amount_already_spent,
          own_contribution_available: formData.own_contribution_available,
          required_tenure_months: formData.required_tenure,
          has_co_applicant: formData.has_co_applicant,
          co_applicant_name: formData.co_applicant_name,
          co_applicant_relation: formData.co_applicant_relation,
          cibil_type: cibilType,
        },
      };

      const res = await apiRequest('/loan/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.status === 'success' && res.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_loan_app_id', res.data.id.toString());
          localStorage.setItem('construction_cibil_type', cibilType);
        }
        router.push(`/loan/apply/construction-loan/indicative-calculator?id=${res.data.id}&cibil_type=${cibilType}`);
      } else {
        setGlobalError(res.message || 'Failed to submit construction loan details.');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Error submitting construction application.');
    } finally {
      setLoading(false);
    }
  };

  const cibilType: 'no_cibil' | 'low_cibil' | 'good_cibil' = 
    (searchParams.get('cibil_type') as any) ||
    (typeof window !== 'undefined' ? (localStorage.getItem('construction_cibil_type') as any) : null) ||
    'low_cibil';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Construction Loan Application Form</span>
        </div>
        <span
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
            cibilType === 'no_cibil'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : cibilType === 'low_cibil'
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          {cibilType === 'no_cibil'
            ? '🔴 RED ZONE (Without CIBIL - Max ₹10 Lakh)'
            : cibilType === 'low_cibil'
            ? '🟠 ORANGE ZONE (Low CIBIL - Max ₹40 Lakh)'
            : '🟢 GREEN ZONE (High CIBIL - Max ₹1 Crore)'}
        </span>
      </div>

      {globalError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {globalError}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. CUSTOMER PERSONAL & CONTACT DETAILS */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
          <User className="w-4 h-4" /> 1. Customer Personal Details
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name (As per PAN) *</label>
          <input
            type="text"
            required
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter customer full name"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
            <input
              type="text"
              required
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleDigitsOnly('mobile_number', 10)}
              placeholder="10-digit mobile"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth / Age *</label>
            <input
              type="date"
              required
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number *</label>
          <input
            type="text"
            required
            maxLength={10}
            name="pan_number"
            value={formData.pan_number}
            onChange={handlePanChange}
            placeholder="ABCDE1234F"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address *</label>
          <textarea
            required
            rows={2}
            name="residential_address"
            value={formData.residential_address}
            onChange={handleChange}
            placeholder="Full current residential address with PIN code"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. OCCUPATION & INCOME */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
          <Briefcase className="w-4 h-4" /> 2. Occupation & Income Profile
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Occupation Type *</label>
          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
          >
            <option value="Salaried">Salaried (Private / Govt)</option>
            <option value="Business">Business Owner / MSME</option>
            <option value="Self Employed">Self Employed Professional</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Income (₹) *</label>
            <input
              type="number"
              required
              min={5000}
              name="monthly_income"
              value={formData.monthly_income}
              onChange={handleChange}
              placeholder="60000"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Existing Monthly EMI (₹)</label>
            <input
              type="number"
              name="existing_emi"
              value={formData.existing_emi}
              onChange={handleChange}
              placeholder="0"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PROPERTY & CONSTRUCTION DETAILS */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
          <Home className="w-4 h-4" /> 3. Construction Property Info
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Property Address *</label>
          <textarea
            required
            rows={2}
            name="property_address"
            value={formData.property_address}
            onChange={handleChange}
            placeholder="Plot / Construction site address & landmark"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Property Ownership *</label>
            <select
              name="property_ownership"
              value={formData.property_ownership}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            >
              <option value="Self">Self / Sole Owner</option>
              <option value="Joint">Joint Ownership</option>
              <option value="Ancestral">Ancestral / Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Plot / Land Area (Sq Ft) *</label>
            <input
              type="number"
              required
              name="plot_area"
              value={formData.plot_area}
              onChange={handleChange}
              placeholder="e.g. 1200"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Construction Type *</label>
            <select
              name="construction_type"
              value={formData.construction_type}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            >
              <option value="Residential">Residential House</option>
              <option value="Commercial">Commercial / Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Construction Stage *</label>
            <select
              name="current_construction_stage"
              value={formData.current_construction_stage}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            >
              <option value="Planning">Planning / Fresh Plot</option>
              <option value="Foundation">Foundation Completed</option>
              <option value="Structure">Brickwork / Roof Slab</option>
              <option value="Finishing">Finishing & Plaster</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Total Construction Cost (₹) *</label>
          <input
            type="number"
            required
            name="estimated_total_cost"
            value={formData.estimated_total_cost}
            onChange={handleChange}
            placeholder="2500000"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Amount Already Spent (₹)</label>
            <input
              type="number"
              name="amount_already_spent"
              value={formData.amount_already_spent}
              onChange={handleChange}
              placeholder="300000"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Own Contribution Available (₹)</label>
            <input
              type="number"
              name="own_contribution_available"
              value={formData.own_contribution_available}
              onChange={handleChange}
              placeholder="500000"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. LOAN AMOUNT & CO-APPLICANT */}
      {/* ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
          <Layers className="w-4 h-4" /> 4. Loan Requirement & Co-Applicant
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount Required (₹) *</label>
            <input
              type="number"
              required
              min={50000}
              max={5000000}
              name="required_amount"
              value={formData.required_amount}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Required Tenure (Months) *</label>
            <select
              name="required_tenure"
              value={formData.required_tenure}
              onChange={handleChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
            >
              <option value="60">60 Months (5 Yrs)</option>
              <option value="120">120 Months (10 Yrs)</option>
              <option value="180">180 Months (15 Yrs)</option>
              <option value="240">240 Months (20 Yrs)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Include Co-Applicant? *</label>
          <select
            name="has_co_applicant"
            value={formData.has_co_applicant}
            onChange={handleChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
          >
            <option value="No">No (Single Applicant)</option>
            <option value="Yes">Yes (Add Co-Applicant)</option>
          </select>
        </div>

        {formData.has_co_applicant === 'Yes' && (
          <div className="grid grid-cols-2 gap-2.5 pt-1 animate-in fade-in">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Co-Applicant Name *</label>
              <input
                type="text"
                required={formData.has_co_applicant === 'Yes'}
                name="co_applicant_name"
                value={formData.co_applicant_name}
                onChange={handleChange}
                placeholder="Co-applicant full name"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relationship *</label>
              <select
                name="co_applicant_relation"
                value={formData.co_applicant_relation}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              >
                <option value="Spouse">Spouse</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Son">Son</option>
                <option value="Brother">Brother</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Calculating Construction Eligibility...</span>
          </>
        ) : (
          <>
            <span>Proceed to Construction Tenure & EMI →</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ConstructionApplicantDetailsPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Loan Details" stepNumber={2} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading form...</div>}>
          <ConstructionApplicantForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}
