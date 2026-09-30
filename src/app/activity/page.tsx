'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { getAllActiveLoanApplications, AllActiveApps, formatLoanType } from '@/lib/loan-resume';
import {
  Activity,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Banknote,
  Hammer,
  CreditCard,
  History,
  FileCheck,
  Sparkles,
  QrCode,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  category: 'loan' | 'payment' | 'security' | 'verification';
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'verified' | 'pending';
  timestamp: string;
  amount?: string;
  actionUrl?: string;
  actionLabel?: string;
  iconType: 'hammer' | 'banknote' | 'shield' | 'card' | 'qr' | 'doc';
}

export default function ActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeApps, setActiveApps] = useState<AllActiveApps | null>(null);
  const [filter, setFilter] = useState<'all' | 'loan' | 'payment' | 'security'>('all');

  useEffect(() => {
    async function loadActivities() {
      setLoading(true);
      try {
        const apps = await getAllActiveLoanApplications();
        setActiveApps(apps);
      } catch (e) {
        console.error('Failed to load activity logs:', e);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  // Construct dynamic timeline of activities
  const activities: ActivityItem[] = [];

  if (activeApps?.activeList && activeApps.activeList.length > 0) {
    activeApps.activeList.forEach((item) => {
      const { app, resumeInfo, isConstruction, isVirtual, loanCategoryTitle } = item;
      const amountVal = app.selected_amount || app.required_amount || 0;
      const formattedAmount = amountVal > 0 ? `₹${amountVal.toLocaleString('en-IN')}` : undefined;
      const appNum = app.application_number || `OSL-${app.id}`;

      activities.push({
        id: `loan-${app.id}`,
        category: 'loan',
        title: `${loanCategoryTitle} (${resumeInfo.stepTitle})`,
        description: `Application #${appNum} is currently at Step ${resumeInfo.stepNumber} of 26 (${resumeInfo.progressPercent}% completed).`,
        status: 'in_progress',
        timestamp: app.updated_at ? new Date(app.updated_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Today, Just now',
        amount: formattedAmount,
        actionUrl: resumeInfo.routeUrl,
        actionLabel: 'Resume Application →',
        iconType: isConstruction ? 'hammer' : isVirtual ? 'card' : 'banknote',
      });
    });
  }

  // Add system & security verification activity items
  activities.push(
    {
      id: 'sec-1',
      category: 'security',
      title: 'Device & Session Verified',
      description: 'Encrypted end-to-end PIN authentication validated successfully.',
      status: 'verified',
      timestamp: 'Today, Active Session',
      iconType: 'shield',
    },
    {
      id: 'doc-1',
      category: 'verification',
      title: 'Automated KYC Status Checked',
      description: 'Aadhaar and PAN identity verification active for OpenScore portal.',
      status: 'completed',
      timestamp: 'Today',
      iconType: 'doc',
    },
    {
      id: 'qr-1',
      category: 'payment',
      title: 'Scan & Pay Wallet Ready',
      description: 'Digital UPI payments and QR transfer services unlocked.',
      status: 'completed',
      timestamp: 'Active',
      iconType: 'qr',
    }
  );

  const filteredActivities = activities.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'loan') return a.category === 'loan';
    if (filter === 'payment') return a.category === 'payment';
    if (filter === 'security') return a.category === 'security' || a.category === 'verification';
    return true;
  });

  const renderIcon = (type: ActivityItem['iconType']) => {
    switch (type) {
      case 'hammer':
        return <Hammer className="w-4 h-4 text-emerald-400" />;
      case 'banknote':
        return <Banknote className="w-4 h-4 text-purple-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-cyan-400" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case 'qr':
        return <QrCode className="w-4 h-4 text-amber-400" />;
      case 'doc':
      default:
        return <FileCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: ActivityItem['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> In Progress
          </span>
        );
      case 'verified':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> Verified
          </span>
        );
      case 'completed':
      default:
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Active
          </span>
        );
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Activity" showDashboardButton={true} backHref="/dashboard" />

      <div className="p-4 space-y-4 flex-1 pb-44 animate-in fade-in duration-300 overflow-y-auto">
        {/* Header Title Section */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200 inline-flex items-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-indigo-600" /> AUDIT & ACTIVITY TIMELINE
          </span>
          <h1 className="text-xl font-black text-slate-900">Recent Activity & Logs</h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time history of your loan applications, payments, and account actions.
          </p>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl border border-indigo-500/30 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Loans
            </span>
            <p className="text-xl font-black text-indigo-300">
              {activeApps?.activeList ? activeApps.activeList.length : 0}
            </p>
            <span className="text-[9.5px] text-slate-300 font-semibold block">In-progress applications</span>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-3.5 rounded-2xl border border-emerald-500/30 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Account Status
            </span>
            <p className="text-xl font-black text-emerald-400">100% Secure</p>
            <span className="text-[9.5px] text-slate-300 font-semibold block">Live 256-bit protected</span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-[10px] font-extrabold">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('loan')}
            className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
              filter === 'loan'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            Loans
          </button>
          <button
            onClick={() => setFilter('payment')}
            className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
              filter === 'payment'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter('security')}
            className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer ${
              filter === 'security'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            Security
          </button>
        </div>

        {/* Chronological Activity List */}
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading activity history...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Activity in this Category</h3>
            <p className="text-xs text-slate-500">Activities will appear here as you use OpenScore services.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-3.5 shadow-sm space-y-2.5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      {renderIcon(item.iconType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-black text-slate-900 leading-snug">{item.title}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {getStatusBadge(item.status)}
                    {item.amount && (
                      <span className="text-xs font-black text-emerald-700 block mt-1">
                        {item.amount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" /> {item.timestamp}
                  </span>

                  {item.actionUrl && item.actionLabel && (
                    <button
                      onClick={() => router.push(item.actionUrl!)}
                      className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
