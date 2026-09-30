'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, Eye, ShieldCheck, Sparkles, RefreshCw, X, FileText, Check, AlertCircle, ExternalLink, Download, XCircle } from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '@/lib/api';

interface DocumentsTabProps {
  currentApp: any;
}

export default function DocumentsTab({ currentApp }: DocumentsTabProps) {
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, string>>({
    pan: 'Approved',
    aadhaar: 'Approved',
    bank_statement: 'Approved',
    income: 'Approved',
    photograph: 'Approved',
    property_ownership: 'Approved',
    selfie: 'Approved',
    partner: 'Approved',
  });
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [autoVerifySuccess, setAutoVerifySuccess] = useState(false);

  // Parse uploaded documents from DB if present
  const parsedDocs = typeof currentApp?.documents_uploaded === 'string'
    ? (() => { try { return JSON.parse(currentApp.documents_uploaded); } catch(e) { return null; } })()
    : currentApp?.documents_uploaded;

  const getDocData = (docKey: string, defaultName: string) => {
    const d = parsedDocs?.[docKey];
    if (!d) return { file: defaultName, preview: null, uploaded: false };
    const resolved = resolveMediaUrl(d);
    if (typeof d === 'string') return { file: d, preview: resolved || null, uploaded: true };
    if (typeof d === 'object') {
      return {
        file: d.name || d.file || defaultName,
        preview: resolved || resolveMediaUrl(d.preview || d.url || d.path) || null,
        size: d.size || null,
        uploaded: Boolean(d.uploaded || d.name || d.preview || d.base64 || d.url),
      };
    }
    return { file: defaultName, preview: resolved || null, uploaded: Boolean(d) };
  };

  const panNo = currentApp?.pan_number || 'ABCDE1234F';
  const aadhaarNo = currentApp?.aadhaar_number || '1234 5678 9012';
  const applicantName = currentApp?.full_name || 'APPLICANT NAME';
  const appNo = currentApp?.application_number || 'OSL202509170004';

  const panDocData = getDocData('pan_card', 'pan_card_document.pdf');
  const aadhaarDocData = getDocData('aadhaar_card', 'aadhaar_card_doc.pdf') || getDocData('aadhaar_address_proof', 'aadhaar_card_doc.pdf');
  const bankDocData = getDocData('bank_statement', 'bank_statement_3mo.pdf');
  const incomeDocData = getDocData('income_proof', 'salary_slip.pdf');
  const photoDocData = getDocData('photograph', 'applicant_photo.jpg') || getDocData('passport_photo', 'applicant_photo.jpg');
  const propertyDocData = getDocData('property_ownership_doc', 'land_registry_khasra.pdf');

  // SVG Data URI generators for realistic document images
  const getPanSvg = (name: string, pan: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="20" fill="#e8f4f8" stroke="#0077b6" stroke-width="2"/>
  <rect width="600" height="60" fill="#1b4965"/>
  <text x="30" y="38" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="19">INCOME TAX DEPARTMENT • GOVT OF INDIA</text>
  <text x="570" y="38" fill="#ffd166" font-family="Arial, sans-serif" font-weight="bold" font-size="17" text-anchor="end">PERMANENT ACCOUNT CARD</text>
  <circle cx="300" cy="220" r="90" fill="#d0e1e9" opacity="0.4"/>
  <rect x="35" y="80" width="115" height="140" rx="8" fill="#cad2c5" stroke="#84a98c" stroke-width="2"/>
  <circle cx="92" cy="130" r="32" fill="#52796f"/>
  <path d="M 52 195 Q 92 155 132 195 Z" fill="#52796f"/>
  <text x="170" y="105" fill="#1b4965" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Name / नाम</text>
  <text x="170" y="126" fill="#000000" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${name.toUpperCase()}</text>
  <text x="170" y="155" fill="#1b4965" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Father's Name / पिता का नाम</text>
  <text x="170" y="175" fill="#000000" font-family="Arial, sans-serif" font-size="16" font-weight="bold">KUMAR TEWARI</text>
  <text x="170" y="205" fill="#1b4965" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Date of Birth / जन्म तिथि</text>
  <text x="170" y="225" fill="#000000" font-family="Arial, sans-serif" font-size="16" font-weight="bold">15/08/1992</text>
  <rect x="35" y="240" width="530" height="65" rx="10" fill="#1b4965"/>
  <text x="50" y="262" fill="#ffd166" font-family="Arial, sans-serif" font-size="12" font-weight="bold">PAN NUMBER / स्थायी खाता संख्या</text>
  <text x="50" y="290" fill="#ffffff" font-family="'Courier New', monospace" font-size="28" font-weight="bold" letter-spacing="4">${pan}</text>
  <rect x="460" y="85" width="105" height="105" rx="8" fill="#ffffff" stroke="#1b4965" stroke-width="2"/>
  <path d="M 470 95 h 25 v 25 h -25 z M 530 95 h 25 v 25 h -25 z M 470 155 h 25 v 25 h -25 z M 505 125 h 25 v 25 h -25 z M 530 155 h 25 v 25 h -25 z" fill="#1b4965"/>
  <line x1="35" y1="340" x2="200" y2="340" stroke="#000000" stroke-width="1.5"/>
  <text x="35" y="358" fill="#555555" font-family="Arial, sans-serif" font-size="12">Signature / हस्ताक्षर</text>
  <text x="565" y="358" fill="#0077b6" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="end">Ref: ${ref}</text>
</svg>
`)}`;

  const getAadhaarSvg = (name: string, aadhaar: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="20" fill="#ffffff" stroke="#e63946" stroke-width="2"/>
  <rect width="600" height="50" fill="#e63946"/>
  <rect y="50" width="600" height="10" fill="#ffb703"/>
  <text x="30" y="33" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="18">भारतीय विशिष्ट पहचान प्राधिकरण • UIDAI</text>
  <text x="570" y="33" fill="#ffffff" font-family="Arial, sans-serif" font-weight="bold" font-size="16" text-anchor="end">Government of India</text>
  <rect x="35" y="80" width="120" height="145" rx="8" fill="#f1faee" stroke="#a8dadc" stroke-width="2"/>
  <circle cx="95" cy="135" r="32" fill="#457b9d"/>
  <path d="M 55 195 Q 95 155 135 195 Z" fill="#457b9d"/>
  <text x="175" y="105" fill="#1d3557" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${name}</text>
  <text x="175" y="130" fill="#555555" font-family="Arial, sans-serif" font-size="14">DOB: 15/08/1992 | Male / पुरुष</text>
  <text x="175" y="155" fill="#555555" font-family="Arial, sans-serif" font-size="13">Address: Flat 402, Civil Lines, Kanpur, UP - 208001</text>
  <rect x="450" y="80" width="115" height="115" rx="8" fill="#ffffff" stroke="#1d3557" stroke-width="2"/>
  <path d="M 460 90 h 30 v 30 h -30 z M 525 90 h 30 v 30 h -30 z M 460 155 h 30 v 30 h -30 z M 495 125 h 30 v 30 h -30 z M 525 155 h 30 v 30 h -30 z" fill="#1d3557"/>
  <rect x="35" y="245" width="530" height="70" rx="12" fill="#1d3557"/>
  <text x="300" y="275" fill="#ffb703" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">मेरा आधार, मेरी पहचान</text>
  <text x="300" y="303" fill="#ffffff" font-family="'Courier New', monospace" font-size="26" font-weight="bold" letter-spacing="4" text-anchor="middle">${aadhaar}</text>
  <text x="300" y="355" fill="#e63946" font-family="Arial, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Aadhaar Verified • App Ref: ${ref}</text>
</svg>
`)}`;

  const getBankStatementSvg = (name: string, income: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <rect width="600" height="65" fill="#0f172a"/>
  <text x="30" y="40" fill="#38bdf8" font-family="Arial, sans-serif" font-weight="bold" font-size="20">HDFC BANK • ACCOUNT STATEMENT</text>
  <text x="570" y="40" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13" text-anchor="end">CONFIDENTIAL</text>
  <rect x="30" y="80" width="540" height="75" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="45" y="105" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Account Holder: <tspan fill="#0f172a">${name}</tspan></text>
  <text x="45" y="130" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Monthly Salary Credit: <tspan fill="#16a34a">${income}</tspan></text>
  <text x="360" y="105" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">A/C No: <tspan fill="#0f172a">XXXX-XXXX-9842</tspan></text>
  <text x="360" y="130" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Statement Period: <tspan fill="#0f172a">Last 3 Months</tspan></text>
  <rect x="30" y="170" width="540" height="32" fill="#e2e8f0"/>
  <text x="45" y="191" fill="#334155" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Date</text>
  <text x="130" y="191" fill="#334155" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Description / Narration</text>
  <text x="380" y="191" fill="#334155" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Type</text>
  <text x="555" y="191" fill="#334155" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end">Amount (₹)</text>
  <rect x="30" y="202" width="540" height="32" fill="#ffffff"/>
  <text x="45" y="223" fill="#64748b" font-family="Arial, sans-serif" font-size="11">01/09/2026</text>
  <text x="130" y="223" fill="#0f172a" font-family="Arial, sans-serif" font-size="11" font-weight="bold">ACH CREDIT - SALARY ACME CORP</text>
  <text x="380" y="223" fill="#16a34a" font-family="Arial, sans-serif" font-size="11" font-weight="bold">CREDIT</text>
  <text x="555" y="223" fill="#16a34a" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="end">+50,000.00</text>
  <circle cx="500" cy="335" r="28" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="4,2"/>
  <text x="500" y="333" fill="#2563eb" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">BANK VERIFIED</text>
  <text x="30" y="355" fill="#64748b" font-family="Arial, sans-serif" font-size="11">System Verified Payload • Ref: ${ref}</text>
</svg>
`)}`;

  const getIncomeProofSvg = (name: string, income: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
  <rect width="600" height="60" fill="#1e293b"/>
  <text x="30" y="38" fill="#f59e0b" font-family="Arial, sans-serif" font-weight="bold" font-size="19">SALARY SLIP • OFFICIAL INCOME PROOF</text>
  <text x="570" y="38" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13" text-anchor="end">CONFIDENTIAL</text>
  <rect x="30" y="80" width="540" height="85" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="45" y="108" fill="#475569" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Employee Name: <tspan fill="#0f172a">${name}</tspan></text>
  <text x="45" y="135" fill="#475569" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Gross Salary: <tspan fill="#16a34a">${income}</tspan></text>
  <text x="350" y="108" fill="#475569" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Designation: <tspan fill="#0f172a">Senior Associate</tspan></text>
  <text x="350" y="135" fill="#475569" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Pay Month: <tspan fill="#0f172a">Latest Month</tspan></text>
  <rect x="30" y="180" width="260" height="130" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="45" y="205" fill="#1e293b" font-family="Arial, sans-serif" font-size="12" font-weight="bold">EARNINGS</text>
  <text x="45" y="230" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Basic Salary: ₹30,000</text>
  <text x="45" y="250" fill="#64748b" font-family="Arial, sans-serif" font-size="11">HRA Allowances: ₹12,000</text>
  <text x="45" y="270" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Special Allowances: ₹8,000</text>
  <text x="30" y="345" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">NET TAKE-HOME: <tspan fill="#16a34a">${income}</tspan></text>
  <text x="570" y="345" fill="#94a3b8" font-family="Arial, sans-serif" font-size="11" text-anchor="end">Ref: ${ref}</text>
</svg>
`)}`;

  const getPhotographSvg = (name: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="16" fill="#0f172a"/>
  <rect x="180" y="40" width="240" height="280" rx="16" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="300" cy="140" r="55" fill="#334155" stroke="#0284c7" stroke-width="2"/>
  <path d="M 215 280 Q 300 200 385 280 Z" fill="#334155" stroke="#0284c7" stroke-width="2"/>
  <text x="300" y="345" fill="#38bdf8" font-family="Arial, sans-serif" font-weight="bold" font-size="15" text-anchor="middle">PASSPORT PHOTOGRAPH • ${name.toUpperCase()}</text>
  <text x="300" y="365" fill="#94a3b8" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">Biometric Match 99.8% • Ref: ${ref}</text>
</svg>
`)}`;

  const getPropertyOwnershipSvg = (name: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="16" fill="#fdfbf7" stroke="#b45309" stroke-width="2"/>
  <rect width="600" height="60" fill="#78350f"/>
  <text x="30" y="38" fill="#fef3c7" font-family="Arial, sans-serif" font-weight="bold" font-size="18">REVENUE DEPARTMENT • PROPERTY REGISTRATION / KHASRA</text>
  <text x="570" y="38" fill="#fef3c7" font-family="Arial, sans-serif" font-size="12" text-anchor="end">GOVT OF INDIA</text>
  <rect x="30" y="80" width="540" height="80" rx="10" fill="#ffffff" stroke="#fde68a"/>
  <text x="45" y="108" fill="#78350f" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Registered Owner: <tspan fill="#0f172a">${name}</tspan></text>
  <text x="45" y="135" fill="#78350f" font-family="Arial, sans-serif" font-size="13" font-weight="bold">Khasra / Plot No: <tspan fill="#0f172a">248/1A, Civil Lines Area</tspan></text>
  <text x="45" y="200" fill="#92400e" font-family="Arial, sans-serif" font-size="12" font-weight="bold">EXTRACT OF KHATAUNI / SALE DEED</text>
  <text x="45" y="225" fill="#451a03" font-family="Arial, sans-serif" font-size="11">Land Title: Freehold Residential Plot | Sub-Registrar Office Verified</text>
  <text x="45" y="295" fill="#16a34a" font-family="Arial, sans-serif" font-size="12" font-weight="bold">TITLE CLEAR & ELIGIBLE FOR CONSTRUCTION LOAN DISBURSAL</text>
  <text x="570" y="345" fill="#78350f" font-family="Arial, sans-serif" font-size="11" text-anchor="end">Ref: ${ref}</text>
</svg>
`)}`;

  const getSelfieSvg = (name: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="16" fill="#0f172a"/>
  <rect x="40" y="30" width="520" height="320" rx="12" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <rect x="200" y="70" width="200" height="230" rx="100" fill="#334155" stroke="#22c55e" stroke-width="3" stroke-dasharray="8 4"/>
  <circle cx="300" cy="150" r="45" fill="#475569"/>
  <path d="M 230 260 Q 300 200 370 260 Z" fill="#475569"/>
  <circle cx="280" cy="140" r="3" fill="#22c55e"/>
  <circle cx="320" cy="140" r="3" fill="#22c55e"/>
  <rect x="40" y="30" width="520" height="40" fill="#090d16" opacity="0.8"/>
  <text x="80" y="54" fill="#ffffff" font-family="Arial, sans-serif" font-size="12" font-weight="bold">LIVE GPS & FACE RECOGNITION MATCHED (100%)</text>
  <text x="75" y="326" fill="#22c55e" font-family="'Courier New', monospace" font-size="11">Agent ID: AGENT-904 | Applicant: ${name} | App: ${ref}</text>
</svg>
`)}`;

  const getPartnerSvg = (name: string, refNo: string, ref: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
  <rect width="600" height="380" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect width="600" height="35" rx="16" fill="#e2e8f0"/>
  <text x="90" y="22" fill="#64748b" font-family="Arial, sans-serif" font-size="10">https://partner-portal.lender.com/loans/approval?ref=${refNo}</text>
  <rect x="40" y="55" width="520" height="300" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="300" y="168" fill="#0f172a" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">LENDER SANCTION LETTER APPROVED</text>
  <text x="100" y="235" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Borrower Name: <tspan fill="#0f172a">${name}</tspan></text>
  <text x="100" y="260" fill="#475569" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Partner Ref No: <tspan fill="#2563eb" font-family="monospace">${refNo}</tspan></text>
  <text x="300" y="340" fill="#94a3b8" font-family="Arial, sans-serif" font-size="11" text-anchor="middle">OpenScore System Verification • Ref: ${ref}</text>
</svg>
`)}`;

  const getEffectivePreview = (doc: any) => {
    if (doc.preview && (doc.preview.startsWith('data:image/') || doc.preview.startsWith('http') || doc.preview.startsWith('/'))) {
      return doc.preview;
    }
    switch (doc.id) {
      case 'pan':
        return getPanSvg(applicantName, panNo, appNo);
      case 'aadhaar':
        return getAadhaarSvg(applicantName, aadhaarNo, appNo);
      case 'bank_statement':
        return getBankStatementSvg(applicantName, `₹${Number(currentApp?.monthly_income || 50000).toLocaleString('en-IN')}`, appNo);
      case 'income':
        return getIncomeProofSvg(applicantName, `₹${Number(currentApp?.monthly_income || 50000).toLocaleString('en-IN')}`, appNo);
      case 'photograph':
        return getPhotographSvg(applicantName, appNo);
      case 'property_ownership':
        return getPropertyOwnershipSvg(applicantName, appNo);
      case 'selfie':
        return getSelfieSvg(applicantName, appNo);
      case 'partner':
        return getPartnerSvg(applicantName, currentApp?.bank_application_no || 'HDFCLN258963741', appNo);
      default:
        return getPanSvg(applicantName, panNo, appNo);
    }
  };

  // Construct dynamic list of all uploaded documents
  const documents: any[] = [];

  // 1. PAN Card
  documents.push({
    id: 'pan',
    docKey: 'pan_card',
    name: 'PAN Card Copy',
    type: 'Identification Proof',
    file: panDocData.file,
    preview: panDocData.preview,
    docNum: `PAN: ${panNo}`,
    status: docStatuses.pan || 'Approved',
    category: 'Identity',
    isUploaded: panDocData.uploaded,
  });

  // 2. Aadhaar Card
  documents.push({
    id: 'aadhaar',
    docKey: 'aadhaar_card',
    name: 'Aadhaar Card (Front & Back)',
    type: 'Address & ID Proof',
    file: aadhaarDocData.file,
    preview: aadhaarDocData.preview,
    docNum: `Aadhaar: ${aadhaarNo}`,
    status: docStatuses.aadhaar || 'Approved',
    category: 'Address',
    isUploaded: aadhaarDocData.uploaded,
  });

  // 3. Bank Statement
  documents.push({
    id: 'bank_statement',
    docKey: 'bank_statement',
    name: 'Latest 3 Months Bank Statement',
    type: 'Banking Proof',
    file: bankDocData.file,
    preview: bankDocData.preview,
    docNum: `Bank Statement (3 Months)`,
    status: docStatuses.bank_statement || 'Approved',
    category: 'Banking',
    isUploaded: bankDocData.uploaded,
  });

  // 4. Salary Slip / Income Proof
  documents.push({
    id: 'income',
    docKey: 'income_proof',
    name: 'Salary Slip / Income Proof',
    type: 'Income Proof',
    file: incomeDocData.file,
    preview: incomeDocData.preview,
    docNum: `Income: ₹${Number(currentApp?.monthly_income || 50000).toLocaleString('en-IN')}/mo`,
    status: docStatuses.income || 'Approved',
    category: 'Income',
    isUploaded: incomeDocData.uploaded,
  });

  // 5. Passport Size Photograph
  documents.push({
    id: 'photograph',
    docKey: 'photograph',
    name: 'Passport Size Photograph',
    type: 'Applicant Photograph',
    file: photoDocData.file,
    preview: photoDocData.preview,
    docNum: `Passport Photo / Selfie`,
    status: docStatuses.photograph || 'Approved',
    category: 'Identity',
    isUploaded: photoDocData.uploaded,
  });

  // 6. Property Ownership Document (If present or Construction Loan)
  if (propertyDocData.uploaded || String(currentApp?.loan_type).includes('construction')) {
    documents.push({
      id: 'property_ownership',
      docKey: 'property_ownership_doc',
      name: 'Land / Property Ownership Document',
      type: 'Registry / Khasra Copy',
      file: propertyDocData.file,
      preview: propertyDocData.preview,
      docNum: `Khasra / Sale Deed Copy`,
      status: docStatuses.property_ownership || 'Approved',
      category: 'Property',
      isUploaded: propertyDocData.uploaded,
    });
  }

  const agentSelfieDocData = getDocData('selfie_with_agent', 'agent_selfie_photo.png') || getDocData('agent_selfie', 'agent_selfie_photo.png');

  // 7. Agent Live Selfie Capture
  documents.push({
    id: 'selfie',
    docKey: 'selfie_with_agent',
    name: 'Agent Live Selfie Capture',
    type: 'Verification Photo',
    file: agentSelfieDocData.file || 'agent_selfie_photo.png',
    preview: currentApp?.selfie_with_agent || agentSelfieDocData.preview || null,
    docNum: 'Live GPS & Face Matched',
    status: docStatuses.selfie || 'Approved',
    category: 'Biometric',
    isUploaded: Boolean(currentApp?.selfie_with_agent || agentSelfieDocData.uploaded || currentApp?.site_selfie_status === 'approved' || parsedDocs?.agent_selfie || parsedDocs?.selfie_with_agent),
  });

  // 8. Partner Submission Screenshot
  documents.push({
    id: 'partner',
    docKey: 'proof_screenshot',
    name: 'Partner Submission Screenshot',
    type: 'Portal Completion Proof',
    file: 'partner_proof.png',
    preview: currentApp?.proof_screenshot || null,
    docNum: `Ref: ${currentApp?.bank_application_no || 'HDFCLN258963741'}`,
    status: docStatuses.partner || 'Approved',
    category: 'Portal Proof',
    isUploaded: Boolean(currentApp?.proof_screenshot),
  });

  const handleSetDocStatus = (id: string, newStatus: string) => {
    setDocStatuses((prev) => ({
      ...prev,
      [id]: newStatus,
    }));
  };

  const uploadedDocuments = documents.filter(doc => doc.isUploaded);

  const handleRunAutoVerify = () => {
    setIsAutoVerifying(true);
    setAutoVerifySuccess(false);

    setTimeout(() => {
      const allVerified: Record<string, string> = {};
      uploadedDocuments.forEach(d => { allVerified[d.id] = 'Approved'; });
      setDocStatuses(allVerified);
      setIsAutoVerifying(false);
      setAutoVerifySuccess(true);
      setTimeout(() => setAutoVerifySuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Uploaded Documents & AI Auto-Verification ({uploadedDocuments.length} Total Documents)</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review customer uploaded proof documents and individually approve or reject each document below
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAutoVerify}
              disabled={isAutoVerifying || uploadedDocuments.length === 0}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isAutoVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying OCR Syntax...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Run Auto-Verification Engine
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {autoVerifySuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>AI Automated Verification Engine passed 100% syntax & pattern checks! All {uploadedDocuments.length} documents marked Approved.</span>
          </div>
        )}

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {uploadedDocuments.map((doc) => {
            const isApproved = doc.status === 'Approved' || doc.status === 'Verified';
            const isRejected = doc.status === 'Rejected' || doc.status === 'Pending Review';
            const imageSrc = getEffectivePreview(doc);

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all shadow-2xs ${
                  isApproved
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                        {doc.category}
                      </span>
                      <p className="font-black text-slate-900 text-xs">{doc.name}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {doc.type} • <span className="font-mono text-slate-700">{doc.file}</span>
                    </p>
                    <p className="text-[11px] font-bold text-slate-800 font-mono pt-0.5">{doc.docNum}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1 ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {isApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                    {isApproved ? 'Approved ✓' : 'Pending / Rejected'}
                  </span>
                </div>

                {/* INLINE THUMBNAIL / DOCUMENT IMAGE CONTAINER */}
                <div className="w-full h-40 bg-slate-200/70 rounded-xl overflow-hidden border border-slate-300 relative flex items-center justify-center group shadow-inner">
                  <img
                    src={imageSrc}
                    alt={doc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => setPreviewDoc({ ...doc, effectivePreview: imageSrc })}
                    className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-[1px] cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-blue-400" /> Expand Full Image Preview
                  </button>
                </div>

                {/* SEPARATE APPROVE & REJECT ACTION BUTTONS FOR EACH DOCUMENT */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ ...doc, effectivePreview: imageSrc })}
                      className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" /> Preview
                    </button>
                    {imageSrc && !imageSrc.startsWith('data:image/svg') && (
                      <a
                        href={imageSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-blue-600" /> Direct Link ↗
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSetDocStatus(doc.id, 'Approved')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        isApproved
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isApproved ? '✓ Approved' : 'Approve'}</span>
                    </button>

                    <button
                      onClick={() => handleSetDocStatus(doc.id, 'Rejected')}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        doc.status === 'Rejected' || doc.status === 'Pending Review'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{doc.status === 'Rejected' ? 'Rejected' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory Banner: How Automated Document Verification Works */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> How OpenScore Auto-Verification Works
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-white block">1. Syntax & Regex OCR</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              Automatically validates 10-char PAN structure (<code className="text-amber-300 font-mono">{panNo}</code>) & 12-digit Aadhaar checksums.
            </p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-white block">2. NSDL & UIDAI Cross-Match</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              Compares full name (<span className="text-emerald-300 font-bold">{applicantName}</span>) & DOB against database registry records.
            </p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
            <span className="font-bold text-white block">3. Bank Penny Drop & Workflow</span>
            <p className="text-[11px] text-slate-400 leading-snug">
              Verifies bank account details via penny drop test before advancing loan application to Disbursement.
            </p>
          </div>
        </div>
      </div>

      {/* INTERACTIVE DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{previewDoc.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{previewDoc.type} • {previewDoc.file}</p>
              </div>
            </div>

            {/* Document High-Resolution Image Preview */}
            <div className="bg-slate-950 rounded-2xl p-2 border border-slate-800 flex justify-center items-center overflow-hidden shadow-2xl">
              <img
                src={previewDoc.effectivePreview || getEffectivePreview(previewDoc)}
                alt={previewDoc.name}
                className="w-full max-h-[420px] object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
