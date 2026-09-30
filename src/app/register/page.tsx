'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { User as UserIcon, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const [accountType, setAccountType] = useState<'personal' | 'business' | 'student'>('personal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, mobile, password, account_type: accountType }),
      });

      if (res.token && res.user) {
        login(res.access_token || res.token, res.user, res.refresh_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="flex-1 flex flex-col justify-between p-6">
        <div>
          {/* Header Branding */}
          <div className="flex flex-col items-center mt-4 mb-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md mb-2">
              OS
            </div>
            <h1 className="text-xl font-black text-blue-700">Openscore</h1>
            <p className="text-xs text-slate-500">Your Financial Growth Partner</p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Create Account</h2>
            <p className="text-xs text-slate-500">Register to receive instant UPI ID and wallet services</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Account Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Account Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAccountType('personal')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                    accountType === 'personal'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👤 Personal
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('business')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                    accountType === 'business'
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💼 Business
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('student')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all ${
                    accountType === 'student'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎓 Student
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {accountType === 'business'
                  ? '✓ Verified to receive transfers & payments via QR/UPI'
                  : '✓ Personal borrower account with instant OpenScore UPI ID'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name / Business Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={accountType === 'business' ? 'e.g. Apex Retail Store' : 'Enter full name'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10 digit mobile number"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Register & Continue'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mt-4">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>100% Secure Data Protection</span>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
}

