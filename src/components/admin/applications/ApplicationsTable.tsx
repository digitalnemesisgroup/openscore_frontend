'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, ShieldAlert } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { formatLoanType } from '@/lib/loan-resume';
import PaginationControls from '@/components/admin/PaginationControls';

interface ApplicationsTableProps {
  filteredApplications: any[];
  paginatedApplications?: any[];
  currentApp?: any;
  setSelectedApp?: (app: any) => void;
  setApplications: (apps: any[]) => void;
  applications: any[];
  setActionSuccessMsg: (msg: string) => void;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
}

function getVerificationBadge(app: any) {
  const status = (app.status || '').toLowerCase();
  const dec = (app.final_decision || '').toUpperCase();
  const docStatus = (app.documents_status || '').toLowerCase();
  const proofStatus = (app.proof_status || '').toLowerCase();
  const bankStatus = (app.bank_details_status || '').toLowerCase();

  const isFinalDone = dec === 'APPROVED' || status === 'approved' || status === 'disbursed' || dec === 'REJECTED' || status === 'rejected';
  if (isFinalDone) return null;

  const isWithoutCibil =
    app.loan_type === 'no_cibil' ||
    app.loan_type === 'construction_no_cibil' ||
    (app.loan_type || '').toLowerCase().includes('without');

  // 1. Without CIBIL tier assignment needed
  if (isWithoutCibil && status !== 'cibil_tier_assigned' && status !== 'approved' && status !== 'rejected') {
    return {
      label: '🔴 Tier Review Needed',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
      isHighPriority: true,
      symbol: '🔴',
    };
  }

  // 2. Initial Docs verification pending
  if (docStatus === 'pending' || status === 'documents_uploaded') {
    return {
      label: '📄 Docs Approval Pending',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black animate-pulse',
      isHighPriority: true,
      symbol: '📄',
    };
  }

  // 3. Lender proof verification pending
  if (proofStatus === 'pending' || status === 'proof_pending') {
    return {
      label: '📸 Proof Verification Pending',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-black animate-pulse',
      isHighPriority: true,
      symbol: '📸',
    };
  }

  // 4. Bank details verification pending
  if (bankStatus === 'pending' || status === 'bank_details_pending') {
    return {
      label: '🏦 Bank Details Review',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-black',
      isHighPriority: false,
      symbol: '🏦',
    };
  }

  // 5. In Review / Under Review / Pending
  return {
    label: '⚠️ Verification Action Required',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black animate-pulse',
    isHighPriority: true,
    symbol: '⚠️',
  };
}

export default function ApplicationsTable({
  filteredApplications,
  paginatedApplications,
  currentApp,
  setSelectedApp,
  setApplications,
  applications,
  setActionSuccessMsg,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
}: ApplicationsTableProps) {
  const router = useRouter();
  const displayApps = paginatedApplications || filteredApplications;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs space-y-0">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Applications List ({filteredApplications.length})</span>
        </h3>
        <span className="text-[11px] font-bold text-slate-600">
          Click row to open details
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="py-2.5 px-3">App No.</th>
              <th className="py-2.5 px-3">Verification Alert</th>
              <th className="py-2.5 px-3">Applicant</th>
              <th className="py-2.5 px-3">Loan Type</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Applied Date</th>
              <th className="py-2.5 px-3">Status Stage</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-xs">
            {displayApps.map((app) => {
              const isSelected = currentApp?.id === app.id;
              const appStatus = (app.status || 'under_review').toLowerCase();
              const vBadge = getVerificationBadge(app);

              const handleOpenDetails = (appToOpen: any) => {
                if (setSelectedApp) setSelectedApp(appToOpen);
                router.push(`/admin/applications/details?id=${appToOpen.id}`);
              };

              return (
                <tr
                  key={app.id}
                  onClick={() => handleOpenDetails(app)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/90 border-l-4 border-l-blue-600 font-bold'
                      : vBadge?.isHighPriority
                      ? 'bg-amber-50/40 hover:bg-amber-100/60'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 text-[11px]">
                        #{app.application_number || app.id}
                      </span>
                    </div>
                  </td>

                  {/* Dedicated Verification Alert Column with Symbol */}
                  <td className="py-2.5 px-3">
                    {vBadge ? (
                      <span
                        title="Admin Action Required"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-xs animate-pulse shrink-0"
                      >
                        <ShieldAlert className="w-3 h-3 text-amber-300 shrink-0" />
                        <span>VERIFY NOW</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        ✓ OK
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                      <span>{app.full_name || 'N/A'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {app.mobile_number} {app.email ? `• ${app.email}` : ''}
                    </div>

                    {/* Prominent Admin Verification Badge */}
                    {vBadge ? (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] border shadow-2xs mt-0.5 ${vBadge.badgeClass}`}>
                        <ShieldAlert className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                        <span>{vBadge.label}</span>
                      </span>
                    ) : app.rejection_reason && (app.rejection_reason.includes('Cancelled') || app.rejection_reason.includes('cancelled')) ? (
                      <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 block mt-0.5 w-fit uppercase">
                        Cancelled by User
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                      app.loan_type === 'construction_loan' || app.loan_type === 'construction'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : app.loan_type === 'low_cibil' || app.loan_type === 'Low CIBIL Loan'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {formatLoanType(app.loan_type)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-black text-slate-900 text-xs">
                    ₹{(app.requested_amount || app.selected_amount || 200000).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-medium text-[11px] whitespace-nowrap">
                    {app.application_date || 'Recent'}
                  </td>
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={appStatus}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        try {
                          await apiRequest(`/admin/applications/${app.id}/update-stage`, {
                            method: 'POST',
                            body: JSON.stringify({ stage: newStatus }),
                          });
                        } catch (err) {}
                        const updated = { ...app, status: newStatus };
                        setApplications(applications.map((a) => (a.id === app.id ? updated : a)));
                        if (currentApp?.id === app.id && setSelectedApp) setSelectedApp(updated);
                        setActionSuccessMsg(`Status for #${app.application_number} updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border focus:outline-none ${
                        appStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : appStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : appStatus === 'disbursed'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="disbursement_pending">Disbursement Pending</option>
                      <option value="disbursed">Disbursed</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(app);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-2xs ${
                        isSelected
                          ? 'bg-blue-600 text-white font-extrabold'
                          : vBadge
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black animate-pulse'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Viewing' : vBadge ? 'Verify Loan →' : 'View Details'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QUERY-BASED PAGINATION CONTROLS */}
      {onPageChange && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredApplications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  );
}
