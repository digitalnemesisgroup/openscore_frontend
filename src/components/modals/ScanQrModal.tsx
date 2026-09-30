'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Scan, X, RefreshCw, AlertCircle } from 'lucide-react';

interface ScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualInput: () => void;
}

export default function ScanQrModal({ isOpen, onClose, onManualInput }: ScanQrModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'initializing' | 'active' | 'denied' | 'unsupported'>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setCameraState('initializing');
    setErrorMessage('');

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setErrorMessage('Camera API is not supported on this browser.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
          audio: false,
        });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraState('denied');
      setErrorMessage(err.message || 'Camera permission was denied or camera is currently unavailable.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl relative border border-slate-800 text-center animate-in slide-in-from-bottom duration-300 ease-out">
        {/* Top Sheet Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto -mt-1 mb-1" />

        <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h3 className="text-base font-black text-white flex items-center justify-center gap-2">
            <Scan className="w-5 h-5 text-purple-400" /> Scan Any UPI QR Code
          </h3>
          <p className="text-xs text-slate-400">Align QR code within live camera frame to pay</p>
        </div>

        {/* Live Viewfinder Frame */}
        <div className="w-56 h-56 mx-auto bg-slate-950 rounded-3xl border-2 border-purple-500/60 relative flex items-center justify-center overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover rounded-2xl ${cameraState === 'active' ? 'block' : 'hidden'}`}
          />

          {cameraState === 'initializing' && (
            <div className="flex flex-col items-center gap-2 p-4 text-slate-400">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-xs font-bold">Initializing camera feed...</span>
            </div>
          )}

          {(cameraState === 'denied' || cameraState === 'unsupported') && (
            <div className="flex flex-col items-center justify-center p-4 space-y-2 text-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
              <span className="text-xs font-bold text-rose-200">Camera Access Issue</span>
              <p className="text-[11px] text-slate-400 leading-tight">{errorMessage || 'Please allow camera permission in browser settings.'}</p>
              <button
                onClick={startCamera}
                className="mt-1 px-3 py-1 bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry Camera
              </button>
            </div>
          )}

          {/* Scanner Reticle & Scanning Line overlay when active */}
          {cameraState === 'active' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-44 h-44 border-2 border-dashed border-purple-400/90 rounded-2xl relative shadow-2xl">
                {/* Four Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400" />
                {/* Animated Laser Scan Bar */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-lg shadow-purple-500" />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            handleClose();
            onManualInput();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all active:scale-[0.99]"
        >
          Enter UPI ID Manually Instead
        </button>
      </div>
    </div>
  );
}
