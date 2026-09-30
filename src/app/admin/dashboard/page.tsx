'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { BarChart3, Plus, RefreshCw, FileText, CheckCircle2, XCircle, CreditCard, Users, ArrowUpRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({
    total_applications: 0,
    new_applications: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    disbursement_pending: 0,
    disbursed: 0,
    reapply_3_days: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await apiRequest('/admin/stats');
      if (res && res.data) setStats((prev: any) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.warn('Backend API notice:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Dashboard Executive KPIs</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time overview of applications, approvals & revenue.</p>
        </div>
        <Link
          href="/admin/applications"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="w-4 h-4" /> Apply New Loan
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1 shadow-2xs">
          <p className="text-xs text-slate-500 font-semibold">Total Applications</p>
          <p className="text-2xl font-black text-slate-900">{stats.total_applications}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-1 shadow-2xs">
          <p className="text-xs text-blue-700 font-semibold">In Review Queue</p>
          <p className="text-2xl font-black text-blue-800">{stats.in_review}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1 shadow-2xs">
          <p className="text-xs text-emerald-700 font-semibold">Loans Approved</p>
          <p className="text-2xl font-black text-emerald-800">{stats.approved}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-1 shadow-2xs">
          <p className="text-xs text-rose-700 font-semibold">Applications Rejected</p>
          <p className="text-2xl font-black text-rose-800">{stats.rejected}</p>
        </div>
      </div>
    </div>
  );
}

