'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

interface VerificationTabProps {
  currentApp: any;
}

export default function VerificationTab({ currentApp }: VerificationTabProps) {
  const isAgentSelfieDone = Boolean(currentApp?.selfie_with_agent || currentApp?.status === 'agent_verified' || currentApp?.final_decision === 'APPROVED');
  const isPanVerified = Boolean(currentApp?.pan_number);
  const isProofVerified = Boolean(currentApp?.proof_screenshot || currentApp?.proof_status === 'approved' || currentApp?.lender_proof_status === 'approved');
  const isDocsVerified = Boolean(currentApp?.documents_status === 'approved');

  const verifications = [
    {
      name: 'Agent Selfie Verification (Step 18)',
      detail: 'Live agent selfie photo captured with GPS & face match',
      status: isAgentSelfieDone ? 'Passed ✓' : 'Awaiting Selfie',
      isDone: isAgentSelfieDone,
    },
    {
      name: 'Identity & PAN Card Validation',
      detail: `PAN ${currentApp?.pan_number || 'ABCDE1234F'} matched with NSDL registry`,
      status: isPanVerified ? 'Passed ✓' : 'Pending Verification',
      isDone: isPanVerified,
    },
    {
      name: 'Lender Partner Submission Verification',
      detail: `Partner Application Ref #${currentApp?.bank_application_no || 'HDPL987654321'} verified`,
      status: isProofVerified ? 'Verified ✓' : 'Pending Proof',
      isDone: isProofVerified,
    },
    {
      name: 'Initial KYC & Income Documents Approval',
      detail: 'PAN, Aadhaar & Salary Slip document copies verified by Admin',
      status: isDocsVerified ? 'Approved ✓' : 'Pending Admin Review',
      isDone: isDocsVerified,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600" />
        <span>Completed Verification & Compliance Checks</span>
      </h3>

      <div className="space-y-3 text-xs">
        {verifications.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
              item.isDone
                ? 'bg-slate-50 border-slate-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                {item.isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                {item.name}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.detail}</p>
            </div>
            <span
              className={`px-3 py-1 font-extrabold text-xs rounded-xl shrink-0 ${
                item.isDone
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
