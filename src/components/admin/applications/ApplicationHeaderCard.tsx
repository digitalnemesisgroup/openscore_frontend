'use client';

import React, { useState } from 'react';
import { CheckCircle2, Check, XCircle, ShieldCheck, Clock, AlertTriangle, X, FilePlus } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { formatLoanType } from '@/lib/loan-resume';

interface ApplicationHeaderCardProps {
  currentApp: any;
  onUpdate?: (updatedApp?: any) => void;
  setActionSuccessMsg?: (msg: string) => void;
}

export default function ApplicationHeaderCard({ currentApp, onUpdate, setActionSuccessMsg }: ApplicationHeaderCardProps) {
  const isLowCibil = currentApp.loan_type === 'low_cibil' || currentApp.loan_type === 'Low CIBIL Loan';
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [extraDocsModalOpen, setExtraDocsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [extraDocsText, setExtraDocsText] = useState('');
  const [loading, setLoading] = useState(false);

  const initialDocsApproved = currentApp.documents_status === 'approved';
  const feeApproved = currentApp.fee_payment_status === 'approved' || currentApp.payment_status === 'approved' || currentApp.payment_status === 'verified';
  const proofApproved = currentApp.proof_status === 'approved' || currentApp.lender_proof_status === 'approved';
  const bankApproved = currentApp.bank_details_status === 'approved';
  const hasBankSubmitted = Boolean(
    currentApp.bank_account_number ||
    currentApp.account_number ||
    currentApp.bank_name ||
    (currentApp.bank_details && (currentApp.bank_details.bank_name || currentApp.bank_details.account_number)) ||
    currentApp.bank_details_status === 'submitted' ||
    currentApp.bank_details_status === 'approved' ||
    currentApp.status === 'bank_details_pending' ||
    currentApp.status === 'bank_details_approved'
  );
  const extraDocsRequested = currentApp.status === 'additional_docs_required' || currentApp.final_decision === 'ADDITIONAL_DOCS';
  const extraDocsApproved = currentApp.additional_docs_status === 'approved';

  const isFinalApproved = bankApproved && (currentApp.disbursement_status === 'credited' || currentApp.status === 'disbursed');
  const isLoanApprovedForDisbursal = currentApp.final_decision === 'APPROVED' || currentApp.status === 'approved' || currentApp.status === 'agent_verified';
  const isFinalRejected = currentApp.final_decision === 'REJECTED' || currentApp.status === 'rejected' || currentApp.status === 'Rejected';

  const isWithoutCibil =
    currentApp.loan_type === 'no_cibil' ||
    currentApp.loan_type === 'construction_no_cibil' ||
    (currentApp.loan_type || '').toLowerCase().includes('without');

  const handleApproveCibilTier = async (tier: 'low_cibil' | 'good_cibil', label: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/admin/applications/${currentApp.id}/approve-cibil-tier`, {
        method: 'POST',
        body: JSON.stringify({ cibil_tier: tier }),
      });
      if (setActionSuccessMsg) {
        setActionSuccessMsg(`Without CIBIL Application #${currentApp.application_number || currentApp.id} APPROVED & assigned to ${label} Tier in Database!`);
      }
      if (onUpdate) onUpdate(res.data);
      else window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to assign CIBIL tier');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStage = async (stage: string, label: string) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/admin/applications/${currentApp.id}/approve-stage`, {
        method: 'POST',
        body: JSON.stringify({ stage }),
      });
      if (setActionSuccessMsg) {
        setActionSuccessMsg(`Stage (${label}) approved successfully for Application #${currentApp.application_number || currentApp.id}`);
      }
      if (onUpdate) onUpdate(res.data);
      else window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to approve stage');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExtraDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraDocsText.trim()) return;

    setLoading(true);
    try {
      const docsList = extraDocsText.split(',').map(s => s.trim()).filter(Boolean);
      const res = await apiRequest(`/admin/applications/${currentApp.id}/request-docs`, {
        method: 'POST',
        body: JSON.stringify({ requested_docs: docsList, admin_remark: `Extra documents required: ${extraDocsText}` }),
      });
      if (setActionSuccessMsg) {
        setActionSuccessMsg(`Extra Document Request (${extraDocsText}) sent to customer!`);
      }
      setExtraDocsModalOpen(false);
      setExtraDocsText('');
      if (onUpdate) onUpdate(res.data);
      else window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to request extra documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    setLoading(true);
    try {
      await apiRequest(`/admin/applications/${currentApp.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() }),
      });
      if (setActionSuccessMsg) {
        setActionSuccessMsg(`Application #${currentApp.application_number || currentApp.id} REJECTED WHOLE and moved to Rejected section.`);
      }
      setRejectModalOpen(false);
      setRejectionReason('');
      if (onUpdate) onUpdate();
      else window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applicant Overview Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md">
                {(currentApp.full_name || 'US').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">{currentApp.full_name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{currentApp.mobile_number} • {currentApp.email}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">User ID: {currentApp.user_id || `USR${currentApp.id}`}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${
                isFinalApproved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isFinalRejected
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isLoanApprovedForDisbursal
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isFinalApproved ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Funds Disbursed</>
                ) : isFinalRejected ? (
                  <><XCircle className="w-3.5 h-3.5 text-rose-600" /> Application Rejected Whole</>
                ) : isLoanApprovedForDisbursal ? (
                  <><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Loan Approved (Awaiting Bank & Disbursal)</>
                ) : (
                  <><Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> In Stage-by-Stage Admin Review</>
                )}
              </span>

              {!isFinalRejected && (
                <button
                  onClick={() => setExtraDocsModalOpen(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all"
                >
                  <FilePlus className="w-3 h-3" /> Request Extra Docs
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold">Application No.</p>
              <p className="font-bold text-slate-900 font-mono">#{currentApp.application_number || currentApp.id}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Applied Amount</p>
              <p className="font-black text-slate-900">₹{(currentApp.requested_amount || currentApp.selected_amount || 200000).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Loan Type</p>
              <p className="font-bold text-slate-900">{formatLoanType(currentApp.loan_type)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold">Applied On</p>
              <p className="font-bold text-slate-900">{currentApp.application_date || 'Recent'}</p>
            </div>
          </div>
        </div>

        {/* Progress & Quick Actions */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-wider mb-2">Workflow Gating Progress</h4>
            <div className="flex items-center justify-between relative py-1 px-1">
              <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>

              {[
                { step: 1, label: 'Docs', done: initialDocsApproved },
                { step: 2, label: 'Payment ⚡', done: feeApproved },
                { step: 3, label: 'Lender Proof', done: proofApproved },
                { step: 4, label: 'Bank', done: bankApproved },
                { step: 5, label: 'Disburse', done: isFinalApproved },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center relative z-10" title={s.label}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      s.done
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isFinalRejected
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {s.done ? <Check className="w-3 h-3" /> : s.step}
                  </div>
                  <span className="text-[9px] font-bold text-slate-600 mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setRejectModalOpen(true)}
            disabled={isFinalRejected}
            className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[11px] font-black rounded-lg shadow-xs flex items-center justify-center gap-1 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Whole Application</span>
          </button>
        </div>
      </div>

      {/* WITHOUT CIBIL ADMIN TIER ASSIGNMENT ACTION CARD */}
      {isWithoutCibil && !isFinalRejected && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-2 border-rose-500/50 rounded-2xl p-4 text-white space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <h4 className="text-xs font-black uppercase text-rose-200 tracking-wider">
                🔴 Without CIBIL Application — Review & Tier Assignment
              </h4>
            </div>
            <span className="text-[10px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full uppercase">
              Action Required
            </span>
          </div>

          <p className="text-xs text-rose-100 font-medium">
            This customer applied under <strong>Without CIBIL (Zero History)</strong>. Please review their profile and approve as <strong>Low CIBIL</strong> or <strong>High CIBIL</strong> tier below.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={() => handleApproveCibilTier('low_cibil', 'Low CIBIL')}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Approve & Assign as 🟠 Low CIBIL Loan</span>
            </button>

            <button
              onClick={() => handleApproveCibilTier('good_cibil', 'High CIBIL')}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Approve & Assign as 🟢 High CIBIL Loan</span>
            </button>
          </div>
        </div>
      )}

      {/* MULTI-STAGE ADMIN APPROVAL ACTION BAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
              Multi-Stage Admin Verification & Stage Gating Controls
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md">
            Sequential Approval Gates Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Stage 1: Initial Documents */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">1. Initial Docs</span>
                {initialDocsApproved ? (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">Approved ✓</span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">Pending Review</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-200 mt-1 truncate">
                PAN, Aadhaar & Statement
              </p>
            </div>
            {initialDocsApproved ? (
              <div className="w-full py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-extrabold rounded-lg text-center shadow-xs">
                ✓ Docs Approved
              </div>
            ) : isFinalRejected ? (
              <div className="w-full py-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-bold rounded-lg text-center">
                Application Rejected
              </div>
            ) : (
              <button
                onClick={() => handleApproveStage('initial_docs', 'Initial Documents')}
                disabled={loading}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Approve Initial Docs
              </button>
            )}
          </div>

          {/* Stage 2: Processing Fee Payment (Auto Approved) */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">2. Fee Payment</span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">⚡ Auto-Approved</span>
              </div>
              <p className="text-xs font-bold text-slate-200 mt-1">
                Ref: <span className="font-mono">{currentApp.transaction_id || 'Auto Verified'}</span>
              </p>
            </div>
            <div className="w-full py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-extrabold rounded-lg text-center shadow-xs">
              ⚡ Fee Auto-Verified
            </div>
          </div>

          {/* Stage 3: Lender Proof */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">3. Lender Proof</span>
                {proofApproved ? (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">Approved ✓</span>
                ) : !feeApproved ? (
                  <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-1.5 py-0.2 rounded border border-slate-600">Locked 🔒</span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">Pending</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-200 mt-1">
                App No: <span className="font-mono">{currentApp.bank_application_no || 'Not Uploaded'}</span>
              </p>
            </div>
            {proofApproved ? (
              <div className="w-full py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-extrabold rounded-lg text-center shadow-xs">
                ✓ Proof Approved
              </div>
            ) : !feeApproved ? (
              <button
                disabled
                className="w-full py-1.5 bg-slate-800 border border-slate-700 text-slate-500 font-bold text-[11px] rounded-lg cursor-not-allowed opacity-60"
              >
                🔒 Locked (Step 2 Pending)
              </button>
            ) : isFinalRejected ? (
              <div className="w-full py-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-bold rounded-lg text-center">
                Application Rejected
              </div>
            ) : (
              <button
                onClick={() => handleApproveStage('lender_proof', 'Lender Proof Screenshot')}
                disabled={loading}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Approve Lender Proof
              </button>
            )}
          </div>

          {/* Stage 4: Bank Details */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">4. Bank Details</span>
                {bankApproved ? (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">Approved ✓</span>
                ) : !proofApproved ? (
                  <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-1.5 py-0.2 rounded border border-slate-600">Locked 🔒</span>
                ) : !hasBankSubmitted ? (
                  <span className="text-[10px] font-bold bg-slate-800 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">Not Submitted</span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">Pending Review</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-200 mt-1 truncate">
                {currentApp.bank_name || currentApp.bank_details?.bank_name || 'Not Submitted'} {currentApp.bank_ifsc_code ? `(${currentApp.bank_ifsc_code})` : ''}
              </p>
            </div>
            {bankApproved ? (
              <div className="w-full py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-extrabold rounded-lg text-center shadow-xs">
                ✓ Bank Approved
              </div>
            ) : !proofApproved ? (
              <button
                disabled
                className="w-full py-1.5 bg-slate-800 border border-slate-700 text-slate-500 font-bold text-[11px] rounded-lg cursor-not-allowed opacity-60"
              >
                🔒 Locked (Lender Proof Pending)
              </button>
            ) : isFinalRejected ? (
              <div className="w-full py-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-bold rounded-lg text-center">
                Application Rejected
              </div>
            ) : !hasBankSubmitted ? (
              <button
                disabled
                className="w-full py-1.5 bg-slate-800 border border-slate-700 text-amber-400/90 font-bold text-[11px] rounded-lg cursor-not-allowed opacity-80"
              >
                ⏳ Awaiting User Bank Details
              </button>
            ) : (
              <button
                onClick={() => handleApproveStage('bank_details', 'Disbursal Bank Details')}
                disabled={loading}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Approve Bank Details
              </button>
            )}
          </div>

          {/* Stage 5: Final Loan Approval & Disbursal */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">5. Final Fund Release</span>
                {isFinalApproved ? (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">Disbursed ✓</span>
                ) : isFinalRejected ? (
                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/30">Rejected ✗</span>
                ) : !bankApproved ? (
                  <span className="text-[10px] font-bold bg-slate-700 text-slate-400 px-1.5 py-0.2 rounded border border-slate-600">Locked 🔒</span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/30">Pending</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-200 mt-1">
                Status: <span className="uppercase font-mono">{currentApp.final_decision || 'PROCESSING'}</span>
              </p>
            </div>
            {isFinalApproved ? (
              <div className="w-full py-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] font-extrabold rounded-lg text-center shadow-xs">
                ✓ Funds Disbursed
              </div>
            ) : isFinalRejected ? (
              <div className="w-full py-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-bold rounded-lg text-center">
                Application Rejected
              </div>
            ) : !bankApproved ? (
              <button
                disabled
                className="w-full py-1.5 bg-slate-800 border border-slate-700 text-slate-500 font-bold text-[11px] rounded-lg cursor-not-allowed opacity-60"
              >
                🔒 Locked (Bank Details Pending)
              </button>
            ) : (
              <button
                onClick={() => handleApproveStage('disbursement', 'Final Loan Disbursement')}
                disabled={loading}
                className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-lg shadow-md transition-all cursor-pointer"
              >
                Final Approve & Disburse
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REQUEST EXTRA DOCUMENTS MODAL */}
      {extraDocsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-indigo-900 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-600" />
                Request Extra Documents
              </h3>
              <button onClick={() => setExtraDocsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRequestExtraDocs} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specify Extra Document Names (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={extraDocsText}
                  onChange={(e) => setExtraDocsText(e.target.value)}
                  placeholder="e.g. Utility Bill, Month 2 Salary Slip, Form 16 ITR"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px] font-medium leading-relaxed">
                <strong>Notice:</strong> This will send an extra document request to the customer portal and notify them to upload these specific files before continuing.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setExtraDocsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !extraDocsText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Sending Request...' : 'Send Document Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Reject Whole Application #{currentApp.application_number || currentApp.id}
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRejectApplication} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specify Whole Application Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Applicant failed credit risk assessment / Document forgery / Fraudulent application"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium leading-relaxed">
                <strong>Notice:</strong> Rejecting the whole application will set <code>final_decision = REJECTED</code>, activate the 3-Day Reapply Lock for this user, and move the application directly to the <strong>Rejected Section</strong>.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !rejectionReason.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Rejecting Whole App...' : 'Confirm Whole Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
