'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number; // 1, 2, 3, 4
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: 'Details' },
    { number: 2, label: 'Eligibility' },
    { number: 3, label: 'Offer' },
    { number: 4, label: 'Documents' },
  ];

  return (
    <div className="w-full bg-slate-50 py-3 px-6 border-b border-slate-100">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-4 right-4 top-4 h-[2px] bg-slate-200 -z-0" />

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : step.number}
              </div>
              <span
                className={`text-[11px] mt-1 font-medium ${
                  isCurrent || isCompleted ? 'text-blue-700 font-semibold' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

