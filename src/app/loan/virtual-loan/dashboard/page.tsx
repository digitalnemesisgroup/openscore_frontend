'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import BottomNav from '@/components/BottomNav';
import ScanQrModal from '@/components/modals/ScanQrModal';
import QrPaymentModal from '@/components/modals/QrPaymentModal';
import HelpSupportModal from '@/components/modals/HelpSupportModal';
import {
  Bell,
  QrCode,
  IndianRupee,
  ChevronRight,
  FileText,
  History,
  Calendar,
  ShieldCheck,
  LifeBuoy,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function VirtualLoanDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Modals state
  const [scanQrOpen, setScanQrOpen] = useState<boolean>(false);
  const [repayModalOpen, setRepayModalOpen] = useState<boolean>(false);
  const [supportModalOpen, setSupportModalOpen] = useState<boolean>(false);
  const [activeTabModal, setActiveTabModal] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/loan/virtual-loan/dashboard');
      if (res && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      // Fallback sample data for demo preview
      setDashboardData({
        approved_amount: 30000,
        used_amount: 8500,
        available_amount: 21500,
        todays_repayment: 1000,
        next_due_date: '24 Sep 2025',
        loan_status: 'active',
        is_active: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const approvedAmt = dashboardData?.approved_amount || 30000;
  const usedAmt = dashboardData?.used_amount || 8500;
  const availAmt = dashboardData?.available_amount || 21500;
  const todaysRepayment = dashboardData?.todays_repayment || 1000;
  const nextDueDate = dashboardData?.next_due_date || '24 Sep 2025';
  const isActive = dashboardData?.is_active ?? true;

  const usedPercent = Math.min(100, Math.round((usedAmt / approvedAmt) * 100));

  return (
    <MobileContainer>
      {/* HEADER BAR (SCREEN 1 OF REFERENCE IMAGE) */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Virtual Loan</h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
              VIRTUAL LOAN
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Hello, Rahul 👋</p>
          <p className="text-[11px] text-slate-400 font-medium">Your business growth is our priority</p>
        </div>

        <button
          onClick={() => alert('Notifications: Your Virtual Loan is Active & Ready to use!')}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 relative transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 pb-36 animate-in fade-in duration-300 overflow-y-auto">
        {loading ? (
          <div className="p-8 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 animate-pulse text-slate-600 font-bold text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading Virtual Loan Dashboard...</span>
          </div>
        ) : (
          <>
            {/* ACTIVE VIRTUAL LOAN MAIN CARD (SCREEN 1 OF IMAGE) */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-4 relative overflow-hidden border border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                    Approved Amount
                  </span>
                  <h2 className="text-3xl font-black text-white tracking-tight mt-0.5">
                    ₹ {approvedAmt.toLocaleString('en-IN')}
                  </h2>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase shadow-xs border ${
                    isActive
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-amber-500 text-slate-950 border-amber-400'
                  }`}
                >
                  {isActive ? 'Active' : 'Booked'}
                </span>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-1.5">
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden backdrop-blur-xs">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1 text-slate-200">
                  <div>
                    <span className="text-[10px] text-blue-200 block uppercase">Used Amount</span>
                    <span className="text-white font-black">₹ {usedAmt.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-blue-200 block uppercase">Available Amount</span>
                    <span className="text-emerald-400 font-black">₹ {availAmt.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PENDING ADMIN APPROVAL BANNER */}
            {!isActive && (
              <div className="bg-amber-50 border-2 border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-black text-amber-900">
                    Limit Credited • Pending Admin Approval
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    Your approved credit limit of <strong>₹{approvedAmt.toLocaleString('en-IN')}</strong> is credited into your wallet. QR payments and transfers will be unlocked once admin completes verification.
                  </p>
                </div>
              </div>
            )}

            {/* SUB-CARDS: TODAY'S REPAYMENT & NEXT DUE DATE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Today's Repayment</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  ₹ {todaysRepayment.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Next Due Date</span>
                </div>
                <p className="text-base font-black text-slate-900">{nextDueDate}</p>
              </div>
            </div>

            {/* ACTION BUTTONS: SCAN & PAY vs REPAY LOAN */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  if (!isActive) {
                    alert(`Wallet Transfers Locked: Your approved virtual credit limit of ₹${approvedAmt.toLocaleString('en-IN')} is credited and booked in your wallet, but transfers and QR payments are locked until Admin Approval is completed.`);
                    return;
                  }
                  setScanQrOpen(true);
                }}
                className={`py-3.5 px-4 rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
                  !isActive
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-pointer'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>{isActive ? 'Scan & Pay' : '🔒 Scan & Pay (Locked)'}</span>
              </button>

              <button
                onClick={() => setRepayModalOpen(true)}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <IndianRupee className="w-4 h-4" />
                <span>Repay Loan</span>
              </button>
            </div>

            {/* LIST MENU OPTIONS (SCREEN 1 OF IMAGE) */}
            <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
              <div
                onClick={() => setActiveTabModal('details')}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800">Loan Details</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => setActiveTabModal('history')}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800">Transaction History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => setActiveTabModal('schedule')}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800">Repayment Schedule</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => setActiveTabModal('documents')}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800">Documents</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => setSupportModalOpen(true)}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800">Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* SCAN & PAY QR MODAL */}
      <ScanQrModal
        isOpen={scanQrOpen}
        onClose={() => setScanQrOpen(false)}
        onManualInput={() => {
          setScanQrOpen(false);
          setRepayModalOpen(true);
        }}
      />

      {/* REPAYMENT MODAL */}
      <QrPaymentModal
        isOpen={repayModalOpen}
        onClose={() => setRepayModalOpen(false)}
      />

      {/* SUPPORT MODAL */}
      <HelpSupportModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />

      {/* TAB MODALS (LOAN DETAILS, HISTORY, SCHEDULE, DOCUMENTS) */}
      {activeTabModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {activeTabModal === 'details' && 'Loan Details'}
                {activeTabModal === 'history' && 'Transaction History'}
                {activeTabModal === 'schedule' && 'Repayment Schedule'}
                {activeTabModal === 'documents' && 'Loan Documents'}
              </h3>
              <button
                onClick={() => setActiveTabModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>

            {activeTabModal === 'details' && (
              <div className="space-y-2 text-xs font-medium text-slate-700">
                <div className="flex justify-between py-1 border-b">
                  <span>Loan Type:</span>
                  <span className="font-bold text-slate-900">Virtual Loan</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span>Approved Limit:</span>
                  <span className="font-bold text-slate-900">₹ {approvedAmt.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span>Interest Rate:</span>
                  <span className="font-bold text-slate-900">12.0% p.a.</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Loan Status:</span>
                  <span className="font-bold text-emerald-600">Active & Usable</span>
                </div>
              </div>
            )}

            {activeTabModal === 'history' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">QR Scan Payment</p>
                    <p className="text-[10px] text-slate-500">23 Sep 2026, 04:30 PM</p>
                  </div>
                  <span className="font-black text-rose-600">- ₹ 8,500</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">Virtual Loan Activation Credit</p>
                    <p className="text-[10px] text-slate-500">23 Sep 2026, 02:15 PM</p>
                  </div>
                  <span className="font-black text-emerald-600">+ ₹ 30,000</span>
                </div>
              </div>
            )}

            {activeTabModal === 'schedule' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center font-bold">
                  <div>
                    <p className="text-slate-900">Installment 1 (24 Sep 2025)</p>
                    <p className="text-[10px] text-blue-600">Upcoming Due</p>
                  </div>
                  <span className="text-slate-900">₹ 1,000</span>
                </div>
              </div>
            )}

            {activeTabModal === 'documents' && (
              <div className="space-y-2 text-xs font-semibold">
                <div className="p-2.5 bg-slate-50 rounded-xl border flex items-center justify-between">
                  <span>Aadhaar Card Copy</span>
                  <span className="text-emerald-600 font-bold">Verified ✓</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border flex items-center justify-between">
                  <span>PAN Card Copy</span>
                  <span className="text-emerald-600 font-bold">Verified ✓</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border flex items-center justify-between">
                  <span>Live Selfie Capture</span>
                  <span className="text-emerald-600 font-bold">Verified ✓</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveTabModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      <BottomNav onScanQr={() => setScanQrOpen(true)} />
    </MobileContainer>
  );
}
