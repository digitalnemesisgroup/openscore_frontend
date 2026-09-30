'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function VirtualDetailsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'history' | 'rules'>('overview');
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await apiRequest('/loan/virtual-loan/details');
        if (res && res.data) setDetails(res.data);
      } catch (err) {} finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, []);

  const historyTxs = [
    { id: 'VLTX839201', biz: 'Fiinway Digital Retail Mart', amount: 2000, date: '24 Sep 2026, 02:15 PM', status: 'SUCCESS' },
    { id: 'VLTX748291', biz: 'Fiinway Super Wholesale Grocery', amount: 1500, date: '23 Sep 2026, 11:30 AM', status: 'SUCCESS' },
    { id: 'VLTX639102', biz: 'Fiinway Business Hardware & Tools', amount: 5000, date: '22 Sep 2026, 04:45 PM', status: 'SUCCESS' },
  ];

  const scheduleList = [
    { day: 'Day 1 (24 Sep)', due: 1000, paid: 1000, status: 'PAID' },
    { day: 'Day 2 (25 Sep)', due: 1000, paid: 0, status: 'DUE TODAY' },
    { day: 'Day 3 (26 Sep)', due: 1000, paid: 0, status: 'UPCOMING' },
    { day: 'Day 4 (27 Sep)', due: 1000, paid: 0, status: 'UPCOMING' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans max-w-md mx-auto relative shadow-2xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={() => router.push('/loan/virtual-loan/dashboard')}
          className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-black tracking-tight">Virtual Loan Details</h1>
          <p className="text-[10px] text-slate-400 font-semibold">Step 12 of 12 • Account Ledger</p>
        </div>
        <button className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-black uppercase">
              Virtual Loan Account #VL-392019
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">
              ACTIVE LEDGER
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-bold block">Approved Loan Limit</span>
            <span className="text-3xl font-black text-white">₹30,000</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Used Balance:</span>
              <span className="font-extrabold text-amber-400 text-sm">₹8,500</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Available Usable:</span>
              <span className="font-extrabold text-emerald-400 text-sm">₹21,500</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-1 rounded-2xl flex border border-slate-800 text-xs font-bold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'schedule', label: 'Schedule' },
            { id: 'history', label: 'History' },
            { id: 'rules', label: 'Rules' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 rounded-xl transition-all text-center ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
              <h3 className="font-black text-white border-b border-slate-800 pb-2">Loan Product & Fee Details</h3>
              <div className="flex justify-between text-slate-400">
                <span>Fee Display Name:</span>
                <span className="font-bold text-white">Loan Processing / Service Fee</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>One-Time Fee Paid:</span>
                <span className="font-bold text-emerald-400">₹3,000 (PAID)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Loan Validity:</span>
                <span className="font-bold text-white">90 Days</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Auto Verification Status:</span>
                <span className="font-bold text-emerald-400">System Verified & Activated</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Need help or support?</span>
              <button
                onClick={() => router.push('/loan/virtual-loan/dashboard')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold rounded-xl"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-white border-b border-slate-800 pb-2">Daily Recovery Schedule</h3>
            <div className="space-y-2">
              {scheduleList.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{s.day}</div>
                    <div className="text-[10px] text-slate-400">Due: ₹{s.due.toLocaleString()}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    s.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : s.status === 'DUE TODAY' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-white border-b border-slate-800 pb-2">Merchant Payment History</h3>
            <div className="space-y-2">
              {historyTxs.map((tx) => (
                <div key={tx.id} className="p-3 bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{tx.biz}</div>
                    <div className="text-[10px] font-mono text-slate-400">{tx.id} • {tx.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-400">₹{tx.amount.toLocaleString()}</div>
                    <div className="text-[9px] text-emerald-300 font-bold uppercase">{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-black text-white border-b border-slate-800 pb-2">Admin Configured Eligibility Rules</h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Daily Transaction Limit:</span>
                <span className="font-bold text-white">₹5,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Daily Recovery Repayment:</span>
                <span className="font-bold text-white">₹1,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Business Max Transaction Limit:</span>
                <span className="font-bold text-white">₹2,000</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Same Business Monthly Limit:</span>
                <span className="font-bold text-white">5 Transactions</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Grace Period:</span>
                <span className="font-bold text-white">3 Days</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Late Charge:</span>
                <span className="font-bold text-white">₹100 / Day</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>Penalty Charge:</span>
                <span className="font-bold text-white">₹50</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
