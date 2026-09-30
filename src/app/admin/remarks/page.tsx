'use client';

import React from 'react';
import { CheckCheck } from 'lucide-react';

export default function AdminRemarksPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Remarks & Standard Verification Templates</h2>
        <p className="text-xs text-slate-500 font-medium">Standardized notes for approval, rejection, and document requests.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Standard Verification Templates</h3>
        <div className="space-y-2 text-xs">
          {[
            { title: 'Documents Verified & Clean', note: 'All submitted documents (Aadhaar, PAN, Bank Statement) verified against credit criteria.' },
            { title: 'Low Credit Vintage Rejection', note: 'Applicant fails minimum credit vintage requirement. 3-day reapply lock activated.' },
            { title: 'Additional Proof Required', note: 'Please upload 6 months bank statement showing salary credits for final approval.' },
          ].map((t, i) => (
            <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <p className="font-bold text-slate-900">{t.title}</p>
              <p className="text-slate-600 text-[11px]">{t.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

