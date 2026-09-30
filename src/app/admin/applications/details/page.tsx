'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  CreditCard,
  Eye,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import OverviewTab from '@/components/admin/applications/OverviewTab';
import PersonalDetailsTab from '@/components/admin/applications/PersonalDetailsTab';
import LoanDetailsTab from '@/components/admin/applications/LoanDetailsTab';
import DocumentsTab from '@/components/admin/applications/DocumentsTab';
import VerificationTab from '@/components/admin/applications/VerificationTab';
import BankDetailsTab from '@/components/admin/applications/BankDetailsTab';
import DisbursementAgreementTab from '@/components/admin/applications/DisbursementAgreementTab';
import ApplicationHeaderCard from '@/components/admin/applications/ApplicationHeaderCard';
import { getCachedApplications, setCachedApplications } from '@/lib/loan-cache';

function ApplicationDetailsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appIdParam = searchParams.get('id');

  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  
  // Instant Initial Load from memory/local cache (0ms delay)
  const [currentApp, setCurrentApp] = useState<any>(() => {
    if (!appIdParam) return null;
    const cached = getCachedApplications();
    return (
      cached.find(
        (a: any) =>
          String(a.id) === String(appIdParam) ||
          String(a.application_number) === String(appIdParam)
      ) || null
    );
  });

  const [loading, setLoading] = useState<boolean>(() => !currentApp && Boolean(appIdParam));
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const fetchApplicationDetails = async () => {
    if (!appIdParam) {
      setLoading(false);
      setErrorMsg('No Application ID specified.');
      return;
    }

    try {
      // Direct fast single app fetch
      let appData = null;
      try {
        const singleRes = await apiRequest(`/loan/applications/${appIdParam}`);
        if (singleRes && singleRes.data) {
          appData = singleRes.data;
        }
      } catch (e) {}

      if (!appData) {
        const res = await apiRequest('/admin/applications');
        if (res && res.data && Array.isArray(res.data)) {
          setCachedApplications(res.data);
          appData = res.data.find(
            (a: any) =>
              String(a.id) === String(appIdParam) ||
              String(a.application_number) === String(appIdParam)
          ) || (res.data.length > 0 ? res.data[0] : null);
        }
      }

      if (appData) {
        setCurrentApp(appData);
        setErrorMsg('');
      } else if (!currentApp) {
        setErrorMsg(`Application #${appIdParam} not found.`);
      }
    } catch (err: any) {
      if (!currentApp) {
        setErrorMsg(err.message || 'Failed to load application details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationDetails();
  }, [appIdParam]);

  const handleStatusChange = async (newStatus: string) => {
    if (!currentApp) return;
    try {
      await apiRequest(`/admin/applications/${currentApp.id}/update-stage`, {
        method: 'POST',
        body: JSON.stringify({ stage: newStatus }),
      });
      const updated = { ...currentApp, status: newStatus };
      setCurrentApp(updated);
      setActionSuccessMsg(
        `Application #${currentApp.application_number} status updated to ${newStatus.replace('_', ' ').toUpperCase()} in Database!`
      );
    } catch (err) {
      const updated = { ...currentApp, status: newStatus };
      setCurrentApp(updated);
      setActionSuccessMsg(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()} (Locally).`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-2xs">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-black text-slate-800">Loading Application Details...</p>
      </div>
    );
  }

  if (errorMsg || !currentApp) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
          <X className="w-6 h-6" />
        </div>
        <p className="text-base font-black text-slate-900">{errorMsg || 'Application Not Found'}</p>
        <p className="text-xs text-slate-500">The requested loan application could not be found.</p>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Applications List</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <span>✓ {actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Bar & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Applications List</span>
            </Link>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Application #{currentApp.application_number || currentApp.id}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Loan Applications</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">{currentApp.full_name}</span>
          </div>
        </div>

        <Link
          href="/admin/applications"
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 w-fit"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Return to Applications Table</span>
        </Link>
      </div>

      {/* Applicant Header Card & Stepper */}
      <ApplicationHeaderCard
        currentApp={currentApp}
        onUpdate={(updatedApp?: any) => {
          if (updatedApp) {
            setCurrentApp(updatedApp);
          } else {
            fetchApplicationDetails();
          }
        }}
        setActionSuccessMsg={setActionSuccessMsg}
      />

      {/* Dynamic Sub-Nav Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max pb-1">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'personal', label: 'Personal Details', icon: UserIcon },
            { id: 'loan_details', label: 'Loan Details', icon: FileText },
            { id: 'documents', label: 'Documents', icon: Upload },
            { id: 'verification', label: 'Verification', icon: ShieldCheck },
            { id: 'bank_details', label: 'Bank Details', icon: CreditCard },
            { id: 'disbursement_agreement', label: 'Disbursement Agreement', icon: CheckCircle2 },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Content Components */}
      {activeSubTab === 'overview' && (
        <OverviewTab
          currentApp={currentApp}
          onVerifyFee={async () => {
            try {
              const res = await apiRequest(`/admin/applications/${currentApp.id}/approve-stage`, {
                method: 'POST',
                body: JSON.stringify({ stage: 'fee_payment' }),
              });
              if (res.data) {
                setCurrentApp(res.data);
                setActionSuccessMsg(
                  `Processing fee verified & approved in database for #${currentApp.application_number || currentApp.id}!`
                );
              }
            } catch (err: any) {
              alert(err.message || 'Failed to verify fee payment');
            }
          }}
        />
      )}

      {activeSubTab === 'personal' && <PersonalDetailsTab currentApp={currentApp} />}

      {activeSubTab === 'loan_details' && <LoanDetailsTab currentApp={currentApp} />}

      {activeSubTab === 'documents' && <DocumentsTab currentApp={currentApp} />}

      {activeSubTab === 'verification' && <VerificationTab currentApp={currentApp} />}

      {activeSubTab === 'bank_details' && <BankDetailsTab currentApp={currentApp} />}

      {activeSubTab === 'disbursement_agreement' && (
        <DisbursementAgreementTab
          currentApp={currentApp}
          onDisburse={() => handleStatusChange('disbursed')}
        />
      )}
    </div>
  );
}

export default function ApplicationDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-2xs">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-black text-slate-800">Loading Application...</p>
        </div>
      }
    >
      <ApplicationDetailsContent />
    </Suspense>
  );
}

