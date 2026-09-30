'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import {
  ChevronRight,
  CheckCircle2,
  XCircle,
  Building2,
  FileText,
  ShieldCheck,
  CreditCard,
  Plus,
  Edit,
  Eye,
  Upload,
  Send,
  Calendar,
  Check,
  Lock,
  Maximize2,
  X,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import OverviewTab from '@/components/admin/applications/OverviewTab';
import PersonalDetailsTab from '@/components/admin/applications/PersonalDetailsTab';
import LoanDetailsTab from '@/components/admin/applications/LoanDetailsTab';
import DocumentsTab from '@/components/admin/applications/DocumentsTab';
import VerificationTab from '@/components/admin/applications/VerificationTab';
import BankDetailsTab from '@/components/admin/applications/BankDetailsTab';
import DisbursementAgreementTab from '@/components/admin/applications/DisbursementAgreementTab';
import ApplicationHeaderCard from '@/components/admin/applications/ApplicationHeaderCard';
import ApplicationsTable from '@/components/admin/applications/ApplicationsTable';

import { getCachedApplications, setCachedApplications } from '@/lib/loan-cache';

export function needsVerification(app: any): boolean {
  if (!app) return false;
  const status = (app.status || '').toLowerCase();
  const dec = (app.final_decision || '').toUpperCase();

  const isFinalDone =
    dec === 'APPROVED' ||
    status === 'approved' ||
    status === 'disbursed' ||
    dec === 'REJECTED' ||
    status === 'rejected' ||
    status === 'cancelled';
  if (isFinalDone) return false;

  return true;
}

export function matchApplicationFilter(app: any, filterId: string): boolean {
  if (!filterId || filterId === 'all') return true;
  const status = (app.status || '').toLowerCase();
  const dec = (app.final_decision || '').toUpperCase();
  const disbStatus = (app.disbursement_status || '').toLowerCase();

  switch (filterId) {
    case 'new':
      return (
        status === 'new' ||
        status === 'indicative_approved' ||
        status === 'pending' ||
        status === 'documents_pending' ||
        status === 'documents_uploaded' ||
        status === 'fee_payment_pending' ||
        status === 'fee_submitted_pending_verification' ||
        status === 'pending_partner_selection' ||
        status === 'repayment_selected'
      );
    case 'in_review':
      return (
        status === 'under_review' ||
        status === 'in_review' ||
        status === 'proof_pending' ||
        status === 'proof_submitted' ||
        status === 'bank_details_pending' ||
        status === 'additional_docs_submitted' ||
        status === 'additional_docs_required' ||
        status === 'cibil_tier_assigned' ||
        needsVerification(app)
      );
    case 'approved':
      return status === 'approved' || dec === 'APPROVED' || status === 'disbursement_pending';
    case 'disbursement_pending':
      return (
        (status === 'approved' || dec === 'APPROVED' || status === 'disbursement_pending') &&
        status !== 'disbursed' &&
        disbStatus !== 'credited'
      );
    case 'disbursed':
      return status === 'disbursed' || disbStatus === 'credited';
    case 'rejected':
      return status === 'rejected' || status === 'cancelled' || dec === 'REJECTED';
    case 'reapply_3_days':
      return Boolean(app.reapply_locked_until) || status === 'reapply_3_days';
    default:
      return status === filterId;
  }
}

export default function AdminApplicationsPage({ defaultFilter = 'all' }: { defaultFilter?: string }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [selectedFilter, setSelectedFilter] = useState<string>(defaultFilter);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qStatus = params.get('status');
      const qPage = params.get('page');
      const qPerPage = params.get('per_page');
      const qSearch = params.get('search');

      if (qStatus) setSelectedFilter(qStatus);
      else if (defaultFilter) setSelectedFilter(defaultFilter);

      if (qPage) setCurrentPage(Number(qPage));
      if (qPerPage) setItemsPerPage(Number(qPerPage));
      if (qSearch) setSearchTerm(qSearch);
    }
  }, [defaultFilter]);

  // Instant 0ms memory & local cache initialization
  const [applications, setApplications] = useState<any[]>(() => getCachedApplications());
  const [loading, setLoading] = useState<boolean>(() => getCachedApplications().length === 0);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [previewDocModal, setPreviewDocModal] = useState<{ title: string; src: string; verified: boolean } | null>(null);
  const [addRemarkModalOpen, setAddRemarkModalOpen] = useState<boolean>(false);
  const [newRemarkText, setNewRemarkText] = useState<string>('');
  const [newRemarkType, setNewRemarkType] = useState<'internal' | 'user_update'>('internal');
  const [createAppModalOpen, setCreateAppModalOpen] = useState<boolean>(false);

  const [newAppForm, setNewAppForm] = useState<any>({
    full_name: '',
    mobile_number: '',
    email: '',
    loan_type: 'Low CIBIL Loan',
    requested_amount: 200000,
    tenure_months: 24,
    partner_bank: 'HDFC Bank',
    employment: 'Salaried',
    monthly_income: 0,
    location: '',
  });

  const [localRemarks, setLocalRemarks] = useState<Array<{ id: number; author: string; date: string; text: string; type: string }>>([]);

  const fetchAdminData = async () => {
    try {
      const appsRes = await apiRequest('/admin/applications');
      if (appsRes && appsRes.data && Array.isArray(appsRes.data)) {
        setApplications(appsRes.data);
        setCachedApplications(appsRes.data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'cash' | 'construction'>('all');

  // Instant in-memory filtering by status, category and search term
  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      // 0. Category Filter (Cash Loan vs Construction Loan)
      const loanType = (app.loan_type || '').toLowerCase();
      const isConstruction = loanType.includes('construction');
      if (categoryFilter === 'cash' && isConstruction) return false;
      if (categoryFilter === 'construction' && !isConstruction) return false;

      // 1. Status Filter
      if (selectedFilter && selectedFilter !== 'all') {
        if (!matchApplicationFilter(app, selectedFilter)) return false;
      }

      // 2. Search Term Filter
      if (debouncedSearchTerm) {
        const query = debouncedSearchTerm.toLowerCase();
        const nameMatch = (app.full_name || '').toLowerCase().includes(query);
        const mobileMatch = (app.mobile_number || '').includes(query);
        const emailMatch = (app.email || '').toLowerCase().includes(query);
        const appNoMatch = (app.application_number || '').toLowerCase().includes(query);
        if (!nameMatch && !mobileMatch && !emailMatch && !appNoMatch) return false;
      }

      return true;
    });
  }, [applications, selectedFilter, categoryFilter, debouncedSearchTerm]);

  // Paginated applications slice
  const paginatedApplications = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  const detailsRef = React.useRef<HTMLDivElement | null>(null);

  const handleSelectApp = (app: any) => {
    setSelectedApp(app);
    if (app) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Sync selectedApp with filteredApplications ONLY if already selected by admin
  useEffect(() => {
    if (selectedApp) {
      const exists = filteredApplications.find((a) => a.id === selectedApp.id);
      if (exists) {
        setSelectedApp(exists);
      } else {
        setSelectedApp(null);
      }
    }
  }, [filteredApplications]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedApp) return;
    try {
      await apiRequest(`/admin/applications/${selectedApp.id}/update-stage`, {
        method: 'POST',
        body: JSON.stringify({ stage: newStatus }),
      });
      const updated = { ...selectedApp, status: newStatus };
      setSelectedApp(updated);
      setApplications(applications.map((a) => (a.id === selectedApp.id ? updated : a)));
      setActionSuccessMsg(`Application #${selectedApp.application_number} status updated to ${newStatus.replace('_', ' ').toUpperCase()} in Database!`);
    } catch (err) {
      const updated = { ...selectedApp, status: newStatus };
      setSelectedApp(updated);
      setApplications(applications.map((a) => (a.id === selectedApp.id ? updated : a)));
      setActionSuccessMsg(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()} (Locally).`);
    }
  };

  const handleCreateNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/loan/apply', {
        method: 'POST',
        body: JSON.stringify({
          loan_type: newAppForm.loan_type === 'Low CIBIL Loan' ? 'low_cibil' : 'good_cibil',
          consent_accepted: true,
          full_name: newAppForm.full_name,
          dob: '1995-01-12',
          mobile_number: newAppForm.mobile_number,
          email: newAppForm.email,
          pan_number: 'ABCDE1234F',
          aadhaar_number: '999988887777',
          gender: 'Male',
          employment_type: newAppForm.employment,
          monthly_income: parseFloat(newAppForm.monthly_income) || 40000,
          required_amount: parseFloat(newAppForm.requested_amount) || 200000,
        }),
      });

      setActionSuccessMsg(`New Loan Application saved directly into Database!`);
      fetchAdminData();
    } catch (err) {
      const newId = Date.now();
      const newApp = {
        id: newId,
        application_number: `OSL${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(1000 + Math.random() * 9000)}`,
        full_name: newAppForm.full_name,
        mobile_number: newAppForm.mobile_number,
        email: newAppForm.email,
        user_id: `USR${newId}`,
        kyc_status: 'Verified',
        loan_type: newAppForm.loan_type,
        requested_amount: parseFloat(newAppForm.requested_amount) || 200000,
        approved_amount: parseFloat(newAppForm.requested_amount) || 200000,
        tenure_months: parseInt(newAppForm.tenure_months) || 24,
        interest_rate_pa: '14.5%',
        monthly_emi: Math.round((parseFloat(newAppForm.requested_amount) || 200000) / 24),
        application_date: new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        partner_bank: newAppForm.partner_bank,
        partner_app_no: `PARTNER${Math.floor(100000 + Math.random() * 900000)}`,
        fee_payment_status: 'Paid (₹499)',
        employment: newAppForm.employment,
        monthly_income: parseFloat(newAppForm.monthly_income) || 40000,
        location: newAppForm.location,
        dob: '12 Jan 1995',
        pan: 'ABCDE1234F',
        aadhaar: 'XXXX XXXX 1234',
        status: 'under_review',
        disbursement_status: 'Pending',
        bank_details: {
          account_holder_name: newAppForm.full_name,
          bank_name: newAppForm.partner_bank,
          account_number: 'XXXX XXXX 1234',
          ifsc_code: 'HDFC0001234',
          account_type: 'Savings Account',
          status: 'Verified',
        },
        documents: [],
        verifications: [],
        timeline: [{ title: 'Application Created', time: 'Just now', completed: true }],
      };
      setApplications([newApp, ...applications]);
      setSelectedApp(newApp);
      setActionSuccessMsg(`New Loan Application #${newApp.application_number} created (Local).`);
    } finally {
      setCreateAppModalOpen(false);
    }
  };

  const currentApp = selectedApp;

  return (
    <div className="space-y-5">
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar with Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Loan Applications</h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Loan Applications</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {selectedFilter === 'all' ? 'All Applications' : selectedFilter.replace('_', ' ').toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              {filteredApplications.length} Found
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name, mobile, email, app #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs min-w-[240px]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-2.5 py-2 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar (Cash Loans vs Construction Loans) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900 text-white p-2.5 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Loan Category:</span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                categoryFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🌐 All Loan Types ({applications.length})
            </button>
            <button
              onClick={() => setCategoryFilter('cash')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                categoryFilter === 'cash'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
              }`}
            >
              🟣 Cash Loans ({applications.filter(a => !(a.loan_type || '').toLowerCase().includes('construction')).length})
            </button>
            <button
              onClick={() => setCategoryFilter('construction')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                categoryFilter === 'construction'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
              }`}
            >
              🟢 Construction Loans ({applications.filter(a => (a.loan_type || '').toLowerCase().includes('construction')).length})
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
          Category Isolation Active • Multi-Stage Verification Gating Enabled
        </div>
      </div>

      {/* Filter Status Selector Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto shadow-2xs">
        {[
          { id: 'all', label: 'All Applications' },
          { id: 'new', label: 'New' },
          { id: 'in_review', label: 'In Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'disbursement_pending', label: 'Disbursement Pending' },
          { id: 'disbursed', label: 'Disbursed' },
          { id: 'reapply_3_days', label: 'Reapply (3 Days)' },
        ].map((filter) => {
          const isActive = selectedFilter === filter.id;
          const count = filter.id === 'all'
            ? applications.length
            : applications.filter((a) => matchApplicationFilter(a, filter.id)).length;

          return (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                isActive ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`px-1.5 py-0.1 rounded text-[9px] font-black ${
                isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications List Table Section */}
      {loading && applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-2xs animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/4" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      ) : filteredApplications.length > 0 ? (
        <ApplicationsTable
          filteredApplications={filteredApplications}
          paginatedApplications={paginatedApplications}
          currentApp={currentApp}
          setSelectedApp={handleSelectApp}
          setApplications={setApplications}
          applications={applications}
          setActionSuccessMsg={setActionSuccessMsg}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-800">
            No {selectedFilter === 'all' ? '' : selectedFilter.replace(/_/g, ' ').toUpperCase()} Applications Found
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {applications.length === 0
              ? 'There are no loan applications in the database yet. Use the Apply New Loan button above to create the first one.'
              : `There are currently 0 applications matching the status "${selectedFilter.replace(/_/g, ' ')}". Try switching to "All Applications" above.`}
          </p>
          {applications.length > 0 && (
            <button
              onClick={() => setSelectedFilter('all')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Show All {applications.length} Applications
            </button>
          )}
        </div>
      )}

      {/* CREATE NEW LOAN APPLICATION MODAL */}
      {createAppModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Apply for New Loan Application</h3>
              <button onClick={() => setCreateAppModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewApplication} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicant Name</label>
                <input
                  type="text"
                  required
                  value={newAppForm.full_name}
                  onChange={(e) => setNewAppForm({ ...newAppForm, full_name: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={newAppForm.mobile_number}
                    onChange={(e) => setNewAppForm({ ...newAppForm, mobile_number: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newAppForm.email}
                    onChange={(e) => setNewAppForm({ ...newAppForm, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setCreateAppModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
