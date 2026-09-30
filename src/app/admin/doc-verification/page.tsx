'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight } from 'lucide-react';

export default function AdminDocVerificationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/applications');
  }, [router]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-2xs">
      <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <FileText className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-black text-slate-900">Redirecting to Main Loan Applications...</h2>
      <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
        Document verification is integrated directly inside each application's Documents tab on the main Loan Applications workspace.
      </p>
      <button
        onClick={() => router.push('/admin/applications')}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
      >
        <span>Go to Loan Applications Workspace</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
