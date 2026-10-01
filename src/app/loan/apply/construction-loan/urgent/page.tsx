'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  Zap,
  Building2,
  User,
  IndianRupee,
  FileText,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function UrgentConstructionLoanFormPage() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 1. Loan & Construction Project Details
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [constructionPurpose, setConstructionPurpose] = useState<string>('');
  const [estimatedProjectCost, setEstimatedProjectCost] = useState<number>(0);

  // 2. Property Details
  const [propertyType, setPropertyType] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [propertyCity, setPropertyCity] = useState<string>('');
  const [propertyState, setPropertyState] = useState<string>('');
  const [propertyPincode, setPropertyPincode] = useState<string>('');

  // 3. Applicant Personal Details
  const [fullName, setFullName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [residentialAddress, setResidentialAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');

  // 4. Income Details
  const [employmentType, setEmploymentType] = useState<string>('Salaried');
  const [companyName, setCompanyName] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [existingEmi, setExistingEmi] = useState<number>(0);
  const [workExperience, setWorkExperience] = useState<string>('');

  // 5. Document Uploads State
  const [documents, setDocuments] = useState<{ [key: string]: { name: string; uploaded: boolean; base64?: string } }>({});

  // 6. Disbursement Bank Details
  const [bankAccountHolder, setBankAccountHolder] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [bankAccountType, setBankAccountType] = useState<string>('Savings');


  const handleFileUpload = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocuments((prev) => ({
        ...prev,
        [docKey]: {
          name: file.name,
          uploaded: true,
          base64: event.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (docKey: string) => {
    setDocuments((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !mobileNumber.trim() || !panNumber.trim() || !aadhaarNumber.trim()) {
      setError('Please fill all mandatory personal & KYC details.');
      return;
    }
    if (!propertyAddress.trim()) {
      setError('Please provide the construction site / property address.');
      return;
    }
    if (!bankAccountNumber.trim() || !bankIfsc.trim() || !bankName.trim()) {
      setError('Please provide complete disbursement bank account details.');
      return;
    }

    setLoading(true);

    try {
      // Strip base64 preview data from documents before sending - Hostinger WAF blocks large payloads
      const sanitizedDocs = Object.fromEntries(
        Object.entries(documents).map(([key, val]: [string, any]) => [
          key,
          { name: val.name, path: val.path, size: val.size, uploaded: val.uploaded }
        ])
      );

      const res = await apiRequest('/loan/urgent-construction/apply', {
        method: 'POST',
        body: JSON.stringify({
          required_amount: loanAmount,
          construction_purpose: constructionPurpose,
          estimated_project_cost: estimatedProjectCost,
          property_type: propertyType,
          property_address: propertyAddress.trim(),
          property_city: propertyCity.trim() || city.trim(),
          property_state: propertyState || state,
          property_pincode: propertyPincode.trim() || pinCode.trim(),
          full_name: fullName.trim(),
          dob: dob || '1995-01-01',
          gender: gender,
          mobile_number: mobileNumber.trim(),
          email: email.trim(),
          pan_number: panNumber.trim().toUpperCase(),
          aadhaar_number: aadhaarNumber.trim(),
          address: residentialAddress.trim() || propertyAddress.trim(),
          city: city.trim() || propertyCity.trim(),
          state: state || propertyState,
          pin_code: pinCode.trim() || propertyPincode.trim(),
          employment_type: employmentType,
          company_name: companyName.trim() || 'Self Employed / Business',
          monthly_income: monthlyIncome,
          existing_emi: existingEmi,
          work_experience: workExperience,
          documents_uploaded: sanitizedDocs,
          bank_account_holder_name: bankAccountHolder.trim() || fullName.trim(),
          bank_name: bankName.trim(),
          bank_account_number: bankAccountNumber.trim(),
          bank_ifsc_code: bankIfsc.trim().toUpperCase(),
          bank_account_type: bankAccountType,
        }),
      });

      if (res && res.data) {
        const appId = res.data.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_urgent_loan_app_id', String(appId));
          if (mobileNumber.trim()) {
            localStorage.setItem('user_mobile', mobileNumber.trim());
          }
        }
        router.push(`/loan/apply/construction-loan/urgent/validate?id=${appId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit Urgent Construction Loan application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Elite Construction Loan" stepNumber={1} backHref="/loan/apply/construction-loan" />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Header Title Card */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 rounded-3xl shadow-md space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-100 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>Fast-Track Express Application</span>
          </div>
          <h1 className="text-xl font-black">Elite Construction Loan</h1>
          <p className="text-xs text-amber-100 font-medium">
            Fill required details, property information &amp; documents for instant review (Up to ₹1 Crore).
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SECTION 1: LOAN & PROJECT DETAILS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              <IndianRupee className="w-4 h-4 text-amber-600" />
              <span>1. Loan Amount &amp; Construction Purpose</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Required Loan Amount (₹) *</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Min: ₹50K • Max: ₹1Cr</span>
                </div>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    min={50000}
                    max={10000000}
                    step={10000}
                    value={loanAmount || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLoanAmount(val);
                    }}
                    placeholder="Enter required loan amount (e.g. 500000)"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                {/* SLIDER CONTROLLER */}
                <div className="mt-2.5 space-y-1">
                  <input
                    type="range"
                    min="50000"
                    max="10000000"
                    step="25000"
                    value={loanAmount || 50000}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>₹50,000</span>
                    <span className="text-amber-700 font-black">₹{(loanAmount || 0).toLocaleString('en-IN')}</span>
                    <span>₹1,00,00,000</span>
                  </div>
                </div>

                {/* QUICK PRESET CHIPS */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                  {[200000, 500000, 1000000, 2500000, 5000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLoanAmount(preset)}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all shrink-0 ${
                        loanAmount === preset
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      ₹{preset >= 10000000 ? `${preset / 10000000}Cr` : `${preset / 100000}L`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Construction Purpose *</label>
                <select
                  value={constructionPurpose}
                  onChange={(e) => setConstructionPurpose(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="New Residential Construction">New Residential Construction</option>
                  <option value="Home Extension / Floor Addition">Home Extension / Floor Addition</option>
                  <option value="Commercial Shop / Complex Construction">Commercial Shop / Complex Construction</option>
                  <option value="Renovation & Modernization">Renovation &amp; Modernization</option>
                  <option value="Plot Purchase + Construction">Plot Purchase + Construction</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Estimated Project Cost (₹)</label>
                <input
                  type="number"
                  value={estimatedProjectCost}
                  onChange={(e) => setEstimatedProjectCost(Number(e.target.value))}
                  placeholder="e.g. 1500000"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PROPERTY & SITE DETAILS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>2. Property &amp; Site Details</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Property / Plot Type *</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Independent Residential Plot">Independent Residential Plot</option>
                  <option value="Under-construction House">Under-construction House</option>
                  <option value="Agricultural Land with NA Order">Agricultural Land with NA Order</option>
                  <option value="Commercial Plot / Property">Commercial Plot / Property</option>
                  <option value="Builder Floor / Villa Plot">Builder Floor / Villa Plot</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Property / Construction Site Address *</label>
                <textarea
                  rows={2}
                  required
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="Complete site address with Plot/Survey No., Landmark, Locality"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    value={propertyCity}
                    onChange={(e) => setPropertyCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={propertyPincode}
                    onChange={(e) => setPropertyPincode(e.target.value)}
                    placeholder="e.g. 411001"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: APPLICANT DETAILS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-purple-600" />
              <span>3. Applicant Personal &amp; KYC</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Full Name (as per PAN) *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (!bankAccountHolder) setBankAccountHolder(e.target.value);
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10-Digit Mobile"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
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
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">PAN Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Aadhaar Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="12-Digit Aadhaar"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: INCOME & EMPLOYMENT */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>4. Income &amp; Employment Details</span>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Employment Type *</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Salaried">Salaried</option>
                    <option value="Self-Employed Professional">Self-Employed Professional</option>
                    <option value="Business Owner / Contractor">Business Owner / Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Company / Business Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Employer / Firm Name"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Monthly Net Income (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Existing Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={existingEmi}
                    onChange={(e) => setExistingEmi(Number(e.target.value))}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: DOCUMENT UPLOADS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>5. Document Uploads</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'aadhaar_card', label: 'Aadhaar Card (Front/Back)' },
                { key: 'pan_card', label: 'PAN Card Copy' },
                { key: 'property_proof', label: 'Property Registry / 7-12 / Khata' },
                { key: 'construction_estimate', label: 'Construction Estimate / Map' },
                { key: 'bank_statement', label: 'Bank Statement / ITR (3 Months)' },
                { key: 'applicant_selfie', label: 'Applicant Photo / Selfie' },
              ].map((doc) => {
                const isUploaded = !!documents[doc.key]?.uploaded;
                return (
                  <div
                    key={doc.key}
                    className={`p-3 rounded-2xl border transition-all ${
                      isUploaded ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-black text-slate-900">{doc.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {isUploaded ? documents[doc.key].name : 'PDF, JPG, PNG'}
                        </p>
                      </div>

                      {isUploaded ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.key)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-amber-500 text-slate-700 rounded-xl text-[10px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs">
                          <Upload className="w-3 h-3 text-amber-600" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(doc.key, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: DISBURSEMENT BANK DETAILS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>6. Disbursement Bank Details</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="As printed in bank passbook"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Account Type</label>
                  <select
                    value={bankAccountType}
                    onChange={(e) => setBankAccountType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">Bank Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Account Number"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing Urgent Application...</span>
              </>
            ) : (
              <>
                <span>Submit &amp; Proceed to Fee Payment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </MobileContainer>
  );
}
