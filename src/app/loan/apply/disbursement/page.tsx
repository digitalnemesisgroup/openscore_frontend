'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  Building2,
  CheckCircle2,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  XCircle,
  Info,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Download,
  Calendar,
  PhoneCall,
  Eye,
  Check,
  Sparkles,
} from 'lucide-react';

function LoanDisbursementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appData, setAppData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Local state override mode for demo / testing
  const [activeScreenOverride, setActiveScreenOverride] = useState<string | null>(null);

  // Form input states for Screen 22 (Disbursement Bank Details)
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [accountType, setAccountType] = useState('Savings Account');
  const [ifscVerified, setIfscVerified] = useState(true);

  // Additional documents upload states for Screen 24
  const [uploadedExtraDocs, setUploadedExtraDocs] = useState<Record<string, boolean>>({});
  const [extraDocsRemarks, setExtraDocsRemarks] = useState('');

  const fetchLoanData = async () => {
    let savedAppId = typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null;
    const urlId = searchParams.get('id');
    if (urlId) savedAppId = urlId;

    try {
      setLoading(true);
      if (savedAppId) {
        const res = await apiRequest(`/loan/applications/${savedAppId}`);
        if (res.data) {
          setAppData(res.data);
          if (res.data.full_name && !holderName) {
            setHolderName(res.data.full_name);
          }
          if (res.data.bank_name) setBankName(res.data.bank_name);
          if (res.data.bank_account_number) setAccountNumber(res.data.bank_account_number);
          if (res.data.bank_ifsc_code) setIfscCode(res.data.bank_ifsc_code);
        }
      } else {
        // Fetch latest application if no ID in storage
        const res = await apiRequest('/loan/applications');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const latest = res.data[0];
          setAppData(latest);
          if (latest.full_name) setHolderName(latest.full_name);
        }
      }
    } catch (err: any) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, [searchParams]);

  // Submit Bank Details Form (Screen 22 -> Screen 23)
  const handleSubmitBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!accountNumber || accountNumber.trim() !== confirmAccount.trim()) {
      setErrorMsg('Account Number and Confirm Account Number do not match.');
      return;
    }

    if (accountNumber.length < 8) {
      setErrorMsg('Please enter a valid bank account number.');
      return;
    }

    setSubmitting(true);
    const appId = appData?.id;

    try {
      if (appId) {
        const res = await apiRequest(`/loan/apply/${appId}/bank-details`, {
          method: 'POST',
          body: JSON.stringify({
            bank_account_holder_name: holderName || appData?.full_name || 'Applicant',
            bank_name: bankName,
            bank_account_number: accountNumber,
            bank_ifsc_code: ifscCode,
            bank_account_type: accountType,
          }),
        });

        if (res.data) {
          setAppData(res.data);
        }
      } else {
        const updated = {
          ...appData,
          bank_account_holder_name: holderName,
          bank_name: bankName,
          bank_account_number: accountNumber,
          bank_ifsc_code: ifscCode,
          bank_account_type: accountType,
          bank_details_status: 'submitted',
          status: 'bank_details_pending',
        };
        setAppData(updated);
      }
      setActiveScreenOverride('screen23');
    } catch (err: any) {
      const updated = {
        ...appData,
        bank_account_holder_name: holderName,
        bank_name: bankName,
        bank_account_number: accountNumber,
        bank_ifsc_code: ifscCode,
        bank_account_type: accountType,
        bank_details_status: 'submitted',
        status: 'bank_details_pending',
      };
      setAppData(updated);
      setActiveScreenOverride('screen23');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Additional Requested Documents (Screen 24 -> Screen 25)
  const handleSubmitExtraDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const appId = appData?.id;

    try {
      if (appId) {
        const res = await apiRequest(`/loan/apply/${appId}/additional-documents`, {
          method: 'POST',
          body: JSON.stringify({
            submitted_docs: uploadedExtraDocs,
            remarks: extraDocsRemarks,
          }),
        });
        if (res.data) setAppData(res.data);
      }
      setActiveScreenOverride('screen25');
    } catch (err: any) {
      setActiveScreenOverride('screen25');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to resolve dynamic screen state
  const getActiveScreen = () => {
    if (activeScreenOverride) return activeScreenOverride;
    if (!appData) return 'screen22';

    const status = (appData.status || '').toLowerCase();
    const finalDecision = (appData.final_decision || '').toUpperCase();
    const bankDetailsStatus = (appData.bank_details_status || '').toLowerCase();
    const addDocsStatus = (appData.additional_docs_status || '').toLowerCase();

    // 1. Rejected state
    if (status === 'rejected' || finalDecision === 'REJECTED') {
      return 'screen26_rejected';
    }

    // 2. Disbursed state
    if (status === 'disbursed' || appData.disbursement_status === 'credited' || finalDecision === 'DISBURSED') {
      return 'screen26_disbursed';
    }

    // 3. Documents submitted & under review state
    if (status === 'additional_docs_submitted' || addDocsStatus === 'submitted') {
      return 'screen25';
    }

    // 4. Additional documents requested by admin state
    if (
      status === 'additional_docs_required' ||
      finalDecision === 'ADDITIONAL_DOCS' ||
      addDocsStatus === 'requested' ||
      appData.additional_docs_request
    ) {
      return 'screen24';
    }

    // 5. Bank details submitted & pending admin verification state
    if (
      status === 'bank_details_pending' ||
      bankDetailsStatus === 'submitted' ||
      bankDetailsStatus === 'pending' ||
      appData.bank_account_number
    ) {
      return 'screen23';
    }

    // Default: Initial Bank Details Form
    return 'screen22';
  };

  const currentScreen = getActiveScreen();

  const formattedAmount = (appData?.approved_amount || appData?.selected_amount || 0).toLocaleString('en-IN');
  const appNumber = appData?.application_number || (appData?.id ? `OSL-${appData.id}` : 'OSL-PENDING');
  const partnerName = appData?.selected_partner_name || appData?.bank_name || 'Lending Partner';
  const partnerSubtext = appData?.loan_type ? `${appData.loan_type.includes('construction') ? 'Construction Loan' : 'Personal Loan'}` : 'Personal Loan';
  const loanTenure = appData?.selected_tenure || appData?.tenure_months || 24;

  if (loading) {
    return (
      <MobileContainer>
        <LoanHeader title="Loan Disbursement" backHref="/loan/apply" />
        <div className="p-8 text-center space-y-3 flex-1 flex flex-col justify-center items-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading Disbursement Details...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="bg-[#f8fafc] min-h-full flex-1 flex flex-col pb-36 animate-in fade-in duration-300">
        {/* ==================================================================== */}
        {/* SCREEN 22: DISBURSEMENT BANK DETAILS FORM */}
        {/* ==================================================================== */}
        {currentScreen === 'screen22' && (
          <div className="space-y-4">
            <LoanHeader title="Loan Disbursement" stepNumber={4} totalSteps={4} backHref="/loan/apply" />

            <div className="p-4 space-y-4">
              {/* Stepper Dots Indicator */}
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1 text-blue-600">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">✓</span>
                  <span>Application</span>
                </div>
                <div className="w-6 h-0.5 bg-blue-600"></div>
                <div className="flex items-center gap-1 text-blue-600">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">✓</span>
                  <span>Verification</span>
                </div>
                <div className="w-6 h-0.5 bg-blue-600"></div>
                <div className="flex items-center gap-1 text-blue-600">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">✓</span>
                  <span>Approval</span>
                </div>
                <div className="w-6 h-0.5 bg-blue-600"></div>
                <div className="flex items-center gap-1 text-blue-600 font-extrabold">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">4</span>
                  <span>Disbursement</span>
                </div>
              </div>

              {/* Your Loan is Approved Green Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Your Loan is Approved!</h3>
                  <p className="text-xs text-emerald-700 font-medium">Please provide your bank account details for loan disbursement.</p>
                </div>
              </div>

              {/* Loan Card Summary */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      HDFC
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{partnerName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{partnerSubtext}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Application No.</span>
                    <span className="font-mono font-bold text-slate-900">{appNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Approved Amount</span>
                    <span className="font-black text-slate-900">₹{formattedAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Loan Type</span>
                    <span className="font-bold text-slate-800">{appData?.loan_type ? (appData.loan_type.includes('construction') ? 'Construction Loan' : 'Low CIBIL Loan') : 'Low CIBIL Loan'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Tenure</span>
                    <span className="font-bold text-slate-800">{loanTenure} Months</span>
                  </div>
                </div>
              </div>

              {/* Form: Bank Account Details */}
              <form onSubmit={handleSubmitBankDetails} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Bank Account Details</h4>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Rohit Sharma"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Name *</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm Account Number *</label>
                  <input
                    type="text"
                    required
                    value={confirmAccount}
                    onChange={(e) => setConfirmAccount(e.target.value)}
                    placeholder="Re-enter account number"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">IFSC Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIfscVerified(true)}
                      className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors shrink-0"
                    >
                      {ifscVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Type *</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="Savings Account">Savings Account</option>
                    <option value="Current Account">Current Account</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Please ensure the bank account is in your name. Disbursement will be made only to a verified account.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Bank Details...
                    </>
                  ) : (
                    <span>Submit for Disbursement →</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SCREEN 23: DISBURSEMENT REQUEST SUBMITTED */}
        {/* ==================================================================== */}
        {currentScreen === 'screen23' && (
          <div className="space-y-4">
            <LoanHeader title="Loan Disbursement" backHref="/loan/apply" />

            <div className="p-4 space-y-4 text-center">
              {/* Big Green Checkmark Icon */}
              <div className="relative mx-auto my-2 w-20 h-20">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl relative border-4 border-emerald-200">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">Disbursement Request Submitted</h2>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  Your bank details have been submitted successfully. The loan amount will be credited to your account after final verification.
                </p>
              </div>

              {/* Submitted Details Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                      HDFC
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{partnerName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{partnerSubtext}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Application No.</span>
                    <span className="font-mono font-bold text-slate-900">{appNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Approved Amount</span>
                    <span className="font-black text-slate-900">₹{formattedAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Bank Account</span>
                    <span className="font-mono font-bold text-slate-900">XXXX {accountNumber ? accountNumber.slice(-4) : '1234'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-900">{ifscCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Submitted On</span>
                    <span className="font-bold text-slate-700">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, 12:05 PM</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Current Status</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md inline-block mt-0.5">
                      Disbursement Processing
                    </span>
                  </div>
                </div>
              </div>

              {/* Expected Time Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-blue-950">Expected Disbursement Time: Within 4 Hours</h4>
                  <p className="text-[11px] text-blue-800 font-medium leading-tight mt-0.5">
                    The amount will be credited to your bank account within 4 hours, subject to final verification and bank processing.
                  </p>
                </div>
              </div>

              {/* 4-Step Process Dots */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 relative">
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">✓</span>
                    <span className="text-slate-900">Details Submitted</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">2</span>
                    <span className="text-blue-700">Admin Verification</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Bank Processing</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 z-10">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">9</span>
                    <span>Amount Disbursed</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 text-left px-1">
                <p>• You will be notified via SMS and in-app notification.</p>
                <p>• For any support, contact our team.</p>
              </div>

              <button
                onClick={fetchLoanData}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Track Status</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SCREEN 24: ADDITIONAL DOCUMENTS REQUESTED BY ADMIN */}
        {/* ==================================================================== */}
        {currentScreen === 'screen24' && (
          <div className="space-y-4">
            <LoanHeader title="Document Upload" backHref="/loan/apply" />

            <div className="p-4 space-y-4">
              {/* Amber Banner: Additional Documents Required */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-amber-950">Additional Documents Required</h3>
                  <p className="text-[11px] text-amber-800 font-medium">Our team requires some additional documents to proceed with your loan disbursement.</p>
                </div>
              </div>

              {/* Details Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                    HDFC
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{partnerName}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{partnerSubtext}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Application No.</span>
                    <span className="font-mono font-bold text-slate-900">{appNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Requested By</span>
                    <span className="font-bold text-slate-800">OpenScore Admin</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Request Date</span>
                    <span className="font-bold text-slate-700">17 Sep 2025, 01:10 PM</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Reason</span>
                    <span className="font-bold text-amber-700">For final verification, please submit the below documents.</span>
                  </div>
                </div>
              </div>

              {/* Upload Required Documents List */}
              <form onSubmit={handleSubmitExtraDocs} className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Upload Required Documents</h4>

                {[
                  { id: 'bank_stmt', name: '6 Months Bank Statement *', sub: 'PDF / Image (Max 5 MB)' },
                  { id: 'aadhaar_copy', name: 'Aadhaar Card (Front & Back) *', sub: 'PDF / Image (Max 5 MB)' },
                  { id: 'selfie_clear', name: 'Selfie (Clear Photo) *', sub: 'Take a selfie with clear face' },
                  { id: 'home_photo', name: 'Home Photo *', sub: 'Capture your house front view' },
                  { id: 'gps_location', name: 'GPS Location of House *', sub: 'Allow location & capture' },
                  { id: 'income_proof', name: 'Income Proof (if any)', sub: 'Salary slip / ITR / Business proof' },
                ].map((doc) => {
                  const isDone = uploadedExtraDocs[doc.id];
                  return (
                    <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                        <p className="text-[10px] text-slate-500 font-medium">{doc.sub}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedExtraDocs((prev) => ({ ...prev, [doc.id]: true }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Uploaded ✓' : 'Upload'}</span>
                      </button>
                    </div>
                  );
                })}

                {/* Admin Remarks Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Admin Remarks</span>
                  <p className="text-xs text-slate-700 font-semibold">
                    {appData?.proof_remarks || 'Please upload clear documents. Bank statement should be of last 6 months.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Documents...
                    </>
                  ) : (
                    <span>Submit Documents →</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SCREEN 25: DOCUMENTS SUBMITTED & UNDER REVIEW */}
        {/* ==================================================================== */}
        {currentScreen === 'screen25' && (
          <div className="space-y-4">
            <LoanHeader title="Verification Status" backHref="/loan/apply" />

            <div className="p-4 space-y-4 text-center">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-emerald-200">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">Documents Submitted Successfully</h2>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  Your documents have been submitted and are currently under review by our team.
                </p>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 text-left">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                    HDFC
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{partnerName}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{partnerSubtext}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Application No.</span>
                    <span className="font-mono font-bold text-slate-900">{appNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Submitted On</span>
                    <span className="font-bold text-slate-700">17 Sep 2025, 01:25 PM</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Current Status</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black rounded-md inline-block mt-0.5">
                      Under Review
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Expected Update</span>
                    <span className="font-bold text-emerald-700">Within 20 Minutes</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Uploaded Documents</h4>
                  <span className="text-[10px] text-blue-600 font-bold">View All</span>
                </div>

                {[
                  { name: '6 Months Bank Statement', status: 'Submitted' },
                  { name: 'Aadhaar Card (Front & Back)', status: 'Submitted' },
                  { name: 'Selfie', status: 'Submitted' },
                  { name: 'Home Photo', status: 'Submitted' },
                  { name: 'GPS Location', status: 'Submitted' },
                  { name: 'Income Proof', status: 'Submitted' },
                ].map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                      <div>
                        <p className="font-bold text-slate-900">{d.name}</p>
                        <span className="text-[10px] text-slate-400">{d.status}</span>
                      </div>
                    </div>
                    <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">
                      View
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-left text-xs text-blue-900 font-medium">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Our team is verifying your documents. You will be notified once the verification is completed.</span>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SCREEN 26 CASE 1: DISBURSEMENT SUCCESSFUL */}
        {/* ==================================================================== */}
        {currentScreen === 'screen26_disbursed' && (
          <div className="space-y-4">
            {/* Top Green Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 rounded-b-3xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                  Loan Dreams Delivered!
                </span>
                <span className="text-[10px] font-bold text-emerald-100">
                  Finance Made Simple for a Better Tomorrow
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4 text-center">
              {/* Big Green Checkmark */}
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-emerald-200">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">Disbursement Successful!</h2>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  Your loan amount has been successfully credited to your bank account.
                </p>
              </div>

              {/* Disbursed Header Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                      HDFC
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{partnerName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{partnerSubtext}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Disbursed (17 Sep 2025, 04:18 PM)
                  </span>
                </div>

                {/* Loan Details Table */}
                <div className="space-y-2">
                  <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Loan Details</h5>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Application No.</span>
                      <span className="font-mono font-bold text-slate-900">{appNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Loan Type</span>
                      <span className="font-bold text-slate-800">Low CIBIL Loan</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Approved Amount</span>
                      <span className="font-black text-slate-900">₹{formattedAmount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Disbursed Amount</span>
                      <span className="font-black text-emerald-600">₹{formattedAmount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Tenure</span>
                      <span className="font-bold text-slate-800">{loanTenure} Months</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Interest Rate (p.a.)</span>
                      <span className="font-bold text-slate-800">8.5%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Monthly EMI</span>
                      <span className="font-black text-slate-900">₹9,175</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Approval Date</span>
                      <span className="font-bold text-slate-800">17 Sep 2025</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Disbursement Date & Time</span>
                      <span className="font-bold text-slate-800">17 Sep 2025, 04:18 PM</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Reference No.</span>
                      <span className="font-mono font-bold text-blue-600">HDFCLN258963741</span>
                    </div>
                  </div>
                </div>

                {/* Bank Account Details (Credited To) + Circular Stamp */}
                <div className="pt-3 border-t border-slate-100 relative overflow-hidden">
                  <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-2">Bank Account Details (Credited To)</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs pr-20">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Account Holder Name</span>
                      <span className="font-bold text-slate-900">{holderName || 'Rohit Sharma'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900">{ifscCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Bank Name</span>
                      <span className="font-bold text-slate-900">{bankName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Account Type</span>
                      <span className="font-bold text-slate-900">{accountType}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block">Account Number</span>
                      <span className="font-mono font-bold text-slate-900">XXXX XXXX XXXX {accountNumber ? accountNumber.slice(-4) : '1234'}</span>
                    </div>
                  </div>

                  {/* Circular Seal Stamp: AMOUNT CREDITED */}
                  <div className="absolute top-4 right-2 w-20 h-20 rounded-full border-4 border-emerald-600/70 flex flex-col items-center justify-center text-center rotate-[-12deg] pointer-events-none p-1 bg-emerald-50/50">
                    <span className="text-[8px] font-black text-emerald-700 tracking-tighter uppercase leading-none">★★★</span>
                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-tighter leading-tight my-0.5">AMOUNT CREDITED</span>
                    <span className="text-[8px] font-black text-emerald-700 tracking-tighter uppercase leading-none">★★★</span>
                  </div>
                </div>
              </div>

              {/* Congratulations Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Congratulations!</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  Your financial support is now in your account. Thank you for choosing OpenScore.
                </p>
                <p className="text-[10px] text-emerald-600 font-bold italic text-right pt-1">
                  "A step forward towards your bigger dreams." - OpenScore
                </p>
              </div>

              {/* Quick Action Icons Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-slate-700 pt-1">
                <button className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Letter</span>
                </button>
                <button className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Repayment Schedule</span>
                </button>
                <button className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Loan Details</span>
                </button>
                <button className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs">
                  <PhoneCall className="w-4 h-4 text-orange-600" />
                  <span>Contact Support</span>
                </button>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Go to Dashboard →</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SCREEN 26 CASE 2: APPLICATION REJECTED */}
        {/* ==================================================================== */}
        {currentScreen === 'screen26_rejected' && (
          <div className="space-y-4">
            <LoanHeader title="Application Status" backHref="/loan/apply" />

            <div className="p-4 space-y-4 text-center">
              {/* Big Red Cross Icon */}
              <div className="w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-rose-200">
                <XCircle className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <h2 className="text-xl font-black text-rose-900">Application Not Approved</h2>
                <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">
                  We're unable to approve your loan application at this time. After a detailed review of your information and documents, we are unable to proceed with this application.
                </p>
              </div>

              {/* Rejection Details Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                      HDFC
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{partnerName}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{partnerSubtext}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black rounded-lg flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Application No.</span>
                    <span className="font-mono font-bold text-slate-900">{appNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Loan Type</span>
                    <span className="font-bold text-slate-800">Low CIBIL Loan</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Requested Amount</span>
                    <span className="font-black text-slate-900">₹{formattedAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Date of Review</span>
                    <span className="font-bold text-slate-700">17 Sep 2025, 03:24 PM</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Rejection Reason</span>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold leading-relaxed">
                    {appData?.rejection_reason || 'Bank statement could not be verified. The submitted statement does not match with your profile.'}
                  </div>
                </div>
              </div>

              {/* Other Possible Reasons */}
              <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Other Possible Reasons</h4>
                <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Incomplete or unclear documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Address or location verification issue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Income / employment verification failed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Information mismatch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Lender policy criteria not met</span>
                  </div>
                </div>
              </div>

              {/* 3-Day Reapply Notice Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-left flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-sm">
                  i
                </div>
                <div>
                  <h5 className="text-xs font-black text-blue-950">You can reapply after 3 days.</h5>
                  <p className="text-[11px] text-blue-800 font-medium leading-tight">
                    Please correct the mentioned issues and submit a new application with updated documents.
                  </p>
                </div>
              </div>

              {/* Dual Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => router.push('/loan/apply')}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Reapply After 3 Days
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo / Testing Screen State Toggle Switcher */}
        <div className="mt-8 p-3 bg-slate-900 text-slate-300 rounded-2xl mx-4 text-center space-y-2 border border-slate-800">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
            Demo Workflow Navigator (Switch Screen View):
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
            <button
              onClick={() => setActiveScreenOverride('screen22')}
              className={`px-2 py-1 rounded-md font-bold ${
                currentScreen === 'screen22' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Screen 22 (Bank Details)
            </button>
            <button
              onClick={() => setActiveScreenOverride('screen23')}
              className={`px-2 py-1 rounded-md font-bold ${
                currentScreen === 'screen23' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Screen 23 (Submitted)
            </button>
            <button
              onClick={() => setActiveScreenOverride('screen24')}
              className={`px-2 py-1 rounded-md font-bold ${
                currentScreen === 'screen24' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Screen 24 (Extra Docs Req)
            </button>
            <button
              onClick={() => setActiveScreenOverride('screen25')}
              className={`px-2 py-1 rounded-md font-bold ${
                currentScreen === 'screen25' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Screen 25 (Under Review)
            </button>
            <button
              onClick={() => setActiveScreenOverride('screen26_disbursed')}
              className={`px-2 py-1 rounded-md font-bold ${
                currentScreen === 'screen26_disbursed' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Screen 26 (Disbursed ✓)
            </button>
            <button
              onClick={() => setActiveScreenOverride('screen26_rejected')}
              className={`px-2 py-1 rounded-md font-bold ${
                currentScreen === 'screen26_rejected' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Screen 26 (Rejected ✗)
            </button>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}

export default function LoanDisbursementPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading disbursement page...</div>}>
      <LoanDisbursementContent />
    </Suspense>
  );
}
