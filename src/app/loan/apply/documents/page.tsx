'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import { Upload, CheckCircle, FileText, ArrowRight, RefreshCw, X, Image as ImageIcon, FileCheck } from 'lucide-react';

interface DocItemState {
  uploaded: boolean;
  name: string;
  size: string;
  preview: string | null;
}

type DocKey = 'pan_card' | 'aadhaar_front' | 'aadhaar_back' | 'photograph';

function DocumentUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appId, setAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRefs = useRef<{ [key in DocKey]?: HTMLInputElement | null }>({});

  const [docs, setDocs] = useState<Record<DocKey, DocItemState>>({
    pan_card: { uploaded: false, name: '', size: '', preview: null },
    aadhaar_front: { uploaded: false, name: '', size: '', preview: null },
    aadhaar_back: { uploaded: false, name: '', size: '', preview: null },
    photograph: { uploaded: false, name: '', size: '', preview: null },
  });

  useEffect(() => {
    async function loadApp() {
      const { appId: targetId } = await resolveTargetAppId(urlAppId, 'cash');
      if (targetId) setAppId(targetId);
    }
    loadApp();
  }, [urlAppId]);

  const handleFileSelect = (key: DocKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string;
        setDocs((prev) => ({
          ...prev,
          [key]: {
            uploaded: true,
            name: file.name,
            size: sizeStr,
            preview: previewUrl,
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setDocs((prev) => ({
        ...prev,
        [key]: {
          uploaded: true,
          name: file.name,
          size: sizeStr,
          preview: null,
        },
      }));
    }
  };

  const handleRemoveDoc = (key: DocKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
    setDocs((prev) => ({
      ...prev,
      [key]: { uploaded: false, name: '', size: '', preview: null },
    }));
  };

  const triggerFileInput = (key: DocKey) => {
    fileInputRefs.current[key]?.click();
  };

  const handleSubmit = async () => {
    if (!appId) {
      setError('No active loan application found. Please start eligibility check first.');
      return;
    }

    setLoading(true);
    setError('');

    // Prepare JSON payload for documents
    const documentsPayload: Record<string, any> = {};
    Object.entries(docs).forEach(([key, val]) => {
      documentsPayload[key] = val.uploaded
        ? { uploaded: true, name: val.name, size: val.size, preview: val.preview || null }
        : true; // Default true for mock compatibility if not attached
    });

    try {
      const res = await apiRequest(`/loan/apply/${appId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ documents: documentsPayload }),
      });

      if (res.data) {
        router.push('/loan/apply/fee-payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit documents.');
    } finally {
      setLoading(false);
    }
  };

  const docList: { key: DocKey; label: string; desc: string; accept: string }[] = [
    { key: 'pan_card', label: 'PAN Card Upload', desc: 'Clear front photo of PAN card', accept: 'image/*,.pdf' },
    { key: 'aadhaar_front', label: 'Aadhaar Card (Front)', desc: 'Clear front photo with name & photo', accept: 'image/*,.pdf' },
    { key: 'aadhaar_back', label: 'Aadhaar Card (Back)', desc: 'Clear back photo with address & barcode', accept: 'image/*,.pdf' },
    { key: 'photograph', label: 'Applicant Live Photo / Selfie', desc: 'Clear selfie or portrait photo', accept: 'image/*' },
  ];

  const totalUploaded = Object.values(docs).filter((d) => d.uploaded).length;

  return (
    <MobileContainer>
      <LoanHeader title="Document Upload" stepNumber={5} backHref="/loan/apply/indicative-calculator" />

      <div className="p-4 space-y-4 flex-1 pb-36 overflow-y-auto animate-in fade-in duration-300">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
              KYC Verification
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {totalUploaded} of {docList.length} Uploaded
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">Upload Documents</h1>
          <p className="text-xs text-slate-500 font-medium">Select real files from your device to complete verification</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {docList.map((doc) => {
            const item = docs[doc.key];
            const isUploaded = item.uploaded;

            return (
              <div key={doc.key} className="relative">
                <input
                  type="file"
                  ref={(el) => {
                    fileInputRefs.current[doc.key] = el;
                  }}
                  accept={doc.accept}
                  className="hidden"
                  onChange={(e) => handleFileSelect(doc.key, e)}
                />

                <div
                  onClick={() => triggerFileInput(doc.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isUploaded
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isUploaded && item.preview ? (
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-300 flex-shrink-0 bg-slate-100">
                          <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                            isUploaded ? 'bg-emerald-600 text-white' : 'bg-purple-50 text-purple-600 border border-purple-100'
                          }`}
                        >
                          {isUploaded ? <CheckCircle className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-black text-slate-900 truncate">{doc.label}</h3>
                        {isUploaded ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <FileCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <p className="text-[11px] font-bold text-emerald-700 truncate max-w-[180px]">
                              {item.name} <span className="text-[10px] font-normal text-emerald-600">({item.size})</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 font-medium truncate">{doc.desc}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      {isUploaded ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerFileInput(doc.key);
                            }}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveDoc(doc.key, e)}
                            className="p-1 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-xs hover:bg-purple-700 transition-colors"
                        >
                          Upload
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Documents...</span>
            </>
          ) : (
            <>
              <span>Proceed to Processing Fee Payment →</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </MobileContainer>
  );
}

export default function DocumentUploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading Documents...</div>}>
      <DocumentUploadContent />
    </Suspense>
  );
}
