'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  User,
  IndianRupee,
  ArrowRight,
  RefreshCw,
  Briefcase,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

function ApplicantDetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const loanType = (searchParams.get('type') as 'no_cibil' | 'low_cibil' | 'good_cibil') || 'no_cibil';

  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    mobile_number: '',
    email: '',
    pan_number: '',
    aadhaar_number: '',
    gender: 'Male',
    employment_type: 'Salaried',
    monthly_income: '',
    required_amount: loanType === 'no_cibil' ? '150000' : loanType === 'low_cibil' ? '200000' : '1000000',
  });

  const [appId, setAppId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Auto-fill user auth details & auto-create loan application in DB on page land
  useEffect(() => {
    async function initAndAutoDraft() {
      if (user) {
        setFormData((prev) => ({
          ...prev,
          full_name: prev.full_name || user.name || '',
          email: prev.email || user.email || '',
          mobile_number: prev.mobile_number || user.mobile || '',
        }));
      }

      // Check if active application already exists in DB
      try {
        const { resolveTargetAppId } = await import('@/lib/loan-resume');
        const { appId: targetId, appRecord } = await resolveTargetAppId(null, 'cash');

        if (targetId && appRecord) {
          setAppId(targetId);
          if (appRecord.full_name) {
            setFormData((prev) => ({
              ...prev,
              full_name: appRecord.full_name || prev.full_name,
              email: appRecord.email || prev.email,
              mobile_number: appRecord.mobile_number || prev.mobile_number,
              pan_number: appRecord.pan_number || prev.pan_number,
              aadhaar_number: appRecord.aadhaar_number || prev.aadhaar_number,
              dob: appRecord.dob || prev.dob,
              gender: appRecord.gender || prev.gender,
              monthly_income: appRecord.monthly_income ? String(appRecord.monthly_income) : prev.monthly_income,
              required_amount: appRecord.required_amount ? String(appRecord.required_amount) : prev.required_amount,
            }));
          }
          return;
        }

        // If no active draft, fetch historical profile to auto-fill (no hardcoded fake data auto-creation)
        const profileRes = await apiRequest('/loan/applicant-profile');
        if (profileRes && profileRes.profile) {
          const p = profileRes.profile;
          setFormData((prev) => ({
            ...prev,
            pan_number: p.pan_number || prev.pan_number,
            aadhaar_number: p.aadhaar_number || prev.aadhaar_number,
            dob: p.dob || prev.dob,
            gender: p.gender || prev.gender,
          }));
        }
      } catch (e) {
        console.error('Failed to fetch applicant profile:', e);
      }
    }

    initAndAutoDraft();
  }, [user, loanType]);

  // Form input change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Specific formatters for PAN, Aadhaar, Mobile
  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, pan_number: val }));
    if (errors.pan_number) setErrors((prev) => ({ ...prev, pan_number: '' }));
  };

  const handleDigitsOnly = (fieldName: string, maxLen: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setFormData((prev) => ({ ...prev, [fieldName]: val }));
    if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: '' }));
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name
    if (!formData.full_name.trim() || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name as per PAN must be at least 3 characters.';
    }

    // DOB (At least 18 years old)
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required.';
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (isNaN(age) || age < 18) {
        newErrors.dob = 'Applicant must be at least 18 years old.';
      } else if (age > 80) {
        newErrors.dob = 'Please enter a valid date of birth.';
      }
    }

    // Mobile Number (10 digits starting 6-9)
    if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Enter a valid 10-digit mobile number starting with 6-9.';
    }

    // Email Address
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    // PAN Card (ABCDE1234F format)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
      newErrors.pan_number = 'Enter a valid 10-character PAN number (e.g. ABCDE1234F).';
    }

    // Aadhaar Number (12 digits)
    if (!/^\d{12}$/.test(formData.aadhaar_number)) {
      newErrors.aadhaar_number = 'Enter a valid 12-digit Aadhaar number.';
    }

    // Monthly Income
    const income = parseFloat(formData.monthly_income);
    if (isNaN(income) || income < 10000) {
      newErrors.monthly_income = 'Monthly income must be at least ₹10,000.';
    }

    // Required Amount
    const reqAmt = parseFloat(formData.required_amount);
    if (isNaN(reqAmt) || reqAmt < 5000) {
      newErrors.required_amount = 'Minimum loan amount is ₹5,000.';
    } else if (loanType === 'no_cibil' && reqAmt > 250000) {
      newErrors.required_amount = 'For Without CIBIL profiles, maximum loan amount is ₹2,50,000 (2.5 Lakhs).';
    } else if (loanType === 'low_cibil' && reqAmt > 400000) {
      newErrors.required_amount = 'For Low CIBIL profiles, maximum loan amount is ₹4,00,000 (4 Lakhs).';
    } else if (loanType === 'good_cibil' && reqAmt > 5000000) {
      newErrors.required_amount = 'For Good CIBIL profiles, maximum loan amount is ₹50,00,000 (50 Lakhs).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateForm()) {
      setGlobalError('Please fix the errors in the form before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        loan_type: loanType,
        consent_accepted: true,
        full_name: formData.full_name.trim(),
        dob: formData.dob,
        mobile_number: formData.mobile_number.trim(),
        email: formData.email.trim(),
        pan_number: formData.pan_number.trim(),
        aadhaar_number: formData.aadhaar_number.trim(),
        gender: formData.gender,
        employment_type: formData.employment_type,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        required_amount: parseFloat(formData.required_amount) || 0,
      };

      const res = await apiRequest('/loan/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_loan_app_id', res.data.id.toString());
        }
        router.push('/loan/apply/indicative-calculator');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to submit applicant details. Please check your data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-36 animate-in fade-in duration-300">
      {/* Step Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full uppercase">
            Step 2 of 26
          </span>
          <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit Encrypted
          </span>
        </div>
        <h1 className="text-lg font-black text-white mt-2">Applicant Basic Details</h1>
        <p className="text-xs text-slate-200 font-medium mt-0.5">
          Profile Category:{' '}
          <span className={`font-extrabold ${loanType === 'no_cibil' ? 'text-rose-400' : loanType === 'low_cibil' ? 'text-orange-400' : 'text-emerald-400'}`}>
            {loanType === 'no_cibil'
              ? 'Without CIBIL Profile (RED ZONE - Max ₹2.5 Lakh)'
              : loanType === 'low_cibil'
              ? 'Low CIBIL Profile (ORANGE ZONE - Max ₹4 Lakh)'
              : 'Good CIBIL Profile (GREEN ZONE - Max ₹50 Lakh)'}
          </span>
        </p>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* SECTION 1: PERSONAL IDENTIFICATION */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Personal Identification
            </h2>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Full Name (As per PAN Card) *
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. RAHUL SHARMA"
              className={`w-full p-3 bg-slate-50 border ${
                errors.full_name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
              } rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
            />
            {errors.full_name && (
              <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Gender & DOB */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Date of Birth *</label>
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                onChange={handleChange}
                className={`w-full p-3 bg-slate-50 border ${
                  errors.dob ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                } rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
              />
              {errors.dob && <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.dob}</p>}
            </div>
          </div>

          {/* Mobile Number & Email */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Mobile Number *</label>
              <input
                type="tel"
                name="mobile_number"
                required
                maxLength={10}
                value={formData.mobile_number}
                onChange={handleDigitsOnly('mobile_number', 10)}
                placeholder="10 digit mobile"
                className={`w-full p-3 bg-slate-50 border ${
                  errors.mobile_number ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                } rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
              />
              {errors.mobile_number && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.mobile_number}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@email.com"
                className={`w-full p-3 bg-slate-50 border ${
                  errors.email ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                } rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
              />
              {errors.email && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* PAN Card & Aadhaar Number */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">PAN Card Number *</label>
              <input
                type="text"
                name="pan_number"
                required
                maxLength={10}
                value={formData.pan_number}
                onChange={handlePanChange}
                placeholder="ABCDE1234F"
                className={`w-full p-3 bg-slate-50 border ${
                  errors.pan_number ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                } rounded-xl text-xs font-mono font-black uppercase tracking-wider text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
              />
              {errors.pan_number && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.pan_number}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Aadhaar Number *</label>
              <input
                type="text"
                name="aadhaar_number"
                required
                maxLength={12}
                value={formData.aadhaar_number}
                onChange={handleDigitsOnly('aadhaar_number', 12)}
                placeholder="12 digit Aadhaar"
                className={`w-full p-3 bg-slate-50 border ${
                  errors.aadhaar_number ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                } rounded-xl text-xs font-mono font-black tracking-wider text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
              />
              {errors.aadhaar_number && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.aadhaar_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: INCOME & LOAN REQUIREMENT */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Income & Loan Details
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Employment Type *</label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Monthly Income (₹) *</label>
              <input
                type="number"
                name="monthly_income"
                required
                value={formData.monthly_income}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className={`w-full p-3 bg-slate-50 border ${
                  errors.monthly_income ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200'
                } rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
              />
              {errors.monthly_income && (
                <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.monthly_income}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Required Loan Amount (₹) *
            </label>
            <input
              type="number"
              name="required_amount"
              required
              value={formData.required_amount}
              onChange={handleChange}
              placeholder={loanType === 'low_cibil' ? 'Max ₹4,00,000' : 'Max ₹50,00,000'}
              className={`w-full p-3.5 bg-slate-50 border-2 ${
                errors.required_amount ? 'border-rose-500 bg-rose-50/20' : 'border-blue-500'
              } rounded-xl text-sm font-black text-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none`}
            />
            {errors.required_amount ? (
              <p className="text-[11px] font-bold text-rose-600 mt-1">{errors.required_amount}</p>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                {loanType === 'low_cibil'
                  ? 'Maximum limit for Low CIBIL profiles is ₹4,00,000.'
                  : 'Maximum limit for Good CIBIL profiles is ₹50,00,000.'}
              </p>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] border border-blue-400/30"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Calculating Indicative Eligibility...</span>
            </>
          ) : (
            <>
              <span>Check Indicative Eligibility →</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ApplicantDetailsPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Applicant Details" stepNumber={2} backHref="/loan/apply/cash-loan" />
      <div className="flex-1 overflow-y-auto min-h-0">
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading application form...</div>}>
          <ApplicantDetailsForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}
