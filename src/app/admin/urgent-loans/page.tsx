'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest, resolveMediaUrl } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Zap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  CreditCard,
  User,
  ExternalLink,
  Upload,
  RefreshCw,
  Eye,
  Check,
  X,
  Sparkles,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Send,
  Loader2,
  ArrowRight,
  IndianRupee,
  Download,
} from 'lucide-react';

export default function AdminUrgentLoansPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [mediaModal, setMediaModal] = useState<{ title: string; url: string } | null>(null);
  const [stats, setStats] = useState<any>({
    total: 0,
    under_review: 0,
    docs_required: 0,
    technical_verification: 0,
    bank_processing: 0,
    sanction_approved: 0,
    amount_released: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loanTypeFilter, setLoanTypeFilter] = useState<'all' | 'urgent_construction_loan' | 'elite_cash_loan'>('all');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  // Modals & Action States
  const [requestDocsModalOpen, setRequestDocsModalOpen] = useState<boolean>(false);
  const [requestedDocsText, setRequestedDocsText] = useState<string>('Updated salary slip / bank statement and KYC document');
  const [adminRemarkText, setAdminRemarkText] = useState<string>('');

  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('Application verification criteria not satisfied.');

  const [propertyNotes, setPropertyNotes] = useState<string>('');

  const fetchApps = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (debouncedSearch) q.set('search', debouncedSearch);
      if (activeTab !== 'all') q.set('stage', activeTab);
      if (loanTypeFilter !== 'all') q.set('loan_type', loanTypeFilter);

      const res = await apiRequest(`/admin/urgent-construction-loans?${q.toString()}`);
      if (res && res.data) {
        setApps(res.data);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [debouncedSearch, activeTab, loanTypeFilter]);

  const handleAdminAction = async (action: string, payload: any = {}) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const endpoint = selectedApp.loan_type === 'elite_cash_loan'
        ? `/admin/elite-cash-loans/${selectedApp.id}/action`
        : `/admin/urgent-construction-loans/${selectedApp.id}/action`;

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
      });

      if (res && res.data) {
        setSelectedApp(res.data);
        setMsg(`Urgent Loan #${res.data.application_number || res.data.id} updated: Action [${action}] applied.`);
        fetchApps();
      }
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
      setRequestDocsModalOpen(false);
      setRejectModalOpen(false);
    }
  };

  const getStageBadge = (stage: string) => {
    const map: any = {
      under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      docs_required: { label: 'Docs Required', color: 'bg-rose-100 text-rose-800 border-rose-200' },
      file_created: { label: 'File Created', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      technical_verification: { label: 'Tech Verification', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      bank_processing: { label: 'Bank Processing', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      sanction_approved: { label: 'Sanction Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      disbursement_pending: { label: 'Disbursement Pending', color: 'bg-teal-100 text-teal-800 border-teal-200' },
      amount_released: { label: 'Amount Released', color: 'bg-emerald-200 text-emerald-900 border-emerald-300' },
      rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-900 border-rose-300' },
      fee_payment_pending: { label: 'Fee Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    };
    const s = map[stage] || { label: stage, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 text-slate-950 rounded-xl shadow-2xs">
              <Zap className="w-4 h-4 fill-slate-950" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Express &amp; Urgent Loans Hub</h2>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
              {stats.total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Dedicated fast-track review module for <strong>⚡ Elite Cash Loans</strong> &amp; <strong>🏗️ Urgent Construction Loans</strong>, document verification &amp; instant sanctioning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Loan Category Selector Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLoanTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                loanTypeFilter === 'all'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setLoanTypeFilter('elite_cash_loan')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                loanTypeFilter === 'elite_cash_loan'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-50'
              }`}
            >
              <span>⚡ Elite Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setLoanTypeFilter('urgent_construction_loan')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                loanTypeFilter === 'urgent_construction_loan'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-amber-900 hover:bg-amber-50'
              }`}
            >
              <span>🏗️ Construction</span>
            </button>
          </div>

          <button
            onClick={fetchApps}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: 'Total Urgent', count: stats.total, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Under Review', count: stats.under_review, color: 'text-blue-600', bg: 'bg-blue-50/60 border-blue-200' },
          { label: 'Docs Required', count: stats.docs_required, color: 'text-rose-600', bg: 'bg-rose-50/60 border-rose-200' },
          { label: 'Tech Verify', count: stats.technical_verification, color: 'text-indigo-600', bg: 'bg-indigo-50/60 border-indigo-200' },
          { label: 'Bank Review', count: stats.bank_processing, color: 'text-cyan-600', bg: 'bg-cyan-50/60 border-cyan-200' },
          { label: 'Sanctioned', count: stats.sanction_approved, color: 'text-emerald-600', bg: 'bg-emerald-50/60 border-emerald-200' },
          { label: 'Disbursed', count: stats.amount_released, color: 'text-teal-600', bg: 'bg-teal-50/60 border-teal-200' },
        ].map((c) => (
          <div key={c.label} className={`p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1 ${c.bg}`}>
            <span className="text-[10px] font-extrabold uppercase text-slate-500 block truncate">{c.label}</span>
            <p className={`text-xl font-black ${c.color}`}>{c.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {[
              { key: 'all', label: 'All' },
              { key: 'under_review', label: 'Under Review' },
              { key: 'docs_required', label: 'Docs Required' },
              { key: 'technical_verification', label: 'Verification Stage' },
              { key: 'bank_processing', label: 'Bank Processing' },
              { key: 'sanction_approved', label: 'Approved' },
              { key: 'amount_released', label: 'Disbursed' },
              { key: 'rejected', label: 'Rejected' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  activeTab === t.key
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, Application No, Mobile, UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Applications List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="py-2.5 px-3">Type &amp; App #</th>
                <th className="py-2.5 px-3">Applicant &amp; Mobile</th>
                <th className="py-2.5 px-3">Required Amount</th>
                <th className="py-2.5 px-3">Purpose / Property</th>
                <th className="py-2.5 px-3">Fee Payment &amp; UTR</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-1" />
                    <span>Loading Express Applications...</span>
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No express loan applications found in this view.
                  </td>
                </tr>
              ) : (
                apps.map((app) => {
                  const isElite = app.loan_type === 'elite_cash_loan';
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 mb-1">
                          {isElite ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-[9px] font-black uppercase">
                              ⚡ Elite Cash
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[9px] font-black uppercase">
                              🏗️ Construction
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-black text-slate-900 block">
                          #{app.application_number || `${isElite ? 'ECL' : 'UCL'}-${app.id}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{app.full_name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{app.mobile_number}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-black text-slate-900 block">
                          ₹{Number(app.required_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Income: ₹{Number(app.monthly_income || 0).toLocaleString('en-IN')}/m
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {isElite ? (app.loan_purpose || 'Personal / Cash') : (app.property_type || 'Plot / Site')}
                        </span>
                        <span className="text-[10px] text-slate-500">{app.property_city || app.city || 'India'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200 block truncate max-w-[130px]">
                            {app.transaction_id || 'Fee Submitted'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            Fee: ₹{Number(app.fee_amount || app.processing_fee || 999).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {getStageBadge(app.urgent_stage || app.status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & VERIFICATION DRAWER / MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
                  <Zap className="w-4 h-4 fill-slate-950" />
                </span>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2">
                    {selectedApp.full_name}
                    <span className="text-[10px] font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded">
                      #{selectedApp.application_number || `UCL-${selectedApp.id}`}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Urgent Construction Loan Verification &amp; Stage Controls</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Top Status & Stage Changer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stage</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    {getStageBadge(selectedApp.urgent_stage || selectedApp.status)}
                    <span className="text-xs text-slate-600 font-medium">
                      Amount: <strong className="text-slate-900 font-bold">₹{Number(selectedApp.required_amount || 0).toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedApp.urgent_stage || selectedApp.status}
                    onChange={(e) => handleAdminAction('update_stage', { stage: e.target.value })}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  >
                    <option value="under_review">1. Under Review</option>
                    <option value="docs_required">2. Documents Required</option>
                    <option value="file_created">3. File Created</option>
                    <option value="technical_verification">4. Technical Verification</option>
                    <option value="bank_processing">5. Bank Processing</option>
                    <option value="sanction_approved">6. Sanction Approved</option>
                    <option value="disbursement_pending">7. Disbursement Pending</option>
                    <option value="amount_released">8. Amount Released</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* SECTION 1: APPLICANT & KYC VERIFICATION */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                    Applicant Personal &amp; KYC
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    KYC Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Full Name</span>
                    <span className="font-bold text-slate-900">{selectedApp.full_name}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Mobile Number</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.mobile_number}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">PAN Number</span>
                    <span className="font-mono font-black text-blue-700">{selectedApp.pan_number}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Aadhaar Number</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.aadhaar_number}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Monthly Income</span>
                    <span className="font-bold text-slate-900">₹{Number(selectedApp.monthly_income || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Employment</span>
                    <span className="font-bold text-slate-900">{selectedApp.employment_type}</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-xl text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Residential Address</span>
                  <span className="text-slate-700 font-medium">{selectedApp.address || selectedApp.property_address}</span>
                </div>
              </div>

              {/* SECTION 2: PROPERTY & CONSTRUCTION DETAILS */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Property &amp; Technical Verification
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAdminAction('verify_property', { property_notes: propertyNotes || 'Property verified on technical layout.' })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                      selectedApp.property_verification_status === 'verified'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    }`}
                  >
                    {selectedApp.property_verification_status === 'verified' ? 'Property Verified ✓' : 'Mark Property Verified'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Property Type</span>
                    <span className="font-bold text-slate-900">{selectedApp.property_type || 'Plot'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Purpose</span>
                    <span className="font-bold text-slate-900">{selectedApp.construction_purpose}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Project Cost</span>
                    <span className="font-bold text-slate-900">₹{Number(selectedApp.estimated_project_cost || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-xl text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Site Location</span>
                  <span className="text-slate-700 font-medium">
                    {selectedApp.property_address}, {selectedApp.property_city} - {selectedApp.property_pincode}
                  </span>
                </div>
              </div>

              {/* SECTION 3: FEE PAYMENT VERIFICATION */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    Fee Payment &amp; UTR Verification
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAdminAction('verify_payment')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                      selectedApp.fee_payment_status === 'approved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                    }`}
                  >
                    {selectedApp.fee_payment_status === 'approved' ? 'Payment Verified ✓' : 'Approve Payment'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Transaction / UTR ID</span>
                    <span className="font-mono font-black text-slate-900">{selectedApp.transaction_id || 'Not Submitted'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Fee Amount</span>
                    <span className="font-bold text-slate-900">₹{Number(selectedApp.processing_fee || selectedApp.fee_amount || 999).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {selectedApp.payment_screenshot && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Payment Receipt Screenshot</span>
                      <a
                        href={resolveMediaUrl(selectedApp.payment_screenshot)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in New Tab
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() =>
                          setMediaModal({
                            title: `Payment Screenshot (${selectedApp.application_number || selectedApp.application_no || ''})`,
                            url: resolveMediaUrl(selectedApp.payment_screenshot),
                          })
                        }
                        className="w-24 h-16 rounded-xl bg-slate-900 border border-slate-300 overflow-hidden cursor-pointer shrink-0 relative group shadow-2xs"
                      >
                        <img
                          src={resolveMediaUrl(selectedApp.payment_screenshot)}
                          alt="Payment Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setMediaModal({
                              title: `Payment Screenshot (${selectedApp.application_number || selectedApp.application_no || ''})`,
                              url: resolveMediaUrl(selectedApp.payment_screenshot),
                            })
                          }
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" /> Full Preview
                        </button>
                        <p className="text-[10px] text-slate-400 font-mono break-all line-clamp-1">
                          {resolveMediaUrl(selectedApp.payment_screenshot)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: UPLOADED DOCUMENTS VERIFICATION */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Uploaded Documents &amp; Proofs
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAdminAction('verify_docs')}
                    className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-lg text-[10px] font-black border border-indigo-300"
                  >
                    Verify All Docs ✓
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {selectedApp.documents_uploaded && Object.keys(selectedApp.documents_uploaded).length > 0 ? (
                    Object.entries(selectedApp.documents_uploaded).map(([k, v]: any) => {
                      const docUrl = resolveMediaUrl(v) || resolveMediaUrl(selectedApp[k]) || resolveMediaUrl(selectedApp[`${k}_file`]);
                      const docName = typeof v === 'object' ? (v.name || v.file || k) : (typeof v === 'string' && !v.startsWith('data:') ? v : `${k}`);
                      const isImageOrData = docUrl && (docUrl.startsWith('data:image') || docUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i));

                      return (
                        <div key={k} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="font-black text-slate-900 block capitalize text-xs">
                                {k.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[170px]" title={docName}>
                                {docName}
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              Uploaded ✓
                            </span>
                          </div>

                          {docUrl && (
                            <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={() =>
                                  setMediaModal({
                                    title: `${k.replace(/_/g, ' ').toUpperCase()} - ${selectedApp.full_name || ''}`,
                                    url: docUrl,
                                  })
                                }
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3 h-3 text-indigo-600" /> Preview
                              </button>

                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-lg flex items-center gap-1 border border-indigo-200"
                              >
                                <ExternalLink className="w-3 h-3" /> Open Link ↗
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 col-span-2">No documents attached.</p>
                  )}
                </div>
              </div>

              {/* SECTION 5: DISBURSEMENT BANK DETAILS */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Disbursement Bank Account
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Holder</span>
                    <span className="font-bold text-slate-900">{selectedApp.bank_account_holder_name || selectedApp.full_name}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Bank Name</span>
                    <span className="font-bold text-slate-900">{selectedApp.bank_name}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Number</span>
                    <span className="font-mono font-black text-slate-900">{selectedApp.bank_account_number}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.bank_ifsc_code}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Type</span>
                    <span className="font-bold text-slate-900">{selectedApp.bank_account_type || 'Savings'}</span>
                  </div>
                </div>
              </div>

              {/* PRIMARY ADMIN ACTIONS BAR */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                <h4 className="text-xs font-black uppercase text-amber-300 tracking-wider">Execute Decision</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAdminAction('approve')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Sanction</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setRequestDocsModalOpen(true)}
                    className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Need More Docs</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setRejectModalOpen(true)}
                    className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Loan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEED MORE DOCS MODAL */}
      {requestDocsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-600" /> Request Additional Documents
              </h3>
              <button onClick={() => setRequestDocsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              User portal status will change to <strong>Documents Required</strong> and prompt the applicant to upload requested items.
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-bold text-slate-700">Documents to Request *</label>
                <textarea
                  rows={2}
                  value={requestedDocsText}
                  onChange={(e) => setRequestedDocsText(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Admin Remark / Message to Applicant</label>
                <input
                  type="text"
                  value={adminRemarkText}
                  onChange={(e) => setAdminRemarkText(e.target.value)}
                  placeholder="e.g. Please provide clear colored copy of property khata"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRequestDocsModalOpen(false)}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  handleAdminAction('need_more_docs', {
                    requested_docs: requestedDocsText,
                    admin_remark: adminRemarkText,
                  })
                }
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Document Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT LOAN MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-rose-600 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Reject Urgent Application
              </h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAdminAction('reject', { rejection_reason: rejectionReasonText })}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE MEDIA / DOCUMENT PREVIEW LIGHTBOX MODAL */}
      {mediaModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl relative border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" /> {mediaModal.title}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-md">{mediaModal.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setMediaModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-[300px] bg-slate-950 rounded-2xl p-2 flex items-center justify-center overflow-hidden border border-slate-800">
              {mediaModal.url.startsWith('data:image') ||
              mediaModal.url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
              !mediaModal.url.endsWith('.pdf') ? (
                /* eslint-disable-next-html-link */
                <img
                  src={mediaModal.url}
                  alt={mediaModal.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  onError={(e: any) => {
                    // fallback if direct image fails
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.fallback-msg')) {
                      const div = document.createElement('div');
                      div.className = 'fallback-msg text-center p-6 text-slate-300 space-y-2';
                      div.innerHTML = `<p class="font-bold text-sm">Preview could not be rendered directly</p><p class="text-xs text-slate-400">Click below to open document in a new tab</p>`;
                      parent.appendChild(div);
                    }
                  }}
                />
              ) : (
                <iframe src={mediaModal.url} className="w-full h-[55vh] rounded-lg bg-white" title={mediaModal.title} />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <a
                href={mediaModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Open Full URL in New Tab ↗
              </a>
              <button
                type="button"
                onClick={() => setMediaModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
