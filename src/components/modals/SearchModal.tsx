'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronRight, Zap, TrendingUp, Shield, FileText, Lock } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const searchResults = [
    { title: 'Apply for Instant Cash Loan', route: '/loan/apply', icon: Zap },
    { title: 'Low CIBIL Score Loan (300-620)', route: '/loan/apply/cash-loan', icon: TrendingUp },
    { title: 'Without CIBIL Score Loan (0-300)', route: '/loan/apply/cash-loan', icon: Shield },
    { title: 'My Loan Applications & History', route: '/loan/my-loans', icon: FileText },
    { title: 'Account & Profile Settings', route: '/profile', icon: Lock },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-100 animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2 mb-1" />
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" /> Search OpenScore Portal
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search loans, status, profile, rewards..."
          className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-medium"
          autoFocus
        />

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {searchResults.length > 0 ? (
            searchResults.map((res, i) => {
              const Icon = res.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    onClose();
                    router.push(res.route);
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-purple-50 text-left rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-purple-600" /> {res.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No results matching "{query}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

