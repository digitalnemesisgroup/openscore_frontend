'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileContainer from '@/components/MobileContainer';
import LoanHeader from '@/components/LoanHeader';
import { apiRequest } from '@/lib/api';
import { resolveTargetAppId } from '@/lib/loan-resume';
import { Upload, CheckCircle2, ArrowRight, RefreshCw, X, FileCheck, ShieldCheck } from 'lucide-react';

function ProofSubmissionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAppId = searchParams ? searchParams.get('id') : null;

  const [appId, setAppId] = useState<string | null>(null);
  const [bankAppNo, setBankAppNo] = useState('');
  const [proofRemarks, setProofRemarks] = useState('');
  
  // Real Screenshot Upload States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadApp() {
      const { appId: targetId } = await resolveTargetAppId(urlAppId, 'cash');
      if (targetId) setAppId(targetId);
    }
    loadApp();
  }, [urlAppId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setFileName(file.name);
    setFileSize(sizeStr);
    setUploaded(true);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploaded(false);
    setFileName('');
    setFileSize('');
    setPreviewUrl(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitProof = async () => {
    if (!appId) return;
    if (!bankAppNo.trim()) {
      setError('Please enter your Partner Bank Application / Ref No.');
      return;
    }
    if (!uploaded || (!previewUrl && !fileName)) {
      setError('Please upload your confirmation screenshot image or document.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequest(`/loan/apply/${appId}/proof`, {
        method: 'POST',
        body: JSON.stringify({
          bank_application_no: bankAppNo,
          bank_portal_status: 'Application Submitted',
          proof_remarks: proofRemarks || 'Application confirmation screenshot uploaded.',
          proof_screenshot: previewUrl || fileName || 'uploaded_proof_screenshot.png',
        }),
      });

      if (res.data) {
        router.push('/loan/apply/verification');
      }
    } catch (err: any) {
      setError(err.message || 'Proof submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileContainer>
      <LoanHeader title="Submit Application Proof" stepNumber={15} backHref="/loan/apply/partner-webview" />

      <div className="p-4 space-y-4 flex-1 pb-36 overflow-y-auto animate-in fade-in duration-300">
        <div>
          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
            Step 15 of 26
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Submit Application Proof</h1>
          <p className="text-xs text-slate-500 font-medium">Upload partner portal confirmation & bank application reference</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Hidden Real File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Proof Submission Card Form */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Submit Application Proof:
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Partner Bank Application / Ref No *
            </label>
            <input
              type="text"
              required
              value={bankAppNo}
              onChange={(e) => setBankAppNo(e.target.value)}
              placeholder="HDPL987654321"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Upload Confirmation Screenshot *
            </label>
            
            <div
              onClick={triggerFileInput}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                uploaded
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                  : 'bg-white border-dashed border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {uploaded && previewUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-300 shrink-0 bg-slate-100">
                      <img src={previewUrl} alt="Screenshot preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        uploaded ? 'bg-emerald-600 text-white' : 'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}
                    >
                      {uploaded ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-5 h-5" />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-900">
                      {uploaded ? 'Screenshot Uploaded ✓' : 'Click to Upload Screenshot'}
                    </h4>
                    {uploaded ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <p className="text-[11px] font-bold text-emerald-700 truncate max-w-[170px]">
                          {fileName} <span className="text-[10px] font-normal text-emerald-600">({fileSize})</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-medium">Select real image or PDF confirmation screenshot</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {uploaded ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerFileInput();
                        }}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-xs hover:bg-purple-700"
                    >
                      Upload
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          onClick={handleSubmitProof}
          disabled={loading || !bankAppNo || !uploaded}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-[0.99]"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Proof...</span>
            </>
          ) : (
            <>
              <span>Submit Proof & Start 3-Min Validation →</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </MobileContainer>
  );
}

export default function ProofSubmissionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading Proof Submission...</div>}>
      <ProofSubmissionContent />
    </Suspense>
  );
}

