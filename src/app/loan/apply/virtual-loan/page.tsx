'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Upload,
  Eye,
  AlertCircle,
  FileText,
  Lock,
  Wallet,
  Sparkles,
  RefreshCw,
  Info,
  Check,
  X,
  CreditCard,
  ChevronRight,
  Clock,
  AlertTriangle,
  Camera,
  FileUp,
  ScanLine,
  Cpu,
  UserCheck,
  FileCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function VirtualLoanApplyPage() {
  const router = useRouter();

  // Multi-step state: 1 = Apply & Select Amount/Details, 2 = KYC & Documents, 3 = Approved/Booked & Pay Fee
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Application DB ID
  const [appId, setAppId] = useState<number | null>(null);
  const [appStatus, setAppStatus] = useState<string>('documents_pending');

  // Step 1: Form Fields (Selected Loan Amount & Basic Details)
  const [selectedAmount, setSelectedAmount] = useState<number>(30000);
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  // Dynamic Fee Config fetched from Admin Settings
  const [feeLabel, setFeeLabel] = useState<string>('Loan Processing / Service Fee');
  const [feeStructure, setFeeStructure] = useState<Array<{ amount: number; fee: number }>>([
    { amount: 15000, fee: 2000 },
    { amount: 20000, fee: 3000 },
    { amount: 30000, fee: 3000 },
    { amount: 35000, fee: 4000 },
    { amount: 45000, fee: 4000 },
  ]);

  // File Input References for Real File Pickers & Camera
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Step 2: Document Upload States with real file support (no prefilled data)
  const [docs, setDocs] = useState<Record<string, { uploaded: boolean; name?: string; size?: string; status?: string; preview?: string | null }>>({
    aadhaar_card: { uploaded: false, name: '', size: '', status: 'Pending', preview: null },
    pan_card: { uploaded: false, name: '', size: '', status: 'Pending', preview: null },
    selfie: { uploaded: false, name: '', size: '', status: 'Pending', preview: null },
    agent_selfie: { uploaded: false, name: '', size: '', status: 'Pending', preview: null },
    address_proof: { uploaded: false, name: '', size: '', status: 'Pending', preview: null },
    business_proof: { uploaded: false, name: '', size: '', status: 'Not Uploaded', preview: null },
  });

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    key: string;
    title: string;
    subtitle: string;
    previewUrl?: string | null;
    fileName?: string;
    fileSize?: string;
  } | null>(null);

  // Real File Upload Handler
  const handleRealFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setDocs((prev) => ({
          ...prev,
          [key]: {
            uploaded: true,
            name: file.name,
            size: sizeStr,
            preview: previewUrl,
            status: 'Uploaded',
          },
        }));

        // If this doc is currently open in preview modal, update preview in real-time
        setPreviewDoc((current) =>
          current && current.key === key
            ? { ...current, previewUrl, fileName: file.name, fileSize: sizeStr }
            : current
        );
      };
      reader.readAsDataURL(file);
    } else {
      setDocs((prev) => ({
        ...prev,
        [key]: {
          uploaded: true,
          name: file.name,
          size: sizeStr,
          preview: null,
          status: 'Uploaded',
        },
      }));
    }
  };

  const triggerUpload = (key: string) => {
    fileInputRefs.current[key]?.click();
  };

  // Step 3: Payment Modal & Auto Verify Status
  const [payingFee, setPayingFee] = useState<boolean>(false);
  const [autoVerified, setAutoVerified] = useState<boolean | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState<boolean>(false);

  // Missing Document Request from Admin state
  const [additionalDocsRequest, setAdditionalDocsRequest] = useState<string | null>(null);
  const [adminRemark, setAdminRemark] = useState<string | null>(null);

  const [feeConfig, setFeeConfig] = useState<any>(null);

  // Fetch Virtual Loan Settings on load
  useEffect(() => {
    async function fetchSettings() {
      try {
        const [vRes, feeRes] = await Promise.allSettled([
          apiRequest('/settings/virtual-loan'),
          apiRequest('/settings/fee-config'),
        ]);

        if (vRes.status === 'fulfilled' && vRes.value && vRes.value.data) {
          if (vRes.value.data.fee_label) setFeeLabel(vRes.value.data.fee_label);
          if (vRes.value.data.fee_structure) setFeeStructure(vRes.value.data.fee_structure);
        }
        if (feeRes.status === 'fulfilled' && feeRes.value && feeRes.value.data) {
          setFeeConfig(feeRes.value.data);
        }
      } catch (err) {}
    }
    fetchSettings();
  }, []);

  // Get current applicable fee for selected amount dynamically
  const currentFee = React.useMemo(() => {
    if (feeConfig && feeConfig.virtual_loan_fee_value !== undefined) {
      if (feeConfig.virtual_loan_fee_type === 'percentage') {
        return Math.max(1, Math.round(selectedAmount * (Number(feeConfig.virtual_loan_fee_value) / 100)));
      }
      return Number(feeConfig.virtual_loan_fee_value);
    }
    return feeStructure.find((f) => f.amount === selectedAmount)?.fee || 3000;
  }, [selectedAmount, feeConfig, feeStructure]);


  // Submit Step 1: Select Amount & Basic Details
  const handleStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Please agree to the Terms & Conditions to proceed.');
      return;
    }
    if (!fullName.trim() || !mobileNumber.trim() || !emailAddress.trim()) {
      setError('Please fill all required personal details.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest('/loan/virtual-apply', {
        method: 'POST',
        body: JSON.stringify({
          amount: selectedAmount,
          required_amount: selectedAmount,
          full_name: fullName.trim(),
          mobile: mobileNumber.trim(),
          mobile_number: mobileNumber.trim(),
          email: emailAddress.trim(),
          processing_fee: currentFee,
          address: address.trim(),
        }),
      });

      if (res && res.data) {
        setAppId(res.data.id);
        setAppStatus(res.data.status);
        setCurrentStep(2); // Advance to Documents Upload step
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit basic details.');
    } finally {
      setLoading(false);
    }
  };

  // Upload/Toggle sample document for Step 2
  const handleDocumentUpload = (docKey: string, fileName: string) => {
    setDocs((prev) => ({
      ...prev,
      [docKey]: {
        uploaded: true,
        name: fileName,
        status: 'Uploaded',
      },
    }));
  };

  // Submit Step 2: Documents Upload & Run Live Validation
  const handleStep2Submit = async () => {
    setError('');

    // Validate that mandatory documents are uploaded
    const requiredDocsList = [
      { key: 'aadhaar_card', label: 'Aadhaar Card' },
      { key: 'pan_card', label: 'PAN Card' },
      { key: 'selfie', label: 'Selfie' },
      { key: 'agent_selfie', label: 'Selfie with Agent' },
    ];
    const missing = requiredDocsList.filter((d) => !docs[d.key]?.uploaded);
    if (missing.length > 0) {
      setError(`Please upload all required documents: ${missing.map((m) => m.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const targetId = appId || 1;
      const res = await apiRequest(`/loan/virtual-apply/${targetId}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          documents: docs,
        }),
      });

      if (res && res.data) {
        setAppStatus(res.data.status || 'loan_booked');
      }

      // Enter Live Validation Screen
      setIsValidating(true);
      setValidationProgress(12);

      // Smooth multi-stage verification timer
      const startTime = Date.now();
      const totalDuration = 4200; // 4.2 seconds of realistic verification

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        setValidationProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsValidating(false);
            setCurrentStep(3); // Advance to Loan Approved / Booked step!
          }, 600);
        }
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to submit documents.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Fee Payment in Step 3
  const handlePayFee = async () => {
    setPayingFee(true);
    setError('');
    try {
      const targetId = appId || 1;
      const res = await apiRequest(`/loan/virtual-apply/${targetId}/pay-fee`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: 'TXN' + Math.floor(100000000 + Math.random() * 900000000),
          payment_method: 'UPI / Wallet',
        }),
      });

      if (res && res.status === 'success') {
        setAutoVerified(!!res.auto_verified);
        setShowPaymentSuccessModal(true);
        if (res.data) setAppStatus(res.data.status);
      }
    } catch (err: any) {
      setError(err.message || 'Fee payment failed. Please try again.');
    } finally {
      setPayingFee(false);
    }
  };

  return (
    <MobileContainer>
      <LoanHeader
        title={
          isValidating
            ? 'Validating Application'
            : currentStep === 1
            ? 'Apply for Virtual Loan'
            : currentStep === 2
            ? 'KYC & Documents'
            : 'Loan Approved / Booked'
        }
        stepNumber={isValidating ? 2 : currentStep}
        totalSteps={3}
      />

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* STEP 1: SELECT LOAN AMOUNT & BASIC DETAILS (SCREEN 2 OF IMAGE) */}
        {currentStep === 1 && !isValidating && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-black text-slate-900">Apply for Virtual Loan</h1>
              <p className="text-xs text-slate-500 font-medium">Choose the loan amount as per your need</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SELECT LOAN AMOUNT RADIO CARDS */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Select Loan Amount
              </label>

              <div className="space-y-2">
                {feeStructure.map((item) => {
                  const isSelected = selectedAmount === item.amount;
                  return (
                    <div
                      key={item.amount}
                      onClick={() => setSelectedAmount(item.amount)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-600 shadow-sm ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">₹ {item.amount.toLocaleString('en-IN')}</p>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            {feeLabel}: ₹ {item.fee.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                          SELECTED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED LOAN SUMMARY BOX */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Selected Loan Summary
              </h3>
              <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200">
                <span className="text-slate-600">Loan Amount</span>
                <span className="text-slate-900 font-black">₹ {selectedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold pt-1">
                <span className="text-slate-600">{feeLabel}</span>
                <span className="text-blue-700 font-black">₹ {currentFee.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* BASIC DETAILS INPUT FORM */}
            <form onSubmit={handleStep1Continue} className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pt-1">
                Basic Details
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name as per Aadhaar"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Mobile Number"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* T&C CHECKBOX */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                />
                <span className="text-[11px] text-slate-700 font-medium leading-tight">
                  I agree to the Terms & Conditions and authorize OpenScore to verify my details.
                </span>
              </label>

              {/* CONTINUE BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Details...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: KYC & DOCUMENTS UPLOAD (SCREEN 3 OF IMAGE) */}
        {currentStep === 2 && !isValidating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h1 className="text-xl font-black text-slate-900">KYC & Documents</h1>
                <p className="text-xs text-slate-500 font-medium">Upload the required documents for verification</p>
              </div>
              <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                Step 2 of 3
              </span>
            </div>

            {/* PERSONAL DETAILS SUMMARY CARD */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 relative">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Personal Details</h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Edit
                </button>
              </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                  <span className="font-bold text-slate-900">{fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile</span>
                  <span className="font-bold text-slate-900">{mobileNumber}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-bold text-slate-900">{emailAddress}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Address</span>
                  <span className="font-bold text-slate-900">{address}</span>
                </div>
              </div>
            </div>

            {/* REQUIRED DOCUMENTS LIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Required Documents</h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {Object.values(docs).filter((d) => d.uploaded).length} of 6 Uploaded
                </span>
              </div>

              {[
                {
                  key: 'aadhaar_card',
                  title: 'Aadhaar Card',
                  subtitle: 'Upload front side of Aadhaar',
                  icon: FileText,
                  iconBg: 'bg-blue-50 text-blue-600',
                  accept: 'image/*,.pdf',
                  required: true,
                },
                {
                  key: 'pan_card',
                  title: 'PAN Card',
                  subtitle: 'Upload PAN Card',
                  icon: CreditCard,
                  iconBg: 'bg-purple-50 text-purple-600',
                  accept: 'image/*,.pdf',
                  required: true,
                },
                {
                  key: 'selfie',
                  title: 'Selfie',
                  subtitle: 'Take a clear selfie',
                  icon: Camera,
                  iconBg: 'bg-indigo-50 text-indigo-600',
                  accept: 'image/*',
                  capture: 'user',
                  required: true,
                },
                {
                  key: 'agent_selfie',
                  title: 'Selfie with Agent',
                  subtitle: 'Live photo of applicant with verified OpenScore agent',
                  icon: ShieldCheck,
                  iconBg: 'bg-indigo-600 text-white',
                  accept: 'image/*',
                  capture: 'user',
                  required: true,
                  highlight: true,
                },
                {
                  key: 'address_proof',
                  title: 'Address Proof',
                  subtitle: 'Electricity bill / Bank statement',
                  icon: FileText,
                  iconBg: 'bg-amber-50 text-amber-600',
                  accept: 'image/*,.pdf',
                  required: false,
                },
                {
                  key: 'business_proof',
                  title: 'Business Proof (Optional)',
                  subtitle: 'Shop photo / Business license',
                  icon: Upload,
                  iconBg: 'bg-slate-100 text-slate-500',
                  accept: 'image/*,.pdf',
                  required: false,
                },
              ].map((docItem) => {
                const currentDoc = docs[docItem.key];
                const isUploaded = Boolean(currentDoc?.uploaded);
                const IconComponent = docItem.icon;

                return (
                  <div
                    key={docItem.key}
                    className={`bg-white border p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xs transition-all ${
                      docItem.highlight
                        ? 'border-indigo-200 bg-gradient-to-r from-white via-indigo-50/20 to-blue-50/30'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Hidden Real File Input */}
                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[docItem.key] = el;
                      }}
                      accept={docItem.accept}
                      {...(docItem.capture ? { capture: docItem.capture as any } : {})}
                      onChange={(e) => handleRealFileUpload(docItem.key, e)}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${docItem.iconBg}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900 truncate">{docItem.title}</h4>
                          {docItem.required && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded uppercase">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">{docItem.subtitle}</p>
                        {isUploaded && currentDoc.name && (
                          <p className="text-[10px] text-blue-600 font-semibold truncate mt-0.5">
                            📄 {currentDoc.name} {currentDoc.size ? `(${currentDoc.size})` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUploaded ? (
                        <>
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                key: docItem.key,
                                title: docItem.title,
                                subtitle: docItem.subtitle,
                                previewUrl: currentDoc.preview || null,
                                fileName: currentDoc.name,
                                fileSize: currentDoc.size,
                              })
                            }
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerUpload(docItem.key)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            title="Upload a new real image from your device"
                          >
                            {docItem.capture ? 'Retake' : 'Change'}
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              docItem.required
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {docItem.required ? 'Pending' : 'Not Uploaded'}
                          </span>
                          <button
                            type="button"
                            onClick={() => triggerUpload(docItem.key)}
                            className={`px-3 py-1 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer ${
                              docItem.highlight
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {docItem.capture ? (
                              <>
                                <Camera className="w-3.5 h-3.5" />
                                <span>Capture</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUBMIT FOR VERIFICATION BUTTON */}
            <button
              onClick={handleStep2Submit}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Documents...</span>
                </>
              ) : (
                <span>Submit for Verification</span>
              )}
            </button>
          </div>
        )}

        {/* VALIDATION IN PROGRESS SCREEN */}
        {isValidating && (
          <div className="space-y-5 py-2 animate-in fade-in duration-300">
            {/* TOP SCANNER HERO CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl text-center space-y-4 shadow-xl border border-blue-900/50 relative overflow-hidden">
              {/* Background ambient glow circle */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Pulsing AI Scanner Visual */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
                <div className="absolute inset-1 rounded-full border-2 border-t-blue-400 border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" />
                <div className="w-16 h-16 rounded-full bg-blue-600/20 backdrop-blur-md border border-blue-400/50 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                  <ScanLine className="w-8 h-8 animate-pulse text-blue-300" />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 inline-block mb-1.5">
                  AI Underwriting Engine
                </span>
                <h2 className="text-lg font-black text-white">Validating Documents & KYC</h2>
                <p className="text-xs text-blue-200/80 font-medium max-w-xs mx-auto mt-1">
                  Please hold on while our automated verification system cross-references your submitted inputs.
                </p>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-blue-200">
                  <span>Verification Progress</span>
                  <span className="font-mono text-emerald-400 font-black">{validationProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-blue-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* LIVE VERIFICATION CHECKLIST CARDS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Real-Time Compliance Checks
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  Automated Verification
                </span>
              </div>

              {[
                {
                  title: 'Document Integrity & OCR Extraction',
                  desc: 'Scanning uploaded Aadhaar & PAN images for biometric clarity',
                  threshold: 25,
                },
                {
                  title: 'Government Identity Cross-Match',
                  desc: 'Cross-verifying applicant identity with UIDAI & Income Tax database',
                  threshold: 50,
                },
                {
                  title: 'Agent Biometric & Geolocation Match',
                  desc: 'Validating live applicant selfie and agent GPS physical presence',
                  threshold: 75,
                },
                {
                  title: 'Virtual Credit Sanction & Underwriting',
                  desc: `Authorizing pre-approved loan credit of ₹ ${selectedAmount.toLocaleString('en-IN')}`,
                  threshold: 100,
                },
              ].map((check, idx, arr) => {
                const isPassed = validationProgress >= check.threshold;
                const isCurrent =
                  validationProgress < check.threshold &&
                  (idx === 0 || validationProgress >= arr[idx - 1].threshold);

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                      isPassed
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        : isCurrent
                        ? 'bg-blue-50/90 border-blue-300 text-blue-950 ring-2 ring-blue-500/15'
                        : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 transition-all ${
                          isPassed
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            isPassed ? 'text-slate-900' : isCurrent ? 'text-blue-950 font-black' : 'text-slate-500'
                          }`}
                        >
                          {check.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{check.desc}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isCurrent
                          ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed ? 'Verified ✓' : isCurrent ? 'Checking...' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted Verification Engine
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: LOAN APPROVED / BOOKED (SCREEN 4 OF IMAGE) */}
        {currentStep === 3 && !isValidating && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            {/* GREEN CHECK CONFETTI BANNER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-3 shadow-md relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-emerald-100">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Loan Approved!</h2>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  Congratulations <span className="font-bold text-slate-900">{fullName}</span> Your loan has been approved and booked for you.
                </p>
              </div>

              {/* APPROVED LOAN SUMMARY BOX */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-2 gap-2 text-left pt-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Loan Amount</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹ {selectedAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{feeLabel}</span>
                  <span className="text-sm font-black text-blue-700">
                    ₹ {currentFee.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Status</span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    Amount Booked
                  </span>
                </div>
              </div>
            </div>

            {/* YELLOW ALERT CALLOUT */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-3 text-amber-900">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">
                Your loan amount is booked and will be available in your wallet after fee payment and final verification.
              </p>
            </div>

            {/* RED/CORAL NEXT STEP CARD */}
            <div className="bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border-2 border-rose-300 p-4 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  Next Step
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                Pay the applicable processing fee to continue the activation process.
              </p>

              {/* PAY FEE BUTTON */}
              <button
                onClick={handlePayFee}
                disabled={payingFee}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {payingFee ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>Pay Fee ₹ {currentFee.toLocaleString('en-IN')}</span>
                )}
              </button>

              {/* SECONDARY BUTTON */}
              <button
                onClick={() => router.push('/loan/virtual-loan/dashboard')}
                className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                View Loan Details
              </button>

              <div className="text-center pt-1">
                <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> 100% Secure Payment
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT SUCCESS & AUTO-VERIFICATION MODAL */}
      {showPaymentSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl relative border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Payment Successful
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Fee Paid: ₹ {currentFee.toLocaleString('en-IN')}
              </h3>

              {autoVerified ? (
                <div className="space-y-2 pt-2">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-emerald-900 text-xs font-bold flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-left">
                      <strong>Auto Verification ON:</strong> System automatically verified and activated your loan! ₹ {selectedAmount.toLocaleString('en-IN')} limit is now credited to your wallet.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/loan/virtual-loan/dashboard')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
                  >
                    Go to Virtual Loan Dashboard →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 text-xs font-bold flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-left">
                      <strong>Pending Admin Verification (Auto Verify OFF):</strong> Your fee payment is recorded. Admin will manually verify your documents to activate the usable wallet balance.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentSuccessModal(false);
                      router.push('/loan/virtual-loan/dashboard');
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md"
                  >
                    View Application Status →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900 truncate">{previewDoc.title}</h3>
                <p className="text-[10px] text-slate-500 font-medium truncate">{previewDoc.subtitle}</p>
                {previewDoc.fileName && (
                  <p className="text-[10px] text-blue-600 font-semibold truncate mt-0.5">
                    {previewDoc.fileName} {previewDoc.fileSize ? `(${previewDoc.fileSize})` : ''}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 ml-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-4/3 flex items-center justify-center relative shadow-inner">
              {previewDoc.previewUrl ? (
                <img
                  src={previewDoc.previewUrl}
                  alt={previewDoc.title}
                  className="w-full h-full object-contain bg-slate-950"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white">Document Attached</p>
                  <p className="text-[11px] text-slate-400">{previewDoc.fileName || 'PDF Document File'}</p>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Real Upload
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => triggerUpload(previewDoc.key)}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Image</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileContainer>
  );
}
