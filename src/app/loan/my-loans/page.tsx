'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import { apiRequest } from '@/lib/api';
import {
  PlusCircle,
  Menu,
  Bell,
  Zap,
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';
import { getUserMobileQuery } from '@/lib/loan-resume';

export default function MyLoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = () => {
    setLoading(true);
    const mobileQuery = getUserMobileQuery();
    apiRequest(`/loan/applications${mobileQuery}`)
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setLoans(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const formattedAmount = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getLoanCategoryMeta = (item: any) => {
    const type = (item.loan_type || '').toLowerCase();
    const appNo = (item.application_number || item.application_no || '').toUpperCase();

    if (type.includes('elite') || appNo.startsWith('ECL')) {
      return {
        title: 'Elite Personal Cash Loan',
        category: 'Fast-Track Express (3 Days)',
        partner: item.selected_partner_name || item.bank_name || 'OpenScore Express Direct',
        icon: Zap,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        badge: '⚡ Elite Cash Loan',
      };
    }

    if (type.includes('urgent') || appNo.startsWith('UCL')) {
      return {
        title: 'Urgent Construction Loan',
        category: 'Express Property & Build Credit',
        partner: item.selected_partner_name || item.bank_name || 'OpenScore Infrastructure NBFC',
        icon: Building2,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        badge: '🏗️ Urgent Construction',
      };
    }

    if (type.includes('construction')) {
      return {
        title: 'Construction Loan',
        category: 'Site Development & Building',
        partner: item.selected_partner_name || item.lender_name || 'Partner Bank Infrastructure',
        icon: Building2,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        badge: '🏗️ Construction Loan',
      };
    }

    if (type.includes('virtual') || appNo.startsWith('OSV') || appNo.startsWith('VLTX')) {
      return {
        title: 'Virtual Card Loan',
        category: 'Instant Digital Credit Card',
        partner: item.selected_partner_name || 'OpenScore Digital Wallet',
        icon: CreditCard,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        badge: '💳 Virtual Loan',
      };
    }

    return {
      title: item.selected_partner_name || item.lender_name || 'Personal Loan',
      category: item.loan_type === 'low_cibil' ? 'Low CIBIL Loan' : 'Good CIBIL Loan',
      partner: item.selected_partner_name || item.lender_name || 'Partner Bank',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: item.loan_type === 'low_cibil' ? 'Low CIBIL Loan' : 'Good CIBIL Loan',
    };
  };

  const getStatusMeta = (item: any) => {
    const rawStatus = (item.status || '').toLowerCase();
    const finalDecision = (item.final_decision || '').toUpperCase();

    if (finalDecision === 'APPROVED' || rawStatus === 'approved') {
      return { label: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (rawStatus === 'disbursed' || item.disbursement_status === 'credited') {
      return { label: 'Disbursed ✓', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (finalDecision === 'REJECTED' || rawStatus === 'rejected') {
      return { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    if (rawStatus === 'fee_payment_pending') {
      return { label: 'Processing Fee Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (rawStatus === 'fee_submitted_pending_verification' || rawStatus === 'fee_paid') {
      return { label: 'Fee Verification Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (rawStatus === 'documents_pending') {
      return { label: 'Documents Pending', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    if (rawStatus === 'documents_submitted' || rawStatus === 'under_review' || rawStatus === 'proof_pending' || rawStatus === 'proof_submitted') {
      return { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (rawStatus === 'indicative_approved' || rawStatus === 'pre_approved') {
      return { label: 'Pre-Approved', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }

    return { label: item.status?.replace(/_/g, ' ') || 'In Process', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  };

  const filteredLoans = loans.filter((item: any) => {
    const isApproved = item.final_decision === 'APPROVED' || item.status === 'approved' || item.status === 'disbursed';
    const isRejected = item.final_decision === 'REJECTED' || item.status === 'Rejected' || item.status === 'rejected';

    const meta = getLoanCategoryMeta(item);
    const matchesSearch = !debouncedSearchQuery || (
      item.application_number?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      meta.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      meta.partner.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.full_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    if (!matchesSearch) return false;
    if (activeTab === 'progress') return !isApproved && !isRejected;
    if (activeTab === 'approved') return isApproved;
    if (activeTab === 'rejected') return isRejected;
    return true;
  });

  const inProgressCount = loans.filter(
    (i: any) => i.final_decision !== 'APPROVED' && i.final_decision !== 'REJECTED' && i.status !== 'approved' && i.status !== 'Rejected' && i.status !== 'rejected'
  ).length;
  const approvedCount = loans.filter(
    (i: any) => i.final_decision === 'APPROVED' || i.status === 'approved' || i.status === 'disbursed'
  ).length;
  const rejectedCount = loans.filter(
    (i: any) => i.final_decision === 'REJECTED' || i.status === 'Rejected' || i.status === 'rejected'
  ).length;

  const handleSelectApp = (app: any) => {
    const type = (app.loan_type || '').toLowerCase();
    const appNo = (app.application_number || app.application_no || '').toUpperCase();

    if (type.includes('elite') || appNo.startsWith('ECL')) {
      if (app.status === 'fee_payment_pending') {
        router.push(`/loan/apply/cash-loan/elite/payment?app_id=${app.id}`);
        return;
      }
      router.push(`/loan/apply/cash-loan/elite/status?id=${app.id}`);
      return;
    }

    if (type.includes('urgent') || appNo.startsWith('UCL')) {
      if (app.status === 'fee_payment_pending') {
        router.push(`/loan/apply/construction-loan/urgent/payment?app_id=${app.id}`);
        return;
      }
      router.push(`/loan/apply/construction-loan/urgent/status?id=${app.id}`);
      return;
    }

    if (type.includes('virtual') || appNo.startsWith('OSV')) {
      router.push(`/loan/virtual-loan/dashboard`);
      return;
    }

    if (app.final_decision === 'REJECTED' || app.status === 'Rejected' || app.status === 'rejected') {
      router.push(`/loan/my-loans/rejected?id=${app.id}`);
    } else if (app.final_decision === 'APPROVED' || app.status === 'approved') {
      router.push(`/loan/my-loans/approved?id=${app.id}`);
    } else if (app.status === 'under_review' || app.status === 'proof_submitted') {
      router.push(`/loan/my-loans/processing?id=${app.id}`);
    } else {
      router.push(`/loan/my-loans/details?id=${app.id}`);
    }
  };

  return (
    <MobileContainer>
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-100 sticky top-0 z-40 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} className="p-1 text-slate-700">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center text-white font-black text-xs">
            OS
          </div>
          <span className="text-lg font-black text-purple-700">OpenScore</span>
        </div>

        <button onClick={() => router.push('/dashboard')} className="p-1 text-slate-700 relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Applications List View */}
      <div className="p-4 space-y-4 pb-36 flex-1 overflow-y-auto">
        <div>
          <h1 className="text-lg font-black text-slate-900">My Loan Applications</h1>
          <p className="text-xs text-slate-500">Track all your loan applications in one place</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by app #, scheme or lender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>

        {/* Filter Tabs (All / In Review / Approved / Rejected) */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px] font-bold text-center">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            All ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'progress' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            In Review ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'rejected' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Loan Applications Cards List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400 space-y-2">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading loan applications...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">No Loan Applications Found</h3>
                <p className="text-xs text-slate-500 mt-0.5">You have no active loan applications under this tab.</p>
              </div>
              <Link
                href="/loan/apply"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Apply for New Loan
              </Link>
            </div>
          ) : (
            filteredLoans.map((item: any) => {
              const meta = getLoanCategoryMeta(item);
              const statusMeta = getStatusMeta(item);
              const IconComp = meta.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectApp(item)}
                  className="cursor-pointer bg-white border border-slate-200 hover:border-purple-300 rounded-3xl p-4 shadow-xs transition-all space-y-3 relative group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${meta.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                          {meta.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {meta.partner}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 shrink-0">
                      {meta.badge}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl space-y-2 text-xs border border-slate-100">
                    {/* Row 1: App No + Amount (all types) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Application No.</span>
                        <span className="font-mono font-black text-slate-900 text-[11px]">
                          {item.application_number || item.application_no || `OSL-${item.id}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {(() => {
                            const t = (item.loan_type || '').toLowerCase();
                            const n = (item.application_number || '').toUpperCase();
                            if (t.includes('virtual') || n.startsWith('OSV') || n.startsWith('VLTX')) return 'Credit Limit';
                            return 'Applied Amount';
                          })()}
                        </span>
                        <span className="font-black text-slate-900 text-xs">
                          {formattedAmount(item.required_amount || item.applied_amount || item.selected_amount || item.amount || 100000)}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Type-specific extras */}
                    {(() => {
                      const t = (item.loan_type || '').toLowerCase();
                      const n = (item.application_number || '').toUpperCase();

                      // Elite Cash Loan → show processing fee
                      if (t.includes('elite') || n.startsWith('ECL')) {
                        return (
                          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/70">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Processing Fee</span>
                              <span className="font-black text-purple-700 text-xs">
                                {formattedAmount(item.processing_fee || item.fee_amount || 999)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Loan Tenure</span>
                              <span className="font-black text-slate-900 text-xs">
                                {item.loan_tenure ? `${item.loan_tenure} Months` : '—'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Urgent / Construction Loan → show purpose & partner
                      if (t.includes('urgent') || t.includes('construction') || n.startsWith('UCL')) {
                        return (
                          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/70">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Processing Fee</span>
                              <span className="font-black text-amber-700 text-xs">
                                {formattedAmount(item.processing_fee || item.fee_amount || 1499)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Loan Tenure</span>
                              <span className="font-black text-slate-900 text-xs">
                                {item.loan_tenure ? `${item.loan_tenure} Months` : '—'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Virtual Loan → show card type and activation
                      if (t.includes('virtual') || n.startsWith('OSV') || n.startsWith('VLTX')) {
                        return (
                          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/70">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Card Type</span>
                              <span className="font-black text-blue-700 text-xs">
                                {item.card_type || item.virtual_card_type || 'Virtual Credit'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-semibold">Activation Fee</span>
                              <span className="font-black text-slate-900 text-xs">
                                {formattedAmount(item.processing_fee || item.fee_amount || 299)}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Row 3: Status always at bottom */}
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/70">
                      <span className="text-slate-500 text-[11px] font-bold">Status:</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-700 font-bold pt-0.5">
                    <span>View Application &amp; Track Status</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Apply New Loan Button */}
        <Link
          href="/loan/apply"
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all block text-center"
        >
          <PlusCircle className="w-4 h-4" /> Apply for New Loan
        </Link>
      </div>
    </MobileContainer>
  );
}
