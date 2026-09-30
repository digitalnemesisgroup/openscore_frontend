'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
  AlertCircle,
  ArrowRight,
  Zap,
  RefreshCw,
  IndianRupee,
} from 'lucide-react';

export default function TrackLoanStatusPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter your Application Number or Mobile Number.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiRequest(`/loan/track?query=${encodeURIComponent(query.trim())}`);
      if (res && res.data) {
        setResult(res);
      } else {
        setError('No loan application found with this reference number.');
      }
    } catch (err: any) {
      setError(err.message || 'No loan application found matching this reference.');
    } finally {
      setLoading(false);
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
    const s = map[stage] || { label: stage || 'Processing', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${s.color}`}>
        {s.label}
      </span>
    );
  };

  return (
    <MobileContainer>
      <LoanHeader title="Track Loan Status" stepNumber={1} backHref="/dashboard" />

      <div className="p-4 space-y-5 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/30 space-y-2 relative overflow-hidden text-center">
          <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-300">
            <Search className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-white">Track Application Status</h1>
          <p className="text-xs text-indigo-200 max-w-xs mx-auto">
            Enter your unique Application Reference Number (e.g. UCL..., ECL...) or registered mobile number to check real-time loan progress.
          </p>
        </div>

        {/* Search Input Card */}
        <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block">
              Application ID / Mobile Number *
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. UCL202609302907 or 9876543210"
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:bg-slate-200 disabled:text-slate-400"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching Application...</span>
              </>
            ) : (
              <>
                <span>Track Loan Status</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-bold flex items-center gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Result Card */}
        {result && result.data && (
          <div className="bg-white border-2 border-indigo-300 rounded-3xl p-4.5 shadow-lg space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                {result.data.loan_type === 'elite_cash_loan' ? (
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-[10px] font-black uppercase">
                    ⚡ Elite Cash Loan
                  </span>
                ) : result.data.loan_type === 'urgent_construction_loan' ? (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black uppercase">
                    🏗️ Urgent Construction
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-[10px] font-black uppercase">
                    Personal Loan
                  </span>
                )}
              </div>
              {getStageBadge(result.data.urgent_stage || result.data.status)}
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 block">
                Application Number
              </span>
              <h3 className="font-mono text-base font-black text-slate-900">
                #{result.data.application_number || result.data.application_no || result.data.id}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Applicant</span>
                <span className="font-bold text-slate-900 block truncate">{result.data.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Loan Amount</span>
                <span className="font-mono font-black text-slate-900">
                  ₹{Number(result.data.required_amount || result.data.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Applied On</span>
                <span className="text-slate-700 font-medium">
                  {result.data.created_at ? new Date(result.data.created_at).toLocaleDateString('en-IN') : 'Recent'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Payment UTR</span>
                <span className="font-mono text-emerald-700 font-bold block truncate">
                  {result.data.transaction_id || 'Fee Submitted'}
                </span>
              </div>
            </div>

            {/* Direct Tracker Link Button */}
            <button
              type="button"
              onClick={() => router.push(result.tracker_url)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <span>View Full Live Status Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </MobileContainer>
  );
}
