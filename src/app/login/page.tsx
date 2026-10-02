'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  User,
  Briefcase,
  Mail,
  HelpCircle,
  PhoneCall,
  Calendar,
  UserCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, token, login } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isInactive = urlParams.get('reason') === 'inactive' || localStorage.getItem('inactivity_logout_reason');

      if (user && token && !isInactive) {
        if (user.role === 'admin' || user.role === 'super_admin') {
          router.push('/admin/dashboard');
        } else if (user.account_type === 'business' && !user.business_type) {
          router.push('/location');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      if (isInactive) {
        setInfoMsg('You were automatically logged out due to 15 minutes of inactivity. Please enter your mobile number and Security PIN to log back in.');
        localStorage.removeItem('inactivity_logout_reason');
      }
    }
  }, [user, token, router]);

  // Wizard Auth Steps:
  // 'MOBILE_INPUT' -> Initial screen with ONLY Mobile Number
  // 'PIN_LOGIN' -> Registered User PIN entry
  // 'FORGOT_PIN_OTP' -> Forgot PIN OTP entry & new PIN set
  // 'NEW_USER_OTP' -> New User OTP verification
  // 'NEW_USER_SETUP_PIN' -> New User PIN setup
  // 'NEW_USER_ACCOUNT_TYPE' -> Select Student, Personal, Business
  // 'NEW_USER_DETAILS' -> Full Name, Email & Personal Details
  // 'SOFT_BAN' -> 15-minute soft ban lock screen
  const [authStep, setAuthStep] = useState<
    | 'MOBILE_INPUT'
    | 'PIN_LOGIN'
    | 'FORGOT_PIN_OTP'
    | 'NEW_USER_OTP'
    | 'NEW_USER_SETUP_PIN'
    | 'NEW_USER_ACCOUNT_TYPE'
    | 'NEW_USER_DETAILS'
    | 'SOFT_BAN'
  >('MOBILE_INPUT');

  // Input States
  const [mobileNumber, setMobileNumber] = useState('');
  const [registeredUserInfo, setRegisteredUserInfo] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // OTP Verification States
  const [otpCode, setOtpCode] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'voice'>('email');

  // Registration States
  const [accountType, setAccountType] = useState<'student' | 'personal' | 'business'>('personal');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');

  // Soft Ban States
  const [banSeconds, setBanSeconds] = useState(900);

  // Feedback States
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Voice Call OTP States (First Time Users)
  const [callOtpCount, setCallOtpCount] = useState<number>(1);
  const [callOtpTimer, setCallOtpTimer] = useState<number>(30);

  // Soft Ban Countdown Effect
  useEffect(() => {
    let timer: any;
    if (authStep === 'SOFT_BAN' && banSeconds > 0) {
      timer = setInterval(() => {
        setBanSeconds((prev) => {
          if (prev <= 1) {
            setAuthStep('PIN_LOGIN');
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, banSeconds]);

  // Voice Call OTP Countdown Effect
  useEffect(() => {
    let timer: any;
    if (authStep === 'NEW_USER_OTP' && callOtpTimer > 0) {
      timer = setInterval(() => {
        setCallOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, callOtpTimer]);

  const handleResendCallOtp = async () => {
    setLoading(true);
    setError('');
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');

    try {
      await triggerLoginOtp(cleanMobile);
      const newCount = callOtpCount + 1;
      setCallOtpCount(newCount);
      setInfoMsg('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend Voice Call OTP.');
    } finally {
      setLoading(false);
    }
  };

  const formatBanTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mobile Check Debounce State
  const [mobileStatus, setMobileStatus] = useState<'idle' | 'checking' | 'registered' | 'unregistered' | 'error'>('idle');

  // Debounced Mobile Number Registration Check Effect
  useEffect(() => {
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length !== 10) {
      setMobileStatus('idle');
      setRegisteredUserInfo(null);
      return;
    }

    setMobileStatus('checking');
    setError('');

    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest('/auth/check-mobile', {
          method: 'POST',
          body: JSON.stringify({ mobile: cleanMobile }),
        });

        if (res.registered) {
          setRegisteredUserInfo(res);
          setMobileStatus('registered');
        } else {
          setMobileStatus('unregistered');
        }
      } catch (err: any) {
        setMobileStatus('error');
        setError(err.message || 'Unable to check mobile registration status.');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [mobileNumber]);

  // STEP 1: MOBILE SUBMIT (REGISTERED -> PIN, UNREGISTERED -> SEND OTP)
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) return;

    if (mobileStatus === 'registered') {
      setAuthStep('PIN_LOGIN');
    } else {
      setLoading(true);
      setError('');
      try {
        await triggerLoginOtp(cleanMobile);
        setAuthStep('NEW_USER_OTP');
      } catch (err: any) {
        setError(err.message || 'Failed to trigger OTP.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Helper: Trigger OTP
  const triggerLoginOtp = async (targetMobile: string) => {
    const res = await apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier: targetMobile, type: 'mobile' }),
    });
    setInfoMsg(res.message || 'Verification OTP code sent to your registered mobile.');
  };

  // REGISTERED USER: PIN LOGIN
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (pin.length < 4) {
      setError('Please enter your 4-digit Security PIN.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/auth/login-pin', {
        method: 'POST',
        body: JSON.stringify({ mobile: cleanMobile, pin: pin.trim() }),
      });

      if (res.token && res.user) {
        login(res.access_token || res.token, res.user, res.refresh_token);
        if (res.user.role === 'admin' || res.user.is_admin) {
          router.push('/admin/dashboard');
        } else if (res.user.account_type === 'business' && !res.user.business_type) {
          router.push('/location');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      if (err.locked || err.seconds_remaining || err.message?.includes('soft-banned') || err.message?.includes('3 failed attempts')) {
        setBanSeconds(err.seconds_remaining || 900);
        setAuthStep('SOFT_BAN');
      } else {
        setError(err.message || 'Incorrect PIN code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // REGISTERED USER: FORGOT PIN OTP TRIGGER
  const handleTriggerForgotPinOtp = async (method: 'email' | 'voice') => {
    setError('');
    setLoading(true);
    setRecoveryMethod(method);

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');

    try {
      const res = await apiRequest('/auth/pin/send-recovery-otp', {
        method: 'POST',
        body: JSON.stringify({ mobile: cleanMobile, method }),
      });

      setInfoMsg(res.message || 'Verification OTP code sent.');
      setAuthStep('FORGOT_PIN_OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery OTP.');
    } finally {
      setLoading(false);
    }
  };

  // REGISTERED USER: RESET PIN WITH OTP
  const handleResetPinWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (otpCode.length < 4) {
      setError('Please enter your OTP code.');
      setLoading(false);
      return;
    }
    if (pin.length < 4) {
      setError('Please enter a new 4-digit Security PIN.');
      setLoading(false);
      return;
    }
    if (confirmPin && pin !== confirmPin) {
      setError('PIN and Confirm PIN do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/auth/pin/verify-recovery-otp', {
        method: 'POST',
        body: JSON.stringify({
          mobile: cleanMobile,
          otp: otpCode.trim(),
          new_pin: pin.trim(),
        }),
      });

      if (res.token && res.user) {
        login(res.access_token || res.token, res.user, res.refresh_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // NEW USER: VERIFY OTP
  const handleVerifyNewUserOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (otpCode.length < 4) {
      setError('Please enter your OTP code.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier: cleanMobile, otp: otpCode.trim() }),
      });

      if (res.status === 'success') {
        setAuthStep('NEW_USER_SETUP_PIN');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // NEW USER: SETUP PIN & PROCEED TO ACCOUNT TYPE
  const handleSetupPinNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('Please enter a 4-digit Security PIN.');
      return;
    }
    if (confirmPin && pin !== confirmPin) {
      setError('PIN and Confirm PIN do not match.');
      return;
    }

    setAuthStep('NEW_USER_ACCOUNT_TYPE');
  };

  // NEW USER: COMPLETE REGISTRATION
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');

    try {
      const res = await apiRequest('/auth/complete-registration', {
        method: 'POST',
        body: JSON.stringify({
          mobile: cleanMobile,
          pin: pin.trim(),
          account_type: accountType,
          name: fullName,
          email: email,
        }),
      });

      if (res.token && res.user) {
        login(res.access_token || res.token, res.user, res.refresh_token);
        if (accountType === 'business') {
          router.push('/location');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <div className="flex-1 flex flex-col justify-between p-6 animate-in fade-in zoom-in-95 duration-500">
        <div>
          {/* BRANDING HEADER */}
          <div className="flex flex-col items-center mt-4 mb-6 text-center">
            <div className="relative mb-3">
              <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl blur-xl animate-pulse" />
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl relative border border-blue-400/20">
                OS
              </div>
            </div>
            <h1 className="text-2xl font-black text-blue-700 tracking-tight flex items-center gap-1">
              OpenScore
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Welcome to OpenScore Financial Portal</p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium flex items-start gap-2 animate-in fade-in duration-200 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl space-y-1 animate-in fade-in duration-300 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{infoMsg}</span>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 1: MOBILE NUMBER INPUT ONLY */}
          {/* ==================================================================== */}
          {authStep === 'MOBILE_INPUT' && (
            <form onSubmit={handleMobileSubmit} className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-black text-slate-900">Welcome to OpenScore</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your mobile number to get started</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-3.5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white shadow-2xs"
                  />
                  {mobileStatus === 'checking' && (
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    </span>
                  )}
                </div>
              </div>

              {/* Status Feedback Banners */}
              {mobileStatus === 'checking' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Checking mobile registration status...</span>
                </div>
              )}

              {mobileStatus === 'registered' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Registered Account Found! Proceed to Security PIN Login.</span>
                </div>
              )}

              {mobileStatus === 'unregistered' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>New Number — OTP Verification Required.</span>
                </div>
              )}

              {/* Dynamic Action Buttons - Only rendered after checking database status */}
              {mobileStatus === 'registered' && (
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] animate-in zoom-in-95 duration-200"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Security PIN Login →</span>
                </button>
              )}

              {mobileStatus === 'unregistered' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] animate-in zoom-in-95 duration-200"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification OTP...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Send Verification OTP →</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* ==================================================================== */}
          {/* STEP 2A: REGISTERED USER 4-DIGIT PIN LOGIN */}
          {/* ==================================================================== */}
          {authStep === 'PIN_LOGIN' && (
            <form onSubmit={handlePinLogin} className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('MOBILE_INPUT');
                    setError('');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline mb-2 block"
                >
                  ← Change Mobile Number (+91 {mobileNumber})
                </button>
                <h2 className="text-xl font-black text-slate-900">
                  Welcome Back{registeredUserInfo?.user_name ? `, ${registeredUserInfo.user_name}` : ''}!
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your 4-digit Security PIN to log in</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">4-Digit Security PIN *</label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full pl-10 pr-3.5 py-4 bg-white border-2 border-blue-500 rounded-2xl text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? 'Verifying PIN...' : 'Log In with Security PIN →'}
              </button>

              {/* FORGOT PIN OPTION */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleTriggerForgotPinOtp(registeredUserInfo?.has_email ? 'email' : 'voice')}
                  disabled={loading}
                  className="w-full py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                >
                  {registeredUserInfo?.has_email ? (
                    <>
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>Forgot Security PIN? Reset via Email OTP</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Forgot Security PIN? Reset via OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ==================================================================== */}
          {/* STEP 2A-RECOVERY: FORGOT PIN RESET */}
          {/* ==================================================================== */}
          {authStep === 'FORGOT_PIN_OTP' && (
            <form onSubmit={handleResetPinWithOtp} className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => setAuthStep('PIN_LOGIN')}
                  className="text-xs font-bold text-blue-600 hover:underline mb-2 block"
                >
                  ← Back to PIN Login
                </button>
                <h2 className="text-xl font-black text-slate-900">PIN Recovery</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter OTP code & set new 4-digit PIN</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Verification OTP *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                    setInfoMsg('');
                    setError('');
                  }}
                  placeholder="1234"
                  className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New 4-Digit PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-center text-lg font-mono font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-center text-lg font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4 || pin.length < 4}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
              >
                {loading ? 'Resetting PIN...' : 'Reset PIN & Log In →'}
              </button>
            </form>
          )}

          {/* ==================================================================== */}
          {/* STEP 2B-1: NEW USER OTP VERIFICATION */}
          {/* ==================================================================== */}
          {authStep === 'NEW_USER_OTP' && (
            <form onSubmit={handleVerifyNewUserOtp} className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-1">
                <button
                  type="button"
                  onClick={() => setAuthStep('MOBILE_INPUT')}
                  className="text-xs font-bold text-purple-600 hover:underline mb-2 block"
                >
                  ← Change Mobile Number (+91 {mobileNumber})
                </button>
              </div>

              {/* Clean Ringing Phone Call Notification Card */}
              <div className="p-4 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border border-purple-200/80 rounded-2xl flex items-center gap-3.5 shadow-xs">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-md animate-pulse">
                    <PhoneCall className="w-6 h-6 animate-bounce" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-600"></span>
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Pick up the Incoming Call</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">
                    Please answer the call on <strong className="font-bold text-purple-700">+91 {mobileNumber}</strong>, listen to your OTP, and enter it below.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  Enter 4-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                    setInfoMsg('');
                    setError('');
                  }}
                  placeholder="• • • •"
                  className="w-full py-4 bg-slate-50 border-2 border-purple-300 rounded-2xl text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-100 focus:outline-none shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Set PIN →'}
              </button>

              {/* RESEND VOICE CALL OTP BUTTON */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleResendCallOtp}
                  disabled={loading}
                  className="w-full py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 disabled:opacity-60 text-purple-800 font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <PhoneCall className="w-4 h-4 text-purple-600" />
                  <span>Resend OTP via Voice Call</span>
                </button>
              </div>
            </form>
          )}

          {/* ==================================================================== */}
          {/* STEP 2B-2: NEW USER SETUP 4-DIGIT PIN */}
          {/* ==================================================================== */}
          {authStep === 'NEW_USER_SETUP_PIN' && (
            <form onSubmit={handleSetupPinNext} className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <h2 className="text-xl font-black text-slate-900">Setup Security PIN</h2>
                <p className="text-xs text-slate-500 mt-0.5">Create a 4-digit PIN for instant passwordless logins</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Create 4-Digit PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-center text-xl font-mono font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm PIN *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-center text-xl font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
              >
                Proceed to Select Account Type →
              </button>
            </form>
          )}

          {/* ==================================================================== */}
          {/* STEP 2B-3: SELECT ACCOUNT TYPE (STUDENT, PERSONAL, BUSINESS) */}
          {/* ==================================================================== */}
          {authStep === 'NEW_USER_ACCOUNT_TYPE' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <h2 className="text-xl font-black text-slate-900">Select Account Type</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose your primary account usage profile</p>
              </div>

              <div className="space-y-3">
                {/* 1. Student Account — Violet */}
                <div
                  onClick={() => setAccountType('student')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    accountType === 'student'
                      ? 'bg-violet-50 border-violet-600 shadow-lg shadow-violet-100 scale-[1.02]'
                      : 'bg-violet-50/40 border-violet-200 hover:border-violet-400 hover:bg-violet-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-all ${
                      accountType === 'student' ? 'bg-violet-600 text-white shadow-md shadow-violet-300' : 'bg-violet-100 text-violet-600'
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-violet-900">Student Account</h3>
                      <p className="text-xs text-violet-600/80">Low CIBIL & nominal docs for education & personal needs</p>
                    </div>
                    {accountType === 'student' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Personal Account — Blue */}
                <div
                  onClick={() => setAccountType('personal')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    accountType === 'personal'
                      ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-100 scale-[1.02]'
                      : 'bg-blue-50/40 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-all ${
                      accountType === 'personal' ? 'bg-blue-600 text-white shadow-md shadow-blue-300' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-blue-900">Personal Account</h3>
                      <p className="text-xs text-blue-600/80">Personal loans, salary & everyday financial services</p>
                    </div>
                    {accountType === 'personal' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Business Account — Emerald */}
                <div
                  onClick={() => setAccountType('business')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                    accountType === 'business'
                      ? 'bg-emerald-50 border-emerald-600 shadow-lg shadow-emerald-100 scale-[1.02]'
                      : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-all ${
                      accountType === 'business' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-300' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-900">Business Account</h3>
                      <p className="text-xs text-emerald-600/80">MSME, commercial capital & business expansion finance</p>
                    </div>
                    {accountType === 'business' && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAuthStep('NEW_USER_DETAILS')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
              >
                Proceed to Personal Details →
              </button>
            </div>
          )}

          {/* ==================================================================== */}
          {/* STEP 2B-4: PERSONAL DETAILS & REGISTRATION COMPLETION */}
          {/* ==================================================================== */}
          {authStep === 'NEW_USER_DETAILS' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-in fade-in duration-300">
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => setAuthStep('NEW_USER_ACCOUNT_TYPE')}
                  className="text-xs font-bold text-blue-600 hover:underline mb-2 block"
                >
                  ← Back to Account Type ({accountType.toUpperCase()})
                </button>
                <h2 className="text-xl font-black text-slate-900">Personal Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your full name and email to complete registration</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !fullName || !email}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all"
              >
                {loading ? 'Completing Registration...' : (accountType === 'business' ? 'Complete Registration & Setup Store →' : 'Complete Registration & Go to Dashboard →')}
              </button>
            </form>
          )}

          {/* ==================================================================== */}
          {/* SOFT BAN LOCK SCREEN */}
          {/* ==================================================================== */}
          {authStep === 'SOFT_BAN' && (
            <div className="space-y-4 animate-in fade-in duration-300 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Account Soft-Banned</h2>
                <p className="text-xs text-slate-500 mt-1">3 incorrect PIN attempts. Security lockout active.</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-3xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lockout Remaining:</span>
                <h3 className="text-3xl font-mono font-black text-rose-400">{formatBanTime(banSeconds)}</h3>
              </div>

              <button
                type="button"
                onClick={() => handleTriggerForgotPinOtp('voice')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Recover PIN via Instant Call OTP →</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="pt-4 text-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            100% Encrypted & Protected Auth
          </span>
        </div>
      </div>
    </MobileContainer>
  );
}
