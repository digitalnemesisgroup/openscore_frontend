'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useThrottleCallback } from '@/hooks/useThrottle';
import PaginationControls from '@/components/admin/PaginationControls';
import {
  Settings,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Mail,
  ShieldCheck,
  Bell,
  Search,
  Check,
  Copy,
  Loader2,
  QrCode,
  IndianRupee,
  CreditCard,
  Percent,
  Sparkles,
  Calculator,
} from 'lucide-react';


export default function AdminSettingsPage() {
  const [smtpPool, setSmtpPool] = useState<any[]>([]);
  const [stats, setStats] = useState({ otpActive: 0, generalActive: 0, totalDispatches: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  // Filters & Search State
  const [poolFilter, setPoolFilter] = useState<'all' | 'otp' | 'general'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [newAccountForm, setNewAccountForm] = useState({
    email: '',
    purpose: 'otp',
    password: 'Password@&2026',
  });

  // Cooldown Policy State
  const [cooldownDays, setCooldownDays] = useState<number>(3);
  const [savingCooldown, setSavingCooldown] = useState<boolean>(false);

  // Voice Call & Demo OTP Settings State
  const [voiceCallOtpEnabled, setVoiceCallOtpEnabled] = useState<boolean>(true);
  const [defaultOtpEnabled, setDefaultOtpEnabled] = useState<boolean>(true);
  const [savingOtpSettings, setSavingOtpSettings] = useState<boolean>(false);

  // Processing Fee & UPI Gateway Settings State
  const [feeConfig, setFeeConfig] = useState({
    upi_id: 'flipflops@upi',
    upi_payee_name: 'OpenScore Finance',
    // Cash Loan / Elite Loan Itemized Breakdown
    cash_loan_login_fee: 500,
    cash_loan_doc_fee: 200,
    cash_loan_verification_fee: 299,
    // Cash Loan - 3 Tiers
    cash_loan_without_cibil_fee_type: 'fixed',
    cash_loan_without_cibil_fee_value: 999,
    cash_loan_low_cibil_fee_type: 'fixed',
    cash_loan_low_cibil_fee_value: 999,
    cash_loan_high_cibil_fee_type: 'fixed',
    cash_loan_high_cibil_fee_value: 499,
    // Construction Loan / Urgent Construction Itemized Breakdown
    construction_loan_login_fee: 500,
    construction_loan_doc_fee: 300,
    construction_loan_site_verification_fee: 699,
    // Construction Loan - 3 Tiers
    construction_loan_without_cibil_fee_type: 'fixed',
    construction_loan_without_cibil_fee_value: 1499,
    construction_loan_low_cibil_fee_type: 'fixed',
    construction_loan_low_cibil_fee_value: 1499,
    construction_loan_high_cibil_fee_type: 'fixed',
    construction_loan_high_cibil_fee_value: 499,
    // Virtual Card / Loan / Voucher - Single Fee
    virtual_loan_fee_type: 'fixed',
    virtual_loan_fee_value: 299,
  });
  const [savingFeeConfig, setSavingFeeConfig] = useState<boolean>(false);

  // Sync URL search params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qPage = params.get('page');
      const qPerPage = params.get('per_page');
      const qSearch = params.get('search');
      const qPool = params.get('pool');

      if (qPage) setCurrentPage(Number(qPage));
      if (qPerPage) setItemsPerPage(Number(qPerPage));
      if (qSearch) setSearchTerm(qSearch);
      if (qPool && (qPool === 'all' || qPool === 'otp' || qPool === 'general')) setPoolFilter(qPool as any);
    }
  }, []);

  const fetchCooldownSettings = async () => {
    try {
      const res = await apiRequest('/admin/settings/cooldown');
      if (res && res.data && typeof res.data.reapplication_cooldown_days === 'number') {
        setCooldownDays(res.data.reapplication_cooldown_days);
      }
    } catch (err) {}
  };

  const fetchOtpSettings = async () => {
    try {
      const res = await apiRequest('/admin/settings/otp');
      if (res && res.data) {
        setVoiceCallOtpEnabled(!!res.data.voice_call_otp_enabled);
        setDefaultOtpEnabled(!!res.data.default_otp_enabled);
      }
    } catch (err) {}
  };

  const fetchFeeConfig = async () => {
    try {
      const res = await apiRequest('/admin/settings/fee-config');
      if (res && res.data) {
        setFeeConfig({
          upi_id: res.data.upi_id || 'flipflops@upi',
          upi_payee_name: res.data.upi_payee_name || 'OpenScore Finance',
          // Cash Loan Itemized
          cash_loan_login_fee: Number(res.data.cash_loan_login_fee ?? 500),
          cash_loan_doc_fee: Number(res.data.cash_loan_doc_fee ?? 200),
          cash_loan_verification_fee: Number(res.data.cash_loan_verification_fee ?? 299),
          // Cash Loan Tiers
          cash_loan_without_cibil_fee_type: res.data.cash_loan_without_cibil_fee_type || res.data.cash_loan_fee_type || 'fixed',
          cash_loan_without_cibil_fee_value: Number(res.data.cash_loan_without_cibil_fee_value ?? res.data.cash_loan_fee_value ?? 999),
          cash_loan_low_cibil_fee_type: res.data.cash_loan_low_cibil_fee_type || res.data.cash_loan_fee_type || 'fixed',
          cash_loan_low_cibil_fee_value: Number(res.data.cash_loan_low_cibil_fee_value ?? 999),
          cash_loan_high_cibil_fee_type: res.data.cash_loan_high_cibil_fee_type || res.data.cash_loan_fee_type || 'fixed',
          cash_loan_high_cibil_fee_value: Number(res.data.cash_loan_high_cibil_fee_value ?? res.data.cash_loan_good_cibil_fee_value ?? 499),
          // Construction Loan Itemized
          construction_loan_login_fee: Number(res.data.construction_loan_login_fee ?? 500),
          construction_loan_doc_fee: Number(res.data.construction_loan_doc_fee ?? 300),
          construction_loan_site_verification_fee: Number(res.data.construction_loan_site_verification_fee ?? 699),
          // Construction Loan Tiers
          construction_loan_without_cibil_fee_type: res.data.construction_loan_without_cibil_fee_type || res.data.construction_loan_fee_type || 'fixed',
          construction_loan_without_cibil_fee_value: Number(res.data.construction_loan_without_cibil_fee_value ?? res.data.construction_loan_fee_value ?? 1499),
          construction_loan_low_cibil_fee_type: res.data.construction_loan_low_cibil_fee_type || res.data.construction_loan_fee_type || 'fixed',
          construction_loan_low_cibil_fee_value: Number(res.data.construction_loan_low_cibil_fee_value ?? 1499),
          construction_loan_high_cibil_fee_type: res.data.construction_loan_high_cibil_fee_type || res.data.construction_loan_fee_type || 'fixed',
          construction_loan_high_cibil_fee_value: Number(res.data.construction_loan_high_cibil_fee_value ?? 499),
          // Virtual Loan
          virtual_loan_fee_type: res.data.virtual_loan_fee_type || 'fixed',
          virtual_loan_fee_value: Number(res.data.virtual_loan_fee_value ?? 299),
        });
      }
    } catch (err) {}
  };

  const handleSaveFeeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFeeConfig(true);
    try {
      const res = await apiRequest('/admin/settings/fee-config', {
        method: 'POST',
        body: JSON.stringify(feeConfig),
      });
      if (res && res.data) {
        setFeeConfig((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
      setMsg('Processing Fee & Official UPI Gateway configuration updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update Fee & UPI settings.');
    } finally {
      setSavingFeeConfig(false);
    }
  };

  const handleSaveOtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOtpSettings(true);
    try {
      const res = await apiRequest('/admin/settings/otp', {
        method: 'POST',
        body: JSON.stringify({
          voice_call_otp_enabled: voiceCallOtpEnabled,
          default_otp_enabled: defaultOtpEnabled,
        }),
      });
      if (res && res.message) {
        setMsg(res.message);
      } else {
        setMsg('Voice Call & Demo OTP settings saved successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update OTP settings.');
    } finally {
      setSavingOtpSettings(false);
    }
  };

  const handleSaveCooldown = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCooldown(true);
    try {
      const res = await apiRequest('/admin/settings/cooldown', {
        method: 'POST',
        body: JSON.stringify({ reapplication_cooldown_days: Number(cooldownDays) }),
      });
      if (res && res.message) {
        setMsg(res.message);
      } else {
        setMsg(`Re-application cooldown updated to ${cooldownDays} days successfully.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update cooldown settings.');
    } finally {
      setSavingCooldown(false);
    }
  };

  const fetchSmtp = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/smtp-pool');
      if (res && res.data) {
        setSmtpPool(res.data);
        setStats({
          otpActive: res.otp_active_count || 0,
          generalActive: res.general_active_count || 0,
          totalDispatches: res.total_dispatches || 0,
        });
      }
    } catch (err) {
      setSmtpPool([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmtp();
    fetchCooldownSettings();
    fetchOtpSettings();
    fetchFeeConfig();
  }, []);


  const handleAddSmtpThrottled = useThrottleCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.email.trim()) return;
    setSubmitting(true);

    try {
      await apiRequest('/admin/smtp-pool/add', {
        method: 'POST',
        body: JSON.stringify({
          email: newAccountForm.email.trim().toLowerCase(),
          password: newAccountForm.password.trim() || 'Password@&2026',
          purpose: newAccountForm.purpose,
        }),
      });
      setMsg(`Hostinger SMTP email "${newAccountForm.email.trim()}" added to [${newAccountForm.purpose.toUpperCase()}] pool!`);
      setNewAccountForm({ email: '', purpose: 'otp', password: 'Password@&2026' });
      setAddModalOpen(false);
      fetchSmtp();
    } catch (err: any) {
      setMsg(err.message || 'Failed to add Hostinger email account.');
    } finally {
      setSubmitting(false);
    }
  }, 1000);

  const handleToggleAccountThrottled = useThrottleCallback(async (id: number) => {
    try {
      const res = await apiRequest(`/admin/smtp-pool/${id}/toggle`, { method: 'POST' });
      if (res && res.message) setMsg(res.message);
      fetchSmtp();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle account status.');
    }
  }, 800);

  const handleDeleteAccountThrottled = useThrottleCallback(async (id: number, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email} from the Hostinger SMTP pool?`)) return;
    try {
      await apiRequest(`/admin/smtp-pool/${id}`, { method: 'DELETE' });
      setMsg(`Hostinger SMTP email ${email} removed from pool.`);
      fetchSmtp();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
    }
  }, 1000);

  // Filtered Accounts
  const filteredPool = React.useMemo(() => {
    return smtpPool.filter((acc) => {
      // 1. Pool Category Filter
      if (poolFilter !== 'all' && acc.purpose !== poolFilter) return false;

      // 2. Search Term Filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase().trim();
        return acc.email.toLowerCase().includes(q) || (acc.purpose || '').toLowerCase().includes(q);
      }

      return true;
    });
  }, [smtpPool, poolFilter, debouncedSearch]);

  // Paginated Slice
  const paginatedPool = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPool.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPool, currentPage, itemsPerPage]);

  const otpCount = smtpPool.filter((a) => a.purpose === 'otp').length;
  const generalCount = smtpPool.filter((a) => a.purpose === 'general').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {msg}
          </span>
          <button onClick={() => setMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main Counter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Hostinger Multi-SMTP Email Pool Management</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
              {smtpPool.length} Accounts Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Round-robin Hostinger SMTP email dispatchers separated into EMAIL OTP VERIFY pool & General Alerts / Auto Mail pool.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Mail ID (Incr)</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-4 rounded-2xl space-y-1 shadow-xs border border-indigo-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-300" /> EMAIL OTP VERIFY POOL</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{otpCount} Accounts</span>
          </div>
          <p className="text-2xl font-black">{stats.otpActive} Active</p>
          <p className="text-[10px] text-indigo-200">Used strictly for email registration & passwordless OTP verification</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl space-y-1 shadow-xs border border-slate-700">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1"><Bell className="w-3.5 h-3.5 text-amber-400" /> GENERAL ALERTS & AUTO MAIL POOL</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{generalCount} Accounts</span>
          </div>
          <p className="text-2xl font-black">{stats.generalActive} Active</p>
          <p className="text-[10px] text-slate-400">Used for system alerts, loan approvals & automated borrower notifications</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Dispatched Emails
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalDispatches.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 font-medium">Round-robin Hostinger mailer load balanced</p>
        </div>
      </div>

      {/* RE-APPLICATION COOLDOWN POLICY CONFIGURATION */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                System Policy
              </span>
              <h3 className="text-base font-black text-slate-900">Re-application Cooldown Period Window</h3>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Configure how many days a applicant must wait after a loan rejection or disbursement before they are permitted to re-apply.
            </p>
          </div>

          <form onSubmit={handleSaveCooldown} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
              <input
                type="number"
                min="0"
                max="365"
                value={cooldownDays}
                onChange={(e) => setCooldownDays(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 font-mono font-black text-sm text-slate-900 text-center focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-500">Days</span>
            </div>

            <button
              type="submit"
              disabled={savingCooldown}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              {savingCooldown ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Policy</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 pt-1 border-t border-amber-500/20">
          <span className="text-amber-800 font-bold">Quick Presets:</span>
          {[1, 3, 5, 7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setCooldownDays(d)}
              className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold transition-all ${
                cooldownDays === d
                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
              }`}
            >
              {d} Day{d > 1 ? 's' : ''} {d === 3 ? '(Default)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* VOICE CALL OTP & DEMO OTP 1234 CONFIGURATION */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-slate-900/5 border border-purple-500/30 rounded-2xl p-5 space-y-4 shadow-xs">
        <form onSubmit={handleSaveOtpSettings} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  Authentication Gateway
                </span>
                <h3 className="text-base font-black text-slate-900">Voice Call OTP & Demo Fallback (1234) Controls</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Toggle external Voice Call OBD OTP dispatches and set default demo OTP 1234 behavior for instant testing or when voice calls are unavailable.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingOtpSettings}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              {savingOtpSettings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save OTP Settings</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-purple-500/20">
            {/* Voice Call OBD Toggle */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <h4 className="text-xs font-black text-slate-900">Voice Call OBD Dispatch</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When enabled, phone calls are dispatched via VoiceFortius API to deliver 6-digit OTP codes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVoiceCallOtpEnabled(!voiceCallOtpEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  voiceCallOtpEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    voiceCallOtpEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Demo Fallback OTP 1234 Toggle */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <h4 className="text-xs font-black text-slate-900">Allow Demo OTP (1234 / 123456)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Allows fallback code <strong className="font-bold">1234</strong> for quick login/registration when voice calls are off or fail.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDefaultOtpEnabled(!defaultOtpEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  defaultOtpEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    defaultOtpEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* PROCESSING FEE & OFFICIAL UPI GATEWAY CONFIGURATION */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900/5 border border-emerald-500/30 rounded-2xl p-5 space-y-5 shadow-xs">
        <form onSubmit={handleSaveFeeConfig} className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  Payment Gateway
                </span>
                <h3 className="text-base font-black text-slate-900">Processing Fee & Official UPI ID Settings</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Configure global official receiving UPI ID, Merchant Name, and set Fixed (₹) or Percentage (%) processing fees for Cash Loans, Construction Loans, and Virtual Loans.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingFeeConfig}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              {savingFeeConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Fee & UPI Gateway</span>
                </>
              )}
            </button>
          </div>

          {/* UPI ID & Merchant Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-emerald-500/20">
            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-2xs">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                Official Admin Receiving UPI ID *
              </label>
              <input
                type="text"
                required
                value={feeConfig.upi_id}
                onChange={(e) => setFeeConfig({ ...feeConfig, upi_id: e.target.value })}
                placeholder="e.g. flipflops@upi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                All applicant dynamic UPI QR codes and payment requests will be routed to this VPA.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 shadow-2xs">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Merchant / Payee Name *
              </label>
              <input
                type="text"
                required
                value={feeConfig.upi_payee_name}
                onChange={(e) => setFeeConfig({ ...feeConfig, upi_payee_name: e.target.value })}
                placeholder="e.g. OpenScore Finance"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-500 font-medium">
                Business name displayed on applicant's UPI payment apps (GPay, PhonePe, Paytm).
              </p>
            </div>
          </div>

          {/* Itemized Processing Fee Breakdown (Admin Configuration) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Itemized Processing Fee Configuration (Cash &amp; Construction Express Loans)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Auto-calculated Fee Breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cash Loan / Elite Loan Breakdown */}
              <div className="bg-white border-2 border-purple-300/80 p-4 rounded-2xl space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
                    ⚡ Cash Loan / Elite Loan Fee Breakdown
                  </span>
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full text-xs font-black">
                    <span>Total:</span>
                    <span>₹{((feeConfig.cash_loan_login_fee || 0) + (feeConfig.cash_loan_doc_fee || 0) + (feeConfig.cash_loan_verification_fee || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Login Fee */}
                  <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-purple-900">1. Login Fee (₹)</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-purple-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={feeConfig.cash_loan_login_fee}
                        onChange={(e) => setFeeConfig({ ...feeConfig, cash_loan_login_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Portal initiation fee</p>
                  </div>

                  {/* Documentation Fee */}
                  <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-purple-900">2. Document Fee (₹)</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-purple-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={feeConfig.cash_loan_doc_fee}
                        onChange={(e) => setFeeConfig({ ...feeConfig, cash_loan_doc_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">KYC &amp; data verification</p>
                  </div>

                  {/* Verification Fee */}
                  <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-purple-900">3. Verif. Fee (₹)</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-purple-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={feeConfig.cash_loan_verification_fee}
                        onChange={(e) => setFeeConfig({ ...feeConfig, cash_loan_verification_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Sanction &amp; risk check</p>
                  </div>
                </div>
              </div>

              {/* Construction Loan / Urgent Construction Breakdown */}
              <div className="bg-white border-2 border-emerald-300/80 p-4 rounded-2xl space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    🏗️ Construction Loan Fee Breakdown
                  </span>
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full text-xs font-black">
                    <span>Total:</span>
                    <span>₹{((feeConfig.construction_loan_login_fee || 0) + (feeConfig.construction_loan_doc_fee || 0) + (feeConfig.construction_loan_site_verification_fee || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Login Fee */}
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-900">1. Login Fee (₹)</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-emerald-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={feeConfig.construction_loan_login_fee}
                        onChange={(e) => setFeeConfig({ ...feeConfig, construction_loan_login_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Portal registration</p>
                  </div>

                  {/* Documentation Fee */}
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-900">2. Document Fee (₹)</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-emerald-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={feeConfig.construction_loan_doc_fee}
                        onChange={(e) => setFeeConfig({ ...feeConfig, construction_loan_doc_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Property title checks</p>
                  </div>

                  {/* Site Verification Fee */}
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-emerald-900">3. Site Verif. Fee (₹)</label>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-2xs">
                      <span className="text-xs font-bold text-emerald-700">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={feeConfig.construction_loan_site_verification_fee}
                        onChange={(e) => setFeeConfig({ ...feeConfig, construction_loan_site_verification_fee: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent font-mono font-black text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium">Technical site inspection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Calculation Structure Matrix */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Loan Processing Fee Model (Tiered: Without CIBIL, Low CIBIL &amp; High CIBIL)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Cash Loan Fee (3 Tiers) */}
              <div className="bg-white border border-purple-200 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Cash Loan (3 Tiers)
                  </span>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-extrabold px-2 py-0.5 rounded-md border border-purple-200">
                    Personal
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Tier 1: Without CIBIL */}
                  <div className="bg-purple-50/40 p-2.5 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        1. Without CIBIL Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, cash_loan_without_cibil_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.cash_loan_without_cibil_fee_type === 'fixed'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, cash_loan_without_cibil_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.cash_loan_without_cibil_fee_type === 'percentage'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-purple-700">
                        {feeConfig.cash_loan_without_cibil_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.cash_loan_without_cibil_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.cash_loan_without_cibil_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, cash_loan_without_cibil_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tier 2: Low CIBIL */}
                  <div className="bg-purple-50/40 p-2.5 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        2. Low CIBIL Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, cash_loan_low_cibil_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.cash_loan_low_cibil_fee_type === 'fixed'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, cash_loan_low_cibil_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.cash_loan_low_cibil_fee_type === 'percentage'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-purple-700">
                        {feeConfig.cash_loan_low_cibil_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.cash_loan_low_cibil_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.cash_loan_low_cibil_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, cash_loan_low_cibil_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tier 3: High CIBIL (>700) */}
                  <div className="bg-purple-50/40 p-2.5 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        3. High CIBIL (&gt;700) Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, cash_loan_high_cibil_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.cash_loan_high_cibil_fee_type === 'fixed'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, cash_loan_high_cibil_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.cash_loan_high_cibil_fee_type === 'percentage'
                              ? 'bg-purple-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-purple-700">
                        {feeConfig.cash_loan_high_cibil_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.cash_loan_high_cibil_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.cash_loan_high_cibil_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, cash_loan_high_cibil_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Construction Loan Fee (3 Tiers) */}
              <div className="bg-white border border-emerald-200 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Construction Loan (3 Tiers)
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                    Project
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Tier 1: Without CIBIL */}
                  <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        1. Without CIBIL Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, construction_loan_without_cibil_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.construction_loan_without_cibil_fee_type === 'fixed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, construction_loan_without_cibil_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.construction_loan_without_cibil_fee_type === 'percentage'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-emerald-700">
                        {feeConfig.construction_loan_without_cibil_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.construction_loan_without_cibil_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.construction_loan_without_cibil_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, construction_loan_without_cibil_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tier 2: Low CIBIL */}
                  <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        2. Low CIBIL Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, construction_loan_low_cibil_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.construction_loan_low_cibil_fee_type === 'fixed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, construction_loan_low_cibil_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.construction_loan_low_cibil_fee_type === 'percentage'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-emerald-700">
                        {feeConfig.construction_loan_low_cibil_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.construction_loan_low_cibil_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.construction_loan_low_cibil_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, construction_loan_low_cibil_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tier 3: High CIBIL (>700) */}
                  <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        3. High CIBIL (&gt;700) Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, construction_loan_high_cibil_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.construction_loan_high_cibil_fee_type === 'fixed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, construction_loan_high_cibil_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.construction_loan_high_cibil_fee_type === 'percentage'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-emerald-700">
                        {feeConfig.construction_loan_high_cibil_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.construction_loan_high_cibil_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.construction_loan_high_cibil_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, construction_loan_high_cibil_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Virtual Card / Voucher / Loan Fee (Single Fee) */}
              <div className="bg-white border border-blue-200 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                  <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Virtual Card / Loan / Voucher
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                    Single Fee
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800">
                        Activation &amp; Issuance Fee:
                      </label>
                      <div className="flex bg-white p-0.5 rounded-md border border-slate-200 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, virtual_loan_fee_type: 'fixed' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.virtual_loan_fee_type === 'fixed'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fixed (₹)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeeConfig({ ...feeConfig, virtual_loan_fee_type: 'percentage' })}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            feeConfig.virtual_loan_fee_type === 'percentage'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          % Rate
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-blue-700">
                        {feeConfig.virtual_loan_fee_type === 'percentage' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        step={feeConfig.virtual_loan_fee_type === 'percentage' ? '0.1' : '1'}
                        min="0"
                        value={feeConfig.virtual_loan_fee_value}
                        onChange={(e) =>
                          setFeeConfig({ ...feeConfig, virtual_loan_fee_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full bg-transparent font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 pt-1">
                      {feeConfig.virtual_loan_fee_type === 'percentage'
                        ? `Calculated as ${feeConfig.virtual_loan_fee_value}% of approved wallet limit.`
                        : `Flat one-time fee ₹${feeConfig.virtual_loan_fee_value} charged on card issuance.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>


      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Debounced Search Email ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 mr-1">Pool Category:</span>
          {[
            { id: 'all', label: `All Mail IDs (${smtpPool.length})` },
            { id: 'otp', label: `EMAIL OTP VERIFY (${otpCount})` },
            { id: 'general', label: `General Alerts & Auto Mail (${generalCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setPoolFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                poolFilter === tab.id ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email Pool Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs font-bold text-slate-600">Loading Hostinger SMTP mail accounts...</p>
            </div>
          ) : paginatedPool.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Mail className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-black text-slate-800">No Matching Hostinger Email Accounts Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm
                  ? `No email addresses match your query "${searchTerm}".`
                  : `No email accounts configured in pool [${poolFilter.toUpperCase()}].`}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Hostinger Email ID</th>
                  <th className="p-3.5">Purpose / Pool</th>
                  <th className="p-3.5">SMTP Host & Port</th>
                  <th className="p-3.5">Dispatches</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedPool.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 text-xs">
                      {acc.email}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        acc.purpose === 'otp'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                      }`}>
                        {acc.purpose === 'otp' ? 'EMAIL OTP VERIFY' : 'General / Auto Mail'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {acc.host || 'smtp.hostinger.com'}:{acc.port || 465} ({acc.encryption || 'SSL'})
                    </td>
                    <td className="p-3.5 font-black text-slate-900">
                      {acc.dispatch_count || 0}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleAccountThrottled(acc.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 transition-colors ${
                          acc.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600 border border-slate-300'
                        }`}
                        title="Click to toggle active status"
                      >
                        {acc.is_active ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                        <span>{acc.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteAccountThrottled(acc.id, acc.email)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs transition-colors"
                        title="Delete Hostinger Mail ID (Reduce)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* QUERY-BASED PAGINATION CONTROLS */}
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredPool.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* ADD HOSTINGER EMAIL MODAL (INCR) */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add Hostinger Mail ID (Incr)</h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSmtpThrottled} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hostinger Email ID *</label>
                <input
                  type="email"
                  required
                  value={newAccountForm.email}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, email: e.target.value })}
                  placeholder="e.g. otp31@msmeloan.sbs or alert.31@msmeloan.sbs"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pool Purpose / Category *</label>
                <select
                  value={newAccountForm.purpose}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, purpose: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="otp">EMAIL OTP VERIFY Pool</option>
                  <option value="general">General Alerts & Auto Mail Pool</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hostinger Mailbox Password *</label>
                <input
                  type="text"
                  required
                  value={newAccountForm.password}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, password: e.target.value })}
                  placeholder="Password@&2026"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-medium">
                Host: <code>smtp.hostinger.com</code> • Port: <code>465</code> (SSL)
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Adding Mail ID...' : 'Add Hostinger Mail ID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
