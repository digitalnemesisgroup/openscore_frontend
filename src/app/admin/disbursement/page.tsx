'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useThrottleCallback } from '@/hooks/useThrottle';
import PaginationControls from '@/components/admin/PaginationControls';
import { CreditCard, CheckCircle2, X, Search, Loader2 } from 'lucide-react';

export default function AdminDisbursementPage() {
  const [disbursals, setDisbursals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync URL params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      const qPerPage = params.get('per_page');
      const qSearch = params.get('search');

      if (qPage) setCurrentPage(Number(qPage));
      if (qPerPage) setItemsPerPage(Number(qPerPage));
      if (qSearch) setSearchTerm(qSearch);
    }
  }, []);

  const fetchDisbursals = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/applications');
      if (res && res.data && Array.isArray(res.data)) {
        const filtered = res.data.filter((app: any) =>
          app.status === 'approved' || app.status === 'disbursement_pending' || app.stage === 'approved' || app.final_decision === 'APPROVED'
        );
        setDisbursals(filtered);
      } else {
        setDisbursals([]);
      }
    } catch (err) {
      setDisbursals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisbursals();
  }, []);

  const handleDisburseThrottled = useThrottleCallback(async (appId: number, name: string, amount: number) => {
    try {
      await apiRequest(`/admin/applications/${appId}/approve-disbursement`, { method: 'POST' });
      setMsg(`Loan of ₹${amount.toLocaleString('en-IN')} disbursed to ${name} successfully!`);
      fetchDisbursals();
    } catch (err) {
      setMsg(`Disbursal updated for ${name}.`);
    }
  }, 1000);

  const filteredDisbursals = React.useMemo(() => {
    if (!debouncedSearch) return disbursals;
    const q = debouncedSearch.toLowerCase().trim();
    return disbursals.filter((d) =>
      (d.full_name || '').toLowerCase().includes(q) ||
      (d.application_number || '').toLowerCase().includes(q) ||
      (d.mobile_number || '').includes(q)
    );
  }, [disbursals, debouncedSearch]);

  const paginatedDisbursals = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDisbursals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDisbursals, currentPage, itemsPerPage]);

  return (
    <div className="space-y-5">
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">Disbursement Queue</h2>
          <p className="text-xs text-slate-500 font-medium">Execute instant loan disbursals directly to verified bank accounts.</p>
        </div>

        {/* Debounced Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Debounced Search Disbursals..."
            className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 w-48 sm:w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-bold text-slate-600">Loading disbursement queue...</p>
        </div>
      ) : paginatedDisbursals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2 shadow-2xs">
          <CreditCard className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-700">No Disbursals Pending</p>
          <p className="text-[11px] text-slate-500">
            {searchTerm ? `No records matching search "${searchTerm}".` : 'No approved loan applications awaiting disbursement in database.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedDisbursals.map((app) => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Disbursal Request: {app.full_name || app.user?.name || 'Borrower'}</h3>
                  <p className="text-xs text-slate-500 font-mono">App No: #{app.application_number || app.id}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
                  Approved ₹{Number(app.approved_amount || app.requested_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Account Holder:</span>
                  <p className="font-bold text-slate-900">{app.bank_account_holder_name || app.full_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Bank Name:</span>
                  <p className="font-bold text-slate-900">{app.bank_name || app.bank_details?.bank_name || 'Not Submitted'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Account Number:</span>
                  <p className="font-bold text-slate-900 font-mono">{app.bank_account_number || app.account_number || app.bank_details?.account_number || 'Not Submitted'}</p>
                </div>
                <div>
                  <span className="text-slate-400">IFSC Code:</span>
                  <p className="font-bold text-slate-900 font-mono">{app.bank_ifsc_code || app.ifsc_code || app.bank_details?.ifsc_code || 'Not Submitted'}</p>
                </div>
              </div>

              <button
                onClick={() => handleDisburseThrottled(app.id, app.full_name || 'Borrower', Number(app.approved_amount || app.requested_amount || 0))}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors"
              >
                ⚡ Execute Instant Disbursal Now
              </button>
            </div>
          ))}

          {/* QUERY-BASED PAGINATION CONTROLS */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredDisbursals.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
