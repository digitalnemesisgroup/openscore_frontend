'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
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
  QrCode,
  Copy,
  ExternalLink,
  Zap,
  BadgeCheck,
  Trash2,
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
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [utrInput, setUtrInput] = useState<string>('');

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

  // Real File Upload Handler with Canvas Compression
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
                uploaded: true,
                name: file.name,
                size: sizeStr,
                preview: finalUrl,
                status: 'Uploaded',
              },
            }));
            setPreviewDoc((current) =>
              current && current.key === key
                ? { ...current, previewUrl: finalUrl, fileName: file.name, fileSize: sizeStr }
                : current
            );
          };
          img.onerror = () => {
            setDocs((prev) => ({
              ...prev,
              [key]: {
                uploaded: true,
                name: file.name,
                size: sizeStr,
                preview: rawUrl,
                status: 'Uploaded',
              },
            }));
          };
          img.src = rawUrl;
        } catch {
          setDocs((prev) => ({
            ...prev,
            [key]: {
              uploaded: true,
              name: file.name,
              size: sizeStr,
              preview: rawUrl,
              status: 'Uploaded',
            },
          }));
        }
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

  // Step 3: Multi-stage post-validation flow: 'approved_card' -> 'sanction_letter' -> 'fee_consent' -> 'payment'
  const [postValidationStage, setPostValidationStage] = useState<'approved_card' | 'sanction_letter' | 'fee_consent' | 'payment'>('approved_card');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [payingFee, setPayingFee] = useState<boolean>(false);
  const [autoVerified, setAutoVerified] = useState<boolean | null>(null);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState<boolean>(false);

  // Screenshot Upload Handler with Canvas Compression
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

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
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setPaymentScreenshot(canvas.toDataURL('image/jpeg', 0.65));
          } else {
            setPaymentScreenshot(rawUrl);
          }
          setError('');
        };
        img.onerror = () => {
          setPaymentScreenshot(rawUrl);
          setError('');
        };
        img.src = rawUrl;
      } catch {
        setPaymentScreenshot(rawUrl);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

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
        if (res.data.id) setAppId(res.data.id);
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
  const handlePayFee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!utrInput.trim() || utrInput.trim().length < 6) {
      setError('Please enter a valid 12-digit UTR / Transaction Reference number.');
      return;
    }
    if (!paymentScreenshot) {
      setError('Payment screenshot receipt is mandatory. Please upload a screenshot of your UPI payment.');
      return;
    }

    setPayingFee(true);
    try {
      const targetId = appId || 1;
      const res = await apiRequest(`/loan/virtual-apply/${targetId}/pay-fee`, {
        method: 'POST',
        body: JSON.stringify({
          transaction_id: utrInput.trim(),
          payment_proof: paymentScreenshot,
          payment_method: 'UPI / QR',
        }),
      });

      if (res && res.status === 'success') {
        setAutoVerified(!!res.auto_verified);
        setShowPaymentSuccessModal(true);
        if (res.data) setAppStatus(res.data.status);
      }
    } catch (err: any) {
      setError(err.message || 'Fee payment submission failed. Please try again.');
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
            : postValidationStage === 'approved_card'
            ? 'Credit Approved'
            : postValidationStage === 'sanction_letter'
            ? 'Sanction Letter'
            : postValidationStage === 'fee_consent'
            ? 'Fee Authorization & Consent'
            : 'UPI Payment & Proof'
        }
        stepNumber={isValidating ? 2 : currentStep}
        totalSteps={3}
        onBackClick={
          currentStep === 3
            ? postValidationStage === 'sanction_letter'
              ? () => setPostValidationStage('approved_card')
              : postValidationStage === 'fee_consent'
              ? () => setPostValidationStage('sanction_letter')
              : postValidationStage === 'payment'
              ? () => setPostValidationStage('fee_consent')
              : undefined
            : undefined
        }
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
                  {Object.values(docs).filter((d) => d.uploaded).length} of 4 Uploaded
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

        {/* ========================================================================= */}
        {/* STEP 3: POST-VALIDATION SEQUENCE                                          */}
        {/* 1. Approved Card -> 2. Sanction Letter -> 3. Fee Consent -> 4. Payment    */}
        {/* ========================================================================= */}

        {/* --- STAGE 1: CREDIT APPROVED HERO CARD --- */}
        {currentStep === 3 && !isValidating && postValidationStage === 'approved_card' && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            {/* GREEN CHECK HERO BANNER */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-3 shadow-md relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg ring-4 ring-emerald-100 animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Verification Successful
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  Your Credit Has Been Approved! 🎉
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  Congratulations <span className="font-bold text-slate-900">{fullName}</span>! Your virtual loan credit line of <strong className="text-emerald-600">₹{selectedAmount.toLocaleString('en-IN')}</strong> has been approved and pre-allocated to your profile.
                </p>
              </div>

              {/* APPROVED CREDIT SUMMARY BOX */}
              <div className="bg-gradient-to-br from-emerald-50/50 via-slate-50 to-blue-50/40 border border-slate-200 p-4 rounded-2xl grid grid-cols-2 gap-2 text-left pt-3 shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved Credit Limit</span>
                  <span className="text-2xl font-black text-emerald-600">
                    ₹{selectedAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Product Type</span>
                  <span className="text-xs font-black text-slate-900 block mt-1">
                    OpenScore Virtual Line
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Repayment Tenor</span>
                    <span className="text-xs font-bold text-slate-700">30 - 90 Days Flexible</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    Pre-Approved ✓
                  </span>
                </div>
              </div>
            </div>

            {/* CALLOUT INFO */}
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex items-start gap-3 text-blue-900 shadow-2xs">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">
                Your pre-approved sanction letter has been generated. Unlock your credit limit now to review your official letter and complete nominal activation.
              </p>
            </div>

            {/* UNLOCK CREDIT BUTTON */}
            <button
              type="button"
              onClick={() => setPostValidationStage('sanction_letter')}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Unlock Credit Limit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- STAGE 2: FORMAL SANCTION LETTER --- */}
        {currentStep === 3 && !isValidating && postValidationStage === 'sanction_letter' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1 mb-1">
                  <BadgeCheck className="w-3 h-3 text-blue-600" />
                  Official Sanction Letter
                </span>
                <h1 className="text-xl font-black text-slate-900">Credit Sanction Letter</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Review your in-principle credit facility terms
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostValidationStage('approved_card')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            {/* FORMAL SANCTION LETTER DOCUMENT CARD */}
            <div className="bg-white border-2 border-slate-300 rounded-3xl p-5 shadow-md space-y-4 relative overflow-hidden">
              {/* Top Letterhead */}
              <div className="border-b-2 border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    OpenScore Digital Credit
                  </h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                    National Lending &amp; Credit Facilitation Network
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 block">
                    Ref: OSV/SANC/{appId ? String(appId).padStart(4, '0') : '2026'}/9081
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold block">
                    Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800">
                <span className="font-bold text-slate-900 block">Subject:</span>
                <span className="font-semibold text-slate-700">
                  In-Principle Sanction of OpenScore Virtual Credit Limit Line
                </span>
              </div>

              {/* Greeting & Text */}
              <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p>
                  Dear <strong className="text-slate-900">{fullName}</strong>,
                </p>
                <p>
                  We are pleased to inform you that based on your automated KYC evaluation and identity verification, your application for an <strong>OpenScore Virtual Credit Line</strong> has been sanctioned in-principle under the following approved terms:
                </p>
              </div>

              {/* Sanction Details Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Applicant Name</span>
                  <span className="font-black text-slate-900">{fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Registered Mobile</span>
                  <span className="font-bold text-slate-900">+91 {mobileNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Sanctioned Credit Limit</span>
                  <span className="font-black text-emerald-600 text-sm">
                    ₹{selectedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Facility Type</span>
                  <span className="font-bold text-slate-900">Revolving Digital Credit</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Validity / Cycle</span>
                  <span className="font-bold text-slate-900">30 - 90 Days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Sanction Status</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Approved &amp; Reserved ✓
                  </span>
                </div>
              </div>

              {/* Seal & Stamp Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-[10px]">
                <div className="flex items-center gap-1 text-slate-500">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Digitally Generated &amp; Signed</span>
                </div>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Authorized Underwriting
                </span>
              </div>
            </div>

            {/* PROCEED TO FEE CONSENT BUTTON */}
            <button
              type="button"
              onClick={() => setPostValidationStage('fee_consent')}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Accept Sanction &amp; Proceed to Fee Consent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- STAGE 3: FEE BREAKDOWN & MANDATORY CONSENT --- */}
        {currentStep === 3 && !isValidating && postValidationStage === 'fee_consent' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Reference & Breadcrumb Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-blue-600 fill-blue-600" />
                  Step 1 of 2: Fee Consent
                </span>
                <h1 className="text-xl font-black text-slate-900">Processing Fee &amp; Consent</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Review fee breakdown and confirm authorization
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostValidationStage('sanction_letter')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-bold flex items-start gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Application Overview Mini Card */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-4.5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-blue-800/60 pb-2.5">
                <span className="text-[11px] font-bold text-blue-200 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  Sanction Confirmed
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-md border border-blue-400/30">
                  Virtual Cash Limit
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-blue-300 block font-medium">Applicant</span>
                  <span className="font-black text-white">{fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-300 block font-medium">Sanctioned Limit</span>
                  <span className="font-black text-emerald-400">
                    ₹{selectedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between text-[11px]">
                <span className="text-blue-300">Status</span>
                <span className="bg-blue-500/20 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full font-bold">
                  Pending Activation Review
                </span>
              </div>
            </div>

            {/* Itemized Fee Breakdown Card */}
            <div className="bg-white border-2 border-blue-200 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Itemized Fee Breakdown
                </span>
                <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  100% Transparent
                </span>
              </div>

              {(() => {
                const loginFee = 500;
                const docFee = 200;
                const riskFee = Math.max(0, currentFee - 700);
                return (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>1. Application Login &amp; Portal Fee</span>
                      <span className="font-bold text-slate-900">₹{loginFee.toLocaleString('en-IN')}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>2. KYC &amp; Documentation Processing</span>
                      <span className="font-bold text-slate-900">₹{docFee.toLocaleString('en-IN')}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>3. Express Sanction &amp; Risk Check</span>
                      <span className="font-bold text-slate-900">₹{riskFee.toLocaleString('en-IN')}.00</span>
                    </div>

                    <div className="pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between text-sm font-black text-blue-950">
                      <span>Total Payable Amount</span>
                      <span className="text-lg text-blue-700 font-mono font-black">
                        ₹{currentFee.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Payment Consent & Declaration Section */}
            <div className="bg-blue-50/70 border-2 border-blue-200 rounded-3xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-950 font-black text-xs">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Applicant Consent &amp; Declaration</span>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none bg-white p-3.5 rounded-2xl border border-blue-200 shadow-2xs hover:border-blue-400 transition-colors">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked);
                    if (error) setError('');
                  }}
                  className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer shrink-0 accent-blue-600"
                />
                <span className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  <strong className="text-slate-900 font-bold">I hereby agree and give voluntary consent</strong> to pay the nominal processing fee of{' '}
                  <strong className="text-blue-700 font-bold">₹{currentFee.toLocaleString('en-IN')}.00</strong> for my loan application. I understand that this fee covers portal verification and document processing, and final loan approval &amp; wallet limit activation will be granted upon admin review.
                </span>
              </label>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium px-1">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Secure encrypted authorization. Next step will display UPI payment options.</span>
              </div>
            </div>

            {/* Proceed to Payment Button */}
            <button
              type="button"
              onClick={() => {
                if (!consentChecked) {
                  setError('Please check the consent box to agree before proceeding to payment.');
                  return;
                }
                setError('');
                setPostValidationStage('payment');
              }}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- STAGE 4: SCAN & PAY VIA UPI --- */}
        {currentStep === 3 && !isValidating && postValidationStage === 'payment' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Top Reference & Breadcrumb Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 mb-1">
                  <QrCode className="w-3 h-3 text-emerald-600" />
                  Step 2 of 2: Scan &amp; Pay
                </span>
                <h1 className="text-xl font-black text-slate-900">Scan &amp; Pay via UPI</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Complete payment and submit transaction details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPostValidationStage('fee_consent')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back</span>
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-bold flex items-start gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {(() => {
              const upiId = feeConfig?.upi_id || 'flipflops@upi';
              const payeeName = feeConfig?.upi_payee_name || 'OpenScore Finance';
              const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${currentFee}&cu=INR`;
              const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiPayUrl)}`;

              const handleCopyUpi = () => {
                if (typeof navigator !== 'undefined') {
                  navigator.clipboard.writeText(upiId);
                  setCopiedUpi(true);
                  setTimeout(() => setCopiedUpi(false), 2000);
                }
              };

              return (
                <div className="space-y-4">
                  {/* QR Card */}
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 text-center space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        Scan &amp; Pay Using Any UPI App
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        GPay, PhonePe, Paytm
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
                      <img
                        src={qrCodeImgUrl}
                        alt="UPI QR Code"
                        className="w-48 h-48 object-contain mx-auto rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">Total Payable Amount</span>
                      <span className="text-2xl font-black text-blue-700 font-mono">
                        ₹{currentFee.toLocaleString('en-IN')}.00
                      </span>
                    </div>

                    {/* Official UPI ID Copy */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-left">
                      <div className="min-w-0 mr-2">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Official Payee UPI ID</span>
                        <span className="text-xs font-black text-slate-900 font-mono truncate block">
                          {upiId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Direct UPI App launch button */}
                    <a
                      href={upiPayUrl}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all text-center block cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Pay ₹{currentFee.toLocaleString('en-IN')} via UPI App</span>
                    </a>
                  </div>

                  {/* Payment Details Form */}
                  <form onSubmit={handlePayFee} className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Enter Payment Details &amp; Proof</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        12-Digit Transaction Reference (UTR / Txn ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="e.g. 428192839201"
                        className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        You can copy the 12-digit UTR from your UPI payment success screen.
                      </p>
                    </div>

                    {/* Upload Payment Receipt Screenshot */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Upload Payment Receipt Screenshot * (Mandatory)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-2 bg-slate-50 hover:bg-slate-100/60 transition-colors">
                        {paymentScreenshot ? (
                          <div className="space-y-2">
                            <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                              <img
                                src={paymentScreenshot}
                                alt="Payment Receipt"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <label className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100">
                                Change Screenshot
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleScreenshotUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setPaymentScreenshot('')}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer block space-y-1.5 py-2">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 block">Tap to Upload Payment Screenshot</span>
                            <span className="text-[10px] text-slate-400 block">PNG, JPG, JPEG accepted (Without screenshot, verification cannot proceed)</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] font-bold flex items-start gap-2">
                      <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>🔒 Fast-Track Admin Review: Your application and fee payment will be reviewed by admin immediately. Disbursal/Wallet limit activation follows admin approval.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={payingFee}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {payingFee ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <span>Submit Application for Admin Review</span>
                      )}
                    </button>
                  </form>
                </div>
              );
            })()}
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
