'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import { apiRequest } from '@/lib/api';
import { Mail, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiRequest('/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email, purpose: 'forgot_password' }),
      });

      if (res.status === 'success') {
        setSenderEmail(res.sender_email || 'otp@msmeloan.sbs');
        setSuccessMsg(res.message);
        if (res.demo_otp) {
          setOtp(res.demo_otp);
        }
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Failed to send Email OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No registered account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiRequest('/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (res.status === 'success') {
        setSuccessMsg('Email OTP verified successfully! Enter your new password below.');
        setStep(3);
      } else {
        setErrorMsg(res.message || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiRequest('/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      if (res.status === 'success') {
        alert('Password reset successful! Redirecting to login page...');
        router.push('/login');
      } else {
        setErrorMsg(res.message || 'Password reset failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="p-4 space-y-5 flex-1 bg-gradient-to-b from-blue-50/50 to-white">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/login" className="p-2 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
              OS
            </div>
            <span className="text-xl font-black text-blue-700">OpenScore</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-900">Forgot Password</h1>
          <p className="text-xs text-slate-500">Reset your account password using Email OTP</p>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Registered Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>An OTP verification code will be sent to your registered email address.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Sending OTP...' : 'Send Email OTP →'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY EMAIL OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
              <Send className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900">Enter Email OTP Code</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sent to <span className="font-bold text-slate-900">{email}</span>
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                placeholder="6-Digit OTP"
                className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-2xl text-center text-xl font-mono font-black text-slate-900 tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying OTP...' : 'Verify Email OTP →'}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              className="text-xs font-bold text-blue-600 hover:underline pt-1 block mx-auto"
            >
              Resend OTP
            </button>
          </form>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <div className="text-center">
              <KeyRound className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 mt-1">Set New Password</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Updating Password...' : 'Reset Password & Proceed to Login →'}
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-xs">
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </MobileContainer>
  );
}

