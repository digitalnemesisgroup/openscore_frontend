'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

export default function AdminCommunicationPage() {
  const [msg, setMsg] = useState('');

  return (
    <div className="space-y-5">
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div>
        <h2 className="text-xl font-black text-slate-900">Communication Center</h2>
        <p className="text-xs text-slate-500 font-medium">Send SMS, Email OTP & Push Notification updates to borrowers.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Broadcast Notification / Message</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Applicant / User Mobile</label>
            <input type="text" placeholder="9876543210" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Message Content</label>
            <textarea rows={3} placeholder="Enter SMS or Notification message..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"></textarea>
          </div>
          <button
            onClick={() => setMsg('Notification broadcast dispatched successfully!')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send Direct Message
          </button>
        </div>
      </div>
    </div>
  );
}

