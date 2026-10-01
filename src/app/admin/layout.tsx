'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  ShieldCheck,
  CreditCard,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
  Calendar,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCheck,
  FileSearch,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, login, logout, loading: authLoading } = useAuth();
  const pathname = usePathname();

  // Admin Login States
  const [adminMobile, setAdminMobile] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string>('');
  const [adminAuthSubmitting, setAdminAuthSubmitting] = useState<boolean>(false);

  // Sidebar Open/Close State (Defaults to closed on mobile, open on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isAppListExpanded, setIsAppListExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Live Date Time String
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // Live Real Database Application Counts State
  const [appCounts, setAppCounts] = useState<{
    total: number;
    new: number;
    in_review: number;
    approved: number;
    rejected: number;
    disbursement_pending: number;
    disbursed: number;
    reapply_3_days: number;
  }>({
    total: 0,
    new: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
    disbursement_pending: 0,
    disbursed: 0,
    reapply_3_days: 0,
  });

  const [userCount, setUserCount] = useState<number>(0);
  const [urgentCount, setUrgentCount] = useState<number>(0);

  useEffect(() => {
    if (user && user.role === 'admin') {
      // Use ultra-fast stats endpoint
      apiRequest('/admin/stats')
        .then((res) => {
          if (res && res.data) {
            const d = res.data;
            setAppCounts({
              total: d.total_applications ?? 0,
              new: d.new_applications ?? 0,
              in_review: d.in_review ?? 0,
              approved: d.approved ?? 0,
              rejected: d.rejected ?? 0,
              disbursement_pending: d.disbursement_pending ?? 0,
              disbursed: d.disbursed ?? 0,
              reapply_3_days: d.reapply_3_days ?? 0,
            });
          }
        })
        .catch(() => {});

      // Fetch Urgent Loans stats
      apiRequest('/admin/urgent-construction-loans?per_page=1')
        .then((res) => {
          if (res && res.stats) {
            setUrgentCount(res.stats.under_review + res.stats.docs_required + res.stats.technical_verification || res.stats.total || 0);
          }
        })
        .catch(() => {});

      apiRequest('/admin/users')
        .then((res) => {
          if (res && res.data && Array.isArray(res.data)) {
            setUserCount(res.data.length);
          }
        })
        .catch(() => {
          apiRequest('/users')
            .then((res) => {
              if (res && res.data && Array.isArray(res.data)) {
                setUserCount(res.data.length);
              }
            })
            .catch(() => {});
        });
    }
  }, [user, pathname]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setAdminAuthSubmitting(true);

    try {
      const res = await apiRequest('/auth/login-pin', {
        method: 'POST',
        body: JSON.stringify({
          mobile: adminMobile.replace(/[^0-9]/g, ''),
          pin: adminPin.trim(),
        }),
      });

      if ((res.access_token || res.token) && res.user) {
        if (res.user.role !== 'admin') {
          setAdminAuthError('Access Denied. Account does not have Administrator privileges.');
        } else {
          login(res.access_token || res.token, res.user, res.refresh_token);
        }
      }
    } catch (err: any) {
      setAdminAuthError(err.message || 'Invalid Admin Mobile Number or Security PIN.');
    } finally {
      setAdminAuthSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  // Guard 1: Not Logged In -> Show Admin Login Form
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto shadow-xl border border-blue-400/20">
              OS
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">OpenScore Admin Portal</h2>
            <p className="text-xs text-slate-400 font-medium">Enter Admin Mobile Number & Security PIN</p>
          </div>

          {adminAuthError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-2xl font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{adminAuthError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Admin Mobile Number</label>
              <input
                type="tel"
                required
                value={adminMobile}
                onChange={(e) => setAdminMobile(e.target.value)}
                placeholder="Enter Mobile Number"
                className="w-full py-3.5 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">4-Digit Admin Security PIN</label>
              <input
                type="password"
                required
                maxLength={4}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="••••"
                className="w-full py-3.5 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-base font-bold text-white tracking-widest focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={adminAuthSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {adminAuthSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Log In to Admin Hub →'}
            </button>
          </form>


        </div>
      </div>
    );
  }

  // Guard 2: Logged In but Not Admin -> Access Denied
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Access Denied</h2>
            <p className="text-xs text-slate-400 mt-1">
              Signed in as <span className="text-white font-bold">{user.email || user.mobile}</span> ({user.role || 'user'}). Administrator privileges are required to access this portal.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => logout()}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700"
            >
              Log Out & Switch Account
            </button>
            <Link href="/dashboard" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl block text-center">
              Return to User Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans flex flex-col antialiased">
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 z-40 shadow-xs">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
              OS
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight flex items-center gap-1.5">
                OpenScore
                <span className="text-xs font-semibold text-slate-500">Admin Panel</span>
              </h1>
            </div>
          </Link>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Application No., Name, Mobile or Bank..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Right: Notifications, User App Link & Profile */}
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/loan/apply"
            target="_blank"
            className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-xl font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> User Portal
          </Link>

          {/* Notification Bell */}
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            {appCounts.new > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {appCounts.new}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              A
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="font-bold text-slate-900">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Super Admin</p>
            </div>
          </div>

          {/* Date & Time Widget */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 text-[11px] font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentDateTime || 'Wed, 17 Sep 2025 04:30 PM'}</span>
          </div>

          {/* Logout */}
          <button
            onClick={() => logout()}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
            title="Logout Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: SIDEBAR + ROUTED PAGE CONTENT */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Dark Overlay Backdrop */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          />
        )}

        {/* SIDEBAR NAVIGATION WITH DISTINCT NEXT.JS ROUTE LINKS */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-800 overflow-y-auto lg:static lg:z-30 lg:shrink-0 ${
            isSidebarOpen
              ? 'translate-x-0 lg:w-64'
              : '-translate-x-full lg:translate-x-0 lg:w-16'
          }`}
        >
          {/* Mobile Drawer Header */}
          <div className="p-3 flex items-center justify-between lg:hidden border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-lg font-black flex items-center justify-center text-xs">
                OS
              </div>
              <span className="font-black text-white text-xs">Admin Menu</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-1">
            {/* Dashboard Link */}
            <Link
              href="/admin/dashboard"
              onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                pathname === '/admin/dashboard' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className={!isSidebarOpen ? 'lg:hidden' : ''}>Dashboard</span>
              </div>
            </Link>



            {/* Distinct Page Route Sidebar Items */}
            {[
              { href: '/admin/urgent-loans', label: 'Urgent Loans', icon: Zap },
              { href: '/admin/partners', label: 'Partner / Lender', icon: Building2 },
              { href: '/admin/disbursement', label: 'Disbursement', icon: CreditCard },
              { href: '/admin/users', label: 'User Management', icon: Users },
              { href: '/admin/reports', label: 'Reports & Analytics', icon: Sliders },
              { href: '/admin/communication', label: 'Communication', icon: MessageSquare },
              { href: '/admin/remarks', label: 'Remarks & Templates', icon: CheckCheck },
              { href: '/admin/settings', label: 'Settings', icon: Settings },
            ].map((item: any) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { if (typeof window !== 'undefined' && window.innerWidth < 1024) setIsSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className={!isSidebarOpen ? 'lg:hidden' : ''}>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-md ${!isSidebarOpen ? 'lg:hidden' : ''} ${
                      isActive ? 'bg-white text-blue-700' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto p-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => logout()}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className={!isSidebarOpen ? 'lg:hidden' : ''}>Logout</span>
            </button>

            {isSidebarOpen && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-[11px]">
                <p className="font-bold text-blue-400">OpenScore</p>
                <p className="text-slate-400 text-[10px]">Finance Made Simple</p>
                <p className="text-slate-500 text-[9px] mt-1 font-mono">Version 1.0.0</p>
              </div>
            )}
          </div>
        </aside>

        {/* PAGE ROUTE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-5 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

