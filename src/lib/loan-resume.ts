'use client';

import { apiRequest } from '@/lib/api';

export interface LoanAppRecord {
  id: number;
  user_id?: number | null;
  application_number?: string;
  mobile_number?: string;
  full_name?: string;
  email?: string;
  pan_number?: string;
  aadhaar_number?: string;
  monthly_income?: number;
  status: string;
  final_decision?: string;
  disbursement_status?: string;
  payment_status?: string;
  fee_payment_status?: string;
  selected_amount?: number;
  required_amount?: number;
  indicative_min_amount?: number;
  indicative_max_amount?: number;
  selected_tenure?: number;
  indicative_interest_rate?: number;
  interest_rate_pa?: string;
  tenure_months?: number;
  monthly_emi?: number;
  approved_amount?: number;
  processing_fee?: number;
  fee_amount?: number;
  estimated_emi?: number;
  total_repayment?: number;
  total_interest?: number;
  transaction_id?: string;
  loan_type?: string;
  cibil_type?: string;
  selected_partner_name?: string;
  partner_locked?: boolean;
  lender_status?: string;
  proof_status?: string;
  reapply_locked_until?: string;
  created_at?: string;
  updated_at?: string;
}

export function isConstructionApp(app: LoanAppRecord): boolean {
  if (!app || !app.loan_type) return false;
  const t = app.loan_type.toLowerCase();
  return t.includes('construction') || t === 'construction_loan' || t === 'construction_no_cibil' || t === 'construction_low_cibil' || t === 'construction_good_cibil';
}

export function isVirtualApp(app: LoanAppRecord): boolean {
  if (!app || !app.loan_type) return false;
  const t = app.loan_type.toLowerCase();
  return t.includes('virtual') || t.includes('credit_line') || t.includes('creditline');
}

export function isCashApp(app: LoanAppRecord): boolean {
  return !isConstructionApp(app) && !isVirtualApp(app);
}

export function formatLoanType(type?: string): string {
  if (!type) return 'Personal Loan';
  const t = type.toLowerCase();
  if (t === 'construction_loan' || t === 'construction' || t.includes('construction')) {
    return 'Construction Loan';
  }
  if (t === 'low_cibil' || t === 'low cibil loan' || t === 'low cibil') {
    return 'Low CIBIL Cash Loan';
  }
  if (t === 'no_cibil' || t === 'no cibil loan' || t === 'no cibil') {
    return 'Without CIBIL Cash Loan';
  }
  if (t === 'good_cibil' || t === 'high_cibil' || t === 'good cibil') {
    return 'High CIBIL Cash Loan';
  }
  if (t === 'lap' || t.includes('property')) {
    return 'Loan Against Property';
  }
  if (t === 'business_loan' || t.includes('business')) {
    return 'Business Loan';
  }
  return type;
}

export function getUserMobileQuery(): string {
  if (typeof window === 'undefined') return '';
  try {
    // 1. Try from the logged-in user object
    const userStr = localStorage.getItem('openscore_user') || localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u && u.mobile) return `?mobile=${encodeURIComponent(u.mobile)}`;
      if (u && u.phone) return `?mobile=${encodeURIComponent(u.phone)}`;
    }
  } catch (e) {}
  try {
    // 2. Fallback: direct user_mobile key saved by loan apply flows
    const directMobile = localStorage.getItem('user_mobile') || localStorage.getItem('user_phone');
    if (directMobile && directMobile.trim()) {
      return `?mobile=${encodeURIComponent(directMobile.trim())}`;
    }
  } catch (e) {}
  return '';
}

export interface CooldownInfo {
  isLocked: boolean;
  reapplyLockedUntil: string | null;
  formattedDate: string | null;
  daysRemaining: number;
}

export async function checkReapplicationCooldown(): Promise<CooldownInfo> {
  try {
    const mobileQuery = getUserMobileQuery();
    const res = await apiRequest(`/loan/applications${mobileQuery}`);
    const apps: LoanAppRecord[] = res.data || [];
    if (Array.isArray(apps) && apps.length > 0) {
      const now = new Date();
      for (const app of apps) {
        if (app.reapply_locked_until) {
          const lockDate = new Date(app.reapply_locked_until);
          if (lockDate > now) {
            const diffMs = lockDate.getTime() - now.getTime();
            const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            const formattedDate = lockDate.toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            return {
              isLocked: true,
              reapplyLockedUntil: app.reapply_locked_until,
              formattedDate,
              daysRemaining,
            };
          }
        }
      }
    }
  } catch (err) {}

  return {
    isLocked: false,
    reapplyLockedUntil: null,
    formattedDate: null,
    daysRemaining: 0,
  };
}

export interface ResumeStepInfo {
  stepNumber: number;
  stepTitle: string;
  progressPercent: number;
  routeUrl: string;
  actionText: string;
  isCompleted: boolean;
}

/**
 * Returns exact step route URL and metadata for an active loan application
 */
export function getResumeStepDetails(app: LoanAppRecord): ResumeStepInfo {
  const status = (app.status || 'applied').toLowerCase();
  const decision = (app.final_decision || '').toUpperCase();
  const disbStatus = (app.disbursement_status || '').toLowerCase();
  const feeStatus = (app.fee_payment_status || app.payment_status || '').toLowerCase();
  const isFeeVerified = feeStatus.includes('verified') || feeStatus.includes('approved') || app.payment_status === 'verified' || app.payment_status === 'approved' || app.payment_status === 'paid';
  const isConstruction = isConstructionApp(app);
  const isVirtual = isVirtualApp(app);
  const basePath = isConstruction ? '/loan/apply/construction-loan' : '/loan/apply';

  // Virtual Loan Step Resolution
  if (isVirtual) {
    const isApproved = status === 'approved' || status === 'sanction_approved' || status === 'disbursed' || isFeeVerified;
    if (isApproved) {
      return {
        stepNumber: 3,
        stepTitle: 'Virtual Credit Limit Active',
        progressPercent: 100,
        routeUrl: '/dashboard',
        actionText: 'View Virtual Dashboard →',
        isCompleted: true,
      };
    }
    if (status === 'documents_submitted' || status === 'under_review' || status === 'fee_payment_pending' || status === 'loan_booked') {
      return {
        stepNumber: 3,
        stepTitle: 'Virtual Loan Fee & Authorization',
        progressPercent: 65,
        routeUrl: '/loan/apply/virtual-loan',
        actionText: 'Continue Application →',
        isCompleted: false,
      };
    }
    if (status === 'documents_pending') {
      return {
        stepNumber: 2,
        stepTitle: 'KYC & Documents Upload',
        progressPercent: 35,
        routeUrl: '/loan/apply/virtual-loan',
        actionText: 'Continue Application →',
        isCompleted: false,
      };
    }
    return {
      stepNumber: 1,
      stepTitle: 'Virtual Loan Application',
      progressPercent: 20,
      routeUrl: '/loan/apply/virtual-loan',
      actionText: 'Continue Application →',
      isCompleted: false,
    };
  }

  if (status === 'disbursed' || disbStatus === 'credited') {
    return {
      stepNumber: 26,
      stepTitle: 'Loan Disbursed Successfully',
      progressPercent: 100,
      routeUrl: `${basePath}/status?id=${app.id}`,
      actionText: 'View Disbursement Details →',
      isCompleted: true,
    };
  }

  if (status === 'disbursement_requested' || status === 'bank_submitted' || status === 'disbursement_pending') {
    return {
      stepNumber: 25,
      stepTitle: 'Disbursement Agreement & KFS',
      progressPercent: 92,
      routeUrl: `${basePath}/disbursement?id=${app.id}`,
      actionText: 'Sign Agreement & Claim Funds →',
      isCompleted: false,
    };
  }

  if (status === 'additional_docs_required' || decision === 'ADDITIONAL_DOCS') {
    return {
      stepNumber: 23,
      stepTitle: 'Upload Additional Documents',
      progressPercent: 88,
      routeUrl: `${basePath}/documents?id=${app.id}`,
      actionText: 'Upload Required Documents →',
      isCompleted: false,
    };
  }

  if (status === 'bank_details_approved' || (status === 'approved' && disbStatus !== 'credited') || status === 'agent_verified') {
    return {
      stepNumber: 22,
      stepTitle: 'Disbursal Bank Details',
      progressPercent: 85,
      routeUrl: `${basePath}/bank-details?id=${app.id}`,
      actionText: 'Enter Bank Account Details →',
      isCompleted: false,
    };
  }

  if (
    status === 'under_review' ||
    status === 'additional_docs_submitted' ||
    status === 'in_review' ||
    status === 'cibil_tier_assigned' ||
    status === 'proof_approved'
  ) {
    return {
      stepNumber: 21,
      stepTitle: 'Application Under Review',
      progressPercent: 81,
      routeUrl: `${basePath}/status?id=${app.id}`,
      actionText: 'Track Live Status →',
      isCompleted: false,
    };
  }

  if (
    status === 'proof_pending' ||
    status === 'proof_submitted' ||
    status === 'verification_pending' ||
    status === 'proof_verified' ||
    status === 'site_selfie_approved' ||
    status === 'lender_process_completed'
  ) {
    return {
      stepNumber: 16,
      stepTitle: 'Live Application Verification & Agent Selfie',
      progressPercent: 68,
      routeUrl: `${basePath}/verification?id=${app.id}`,
      actionText: 'Complete Verification & Agent Selfie →',
      isCompleted: false,
    };
  }

  if (
    status === 'partner_locked' ||
    status === 'partner_verified' ||
    status === 'lender_selected' ||
    app.partner_locked ||
    app.lender_status === 'partner_verified' ||
    (app.selected_partner_name && status !== 'submitted_to_partners' && status !== 'fee_payment_pending')
  ) {
    return {
      stepNumber: 15,
      stepTitle: 'Submit Partner Proof',
      progressPercent: 58,
      routeUrl: `${basePath}/proof-submission?id=${app.id}`,
      actionText: 'Submit Partner Proof Screenshot →',
      isCompleted: false,
    };
  }

  if (status === 'submitted_to_partners' || app.payment_status === 'paid' || isFeeVerified) {
    return {
      stepNumber: 11,
      stepTitle: 'Select Lending Partner',
      progressPercent: 42,
      routeUrl: `${basePath}/select-partner?id=${app.id}`,
      actionText: 'Choose Lending Partner →',
      isCompleted: false,
    };
  }

  if (status === 'documents_approved' || status === 'repayment_selected' || status === 'fee_payment_pending') {
    return {
      stepNumber: 10,
      stepTitle: 'Processing Fee Payment',
      progressPercent: 35,
      routeUrl: `${basePath}/fee-payment?id=${app.id}`,
      actionText: 'Pay Fee & Submit to Partners →',
      isCompleted: false,
    };
  }

  if (status === 'documents_pending' || status === 'documents_uploaded') {
    return {
      stepNumber: 4,
      stepTitle: 'Upload Initial Documents',
      progressPercent: 25,
      routeUrl: `${basePath}/documents?id=${app.id}`,
      actionText: 'Upload KYC & Income Documents →',
      isCompleted: false,
    };
  }

  if (status === 'applicant_details_submitted') {
    return {
      stepNumber: 3,
      stepTitle: 'Indicative Loan Calculation',
      progressPercent: 15,
      routeUrl: `${basePath}/indicative-calculator?id=${app.id}`,
      actionText: 'Calculate Eligibility Limit →',
      isCompleted: false,
    };
  }

  return {
    stepNumber: 2,
    stepTitle: isConstruction ? 'Construction Applicant Details' : 'Cash Loan Applicant Details',
    progressPercent: 8,
    routeUrl: `${basePath}/applicant-details?type=${app.loan_type || 'low_cibil'}`,
    actionText: 'Continue Application →',
    isCompleted: false,
  };
}

export interface ActiveLoanItem {
  app: LoanAppRecord;
  resumeInfo: ResumeStepInfo;
  isConstruction: boolean;
  isVirtual: boolean;
  loanCategoryTitle: string;
}

export interface AllActiveApps {
  cashApp: LoanAppRecord | null;
  constructionApp: LoanAppRecord | null;
  cashResumeInfo: ResumeStepInfo | null;
  constructionResumeInfo: ResumeStepInfo | null;
  activeList: ActiveLoanItem[];
}

/**
 * Fetches ALL active loan applications categorized into Cash vs Construction vs Virtual
 */
export async function getAllActiveLoanApplications(): Promise<AllActiveApps> {
  try {
    const mobileQuery = getUserMobileQuery();
    const res = await apiRequest(`/loan/applications${mobileQuery}`);
    const apps: LoanAppRecord[] = res.data || [];

    if (Array.isArray(apps) && apps.length > 0) {
      const activeApps = apps.filter((a) => {
        const dec = (a.final_decision || '').toUpperCase();
        const st = (a.status || '').toLowerCase();
        return dec !== 'REJECTED' && st !== 'rejected' && st !== 'cancelled';
      });

      const cashApp = activeApps.find(isCashApp) || null;
      const constructionApp = activeApps.find(isConstructionApp) || null;

      const cashResumeInfo = cashApp ? getResumeStepDetails(cashApp) : null;
      const constructionResumeInfo = constructionApp ? getResumeStepDetails(constructionApp) : null;

      const activeList: ActiveLoanItem[] = [];
      for (const app of activeApps) {
        const resumeInfo = getResumeStepDetails(app);
        if (!resumeInfo.isCompleted) {
          const isConst = isConstructionApp(app);
          const isVirt = isVirtualApp(app);
          activeList.push({
            app,
            resumeInfo,
            isConstruction: isConst,
            isVirtual: isVirt,
            loanCategoryTitle: isConst ? 'CONSTRUCTION LOAN' : isVirt ? 'VIRTUAL LOAN' : 'CASH LOAN',
          });
        }
      }

      return {
        cashApp,
        constructionApp,
        cashResumeInfo: cashResumeInfo && !cashResumeInfo.isCompleted ? cashResumeInfo : null,
        constructionResumeInfo: constructionResumeInfo && !constructionResumeInfo.isCompleted ? constructionResumeInfo : null,
        activeList,
      };
    }
  } catch (err) {}

  return {
    cashApp: null,
    constructionApp: null,
    cashResumeInfo: null,
    constructionResumeInfo: null,
    activeList: [],
  };
}

/**
 * Fetches current user's active loan application for a specific loan category ('cash' | 'construction')
 */
export async function getActiveLoanApplication(category?: 'cash' | 'construction'): Promise<LoanAppRecord | null> {
  const { cashApp, constructionApp } = await getAllActiveLoanApplications();

  if (category === 'cash') return cashApp;
  if (category === 'construction') return constructionApp;

  // If no category specified, try active localStorage or return first available
  const savedAppId = typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null;
  if (savedAppId) {
    if (cashApp && cashApp.id.toString() === savedAppId) return cashApp;
    if (constructionApp && constructionApp.id.toString() === savedAppId) return constructionApp;
  }
  return cashApp || constructionApp;
}

/**
 * Cancels active loan application
 */
export async function cancelLoanApplication(appId: number): Promise<boolean> {
  try {
    await apiRequest(`/loan/applications/${appId}/cancel`, { method: 'POST' });
  } catch (err) {
    console.error('Failed to cancel active loan application:', err);
  }
  return true;
}

/**
 * Resolves target loan application ID & record from URL param, localStorage, or backend API
 */
export async function resolveTargetAppId(
  urlAppId?: string | null,
  category: 'cash' | 'construction' = 'cash'
): Promise<{ appId: string | null; appRecord: LoanAppRecord | null }> {
  let targetId = urlAppId || (typeof window !== 'undefined' ? localStorage.getItem('active_loan_app_id') : null);

  let appRecord: LoanAppRecord | null = null;

  if (targetId) {
    try {
      const res = await apiRequest(`/loan/applications/${targetId}`);
      if (res.data) {
        appRecord = res.data;
      }
    } catch (e) {
      targetId = null;
    }
  }

  if (!targetId || !appRecord) {
    appRecord = await getActiveLoanApplication(category);
    if (appRecord) {
      targetId = appRecord.id.toString();
    }
  }

  if (targetId && typeof window !== 'undefined') {
    localStorage.setItem('active_loan_app_id', targetId);
  }

  return { appId: targetId, appRecord };
}

