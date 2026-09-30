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
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';

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
    apiRequest('/loan/applications')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setLoans(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const formattedAmount = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const displayLoans = loans;

  const filteredLoans = displayLoans.filter((item: any) => {
    const isApproved = item.final_decision === 'APPROVED' || item.status === 'approved' || item.status === 'disbursed';
    const isRejected = item.final_decision === 'REJECTED' || item.status === 'Rejected' || item.status === 'rejected';

    const matchesSearch = !debouncedSearchQuery || (
      item.application_number?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.selected_partner_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      item.full_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    if (!matchesSearch) return false;
    if (activeTab === 'progress') return !isApproved && !isRejected;
    if (activeTab === 'approved') return isApproved;
    if (activeTab === 'rejected') return isRejected;
    return true;
  });

  const inProgressCount = displayLoans.filter(
    (i: any) => i.final_decision !== 'APPROVED' && i.final_decision !== 'REJECTED' && i.status !== 'approved' && i.status !== 'Rejected' && i.status !== 'rejected'
  ).length;
  const approvedCount = displayLoans.filter(
    (i: any) => i.final_decision === 'APPROVED' || i.status === 'approved' || i.status === 'disbursed'
  ).length;
  const rejectedCount = displayLoans.filter(
    (i: any) => i.final_decision === 'REJECTED' || i.status === 'Rejected' || i.status === 'rejected'
  ).length;

  const handleSelectApp = (app: any) => {
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
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-black text-xs">
            OS
          </div>
          <span className="text-lg font-black text-blue-700">OpenScore</span>
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
            placeholder="Search by app # or bank name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Filter Tabs (All / In Review / Approved / Rejected) */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px] font-bold text-center">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            All ({displayLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'progress' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
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
          {filteredLoans.map((item: any) => (
            <div
              key={item.id}
              onClick={() => handleSelectApp(item)}
              className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-xs">
                    {item.selected_partner_name
                      ? item.selected_partner_name.charAt(0)
                      : item.lender_name
                      ? item.lender_name.charAt(0)
                      : 'H'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {item.selected_partner_name || item.lender_name || 'HDFC Bank'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {item.loan_type === 'low_cibil' ? 'Low CIBIL Loan' : 'Good CIBIL Loan'}
                    </p>
                  </div>
                </div>

                {item.is_current ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Current Application
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Past Application</span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Application No.</span>
                  <span className="font-mono font-bold text-slate-900">{item.application_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Applied Amount</span>
                  <span className="font-bold text-slate-900">
                    {formattedAmount(item.applied_amount || item.selected_amount || 200000)}
                  </span>
                </div>
                <div className="col-span-2 flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Status</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.final_decision === 'APPROVED' || item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.final_decision === 'REJECTED' || item.status === 'Rejected' || item.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.final_decision === 'APPROVED' || item.status === 'approved'
                      ? 'Approved'
                      : item.final_decision === 'REJECTED' || item.status === 'Rejected' || item.status === 'rejected'
                      ? 'Rejected'
                      : item.status === 'under_review' || item.status === 'processing'
                      ? 'Under Review'
                      : item.status || 'Under Review'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Apply New Loan Button */}
        <Link
          href="/loan/apply"
          className="w-full py-3 bg-white border border-blue-600 text-blue-600 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors block text-center"
        >
          <PlusCircle className="w-4 h-4" /> Apply for New Loan
        </Link>
      </div>
    </MobileContainer>
  );
}
