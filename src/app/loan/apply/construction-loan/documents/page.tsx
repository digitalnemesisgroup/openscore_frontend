'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { Hammer, FileCheck, Upload, ArrowRight, RefreshCw, CheckCircle2, X } from 'lucide-react';

interface DocItemState {
  uploaded: boolean;
  name: string;
  size: string;
  preview: string | null;
}

type ConstructionDocKey = 'pan_card' | 'aadhaar_address_proof' | 'passport_photo' | 'property_ownership_doc';

function ConstructionDocumentsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get('id');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRefs = useRef<{ [key in ConstructionDocKey]?: HTMLInputElement | null }>({});

  const [docs, setDocs] = useState<Record<ConstructionDocKey, DocItemState>>({
    pan_card: { uploaded: true, name: 'PAN_Card_Verified.pdf', size: '1.2 MB', preview: null },
    aadhaar_address_proof: { uploaded: true, name: 'Aadhaar_Address_Proof.pdf', size: '2.4 MB', preview: null },
    passport_photo: { uploaded: true, name: 'Applicant_Photo.jpg', size: '450 KB', preview: null },
    property_ownership_doc: { uploaded: true, name: 'Land_Registry_Khasra.pdf', size: '3.8 MB', preview: null },
  });

  const handleFileSelect = (key: ConstructionDocKey, e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveDoc = (key: ConstructionDocKey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
    setDocs((prev) => ({
      ...prev,
      [key]: { uploaded: false, name: '', size: '', preview: null },
    }));
  };

  const triggerFileInput = (key: ConstructionDocKey) => {
    fileInputRefs.current[key]?.click();
  };

  const handleSubmitDocs = async () => {
    setSubmitting(true);
    setError('');

    const documentsPayload: Record<string, any> = {};
    Object.entries(docs).forEach(([key, val]) => {
      documentsPayload[key] = val.uploaded
        ? { uploaded: true, name: val.name, size: val.size }
        : true;
    });

    try {
      if (appId) {
        await apiRequest(`/loan/apply/${appId}/documents`, {
          method: 'POST',
          body: JSON.stringify({
            documents: documentsPayload,
          }),
        });
      }
      router.push(`/loan/apply/construction-loan/fee-payment${appId ? `?id=${appId}` : ''}`);
    } catch (err: any) {
      setError(err.message || 'Error submitting construction documents.');
    } finally {
      setSubmitting(false);
    }
  };

  const docList: { key: ConstructionDocKey; label: string; desc: string; accept: string }[] = [
    {
      key: 'pan_card',
      label: '1. PAN Card',
      desc: 'Government issued PAN card for identity & tax verification',
      accept: 'image/*,.pdf',
    },
    {
      key: 'aadhaar_address_proof',
      label: '2. Aadhaar Card / Address Proof',
      desc: 'Aadhaar front/back, Passport or Voter ID for address verification',
      accept: 'image/*,.pdf',
    },
    {
      key: 'passport_photo',
      label: '3. Passport Size Photograph',
      desc: 'Recent passport photo or clear color selfie of applicant',
      accept: 'image/*',
    },
    {
      key: 'property_ownership_doc',
      label: '4. Land / Property Ownership Document',
      desc: 'Khasra / Khatauni / Registered Sale Deed / Property Registry Copy',
      accept: '.pdf,image/*',
    },
  ];

  const totalUploaded = Object.values(docs).filter((d) => d.uploaded).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold">
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Construction Loan Customer Documents</span>
        </div>
        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
          Step 4 of 26
        </span>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
            <FileCheck className="w-4 h-4" /> Customer Documents Required
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            {totalUploaded} of {docList.length} Uploaded
          </span>
        </div>

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
                      ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
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
                            isUploaded ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {isUploaded ? <CheckCircle2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-slate-900 truncate">{doc.label}</h4>
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
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition-colors"
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
      </div>

      <button
        onClick={handleSubmitDocs}
        disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
      >
        {submitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Verifying Documents...</span>
          </>
        ) : (
          <>
            <span>Proceed to Processing Fee Payment</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}

export default function ConstructionDocumentsPage() {
  return (
    <MobileContainer>
      <LoanHeader title="Construction Documents" stepNumber={4} backHref="/loan/apply/construction-loan" />
      <div className="p-4 flex-1 pb-36 overflow-y-auto">
        <Suspense fallback={<div className="p-4 text-xs font-bold text-slate-500">Loading documents...</div>}>
          <ConstructionDocumentsForm />
        </Suspense>
      </div>
    </MobileContainer>
  );
}
