'use client';

import React from 'react';

interface CibilGaugeIconProps {
  type: 'none' | 'low' | 'high';
}

export default function CibilGaugeIcon({ type }: CibilGaugeIconProps) {
  const isNone = type === 'none';
  const isLow = type === 'low';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          {/* Gauge Arc Background */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Red Zone (Zero / Without CIBIL) */}
          <path
            d="M 10 50 A 40 40 0 0 1 30 28"
            fill="none"
            stroke="#ef4444"
            strokeWidth={isNone ? '14' : '10'}
            strokeLinecap="round"
            className={isNone ? 'opacity-100' : 'opacity-40'}
          />

          {/* Orange Zone (Low CIBIL) */}
          <path
            d="M 30 28 A 40 40 0 0 1 50 14"
            fill="none"
            stroke="#f97316"
            strokeWidth={isLow ? '14' : '10'}
            strokeLinecap="round"
            className={isLow ? 'opacity-100' : 'opacity-40'}
          />

          {/* Green Zone (High CIBIL) */}
          <path
            d="M 50 14 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#10b981"
            strokeWidth={type === 'high' ? '14' : '10'}
            strokeLinecap="round"
            className={type === 'high' ? 'opacity-100' : 'opacity-40'}
          />

          {/* Needle Pointer */}
          {isNone ? (
            /* Without CIBIL Pointer: Rotated Far Left towards Red Zone */
            <g transform="translate(50, 50) rotate(-70)">
              <polygon points="0,-34 -4,0 4,0" fill="#dc2626" />
              <circle cx="0" cy="0" r="5" fill="#991b1b" />
            </g>
          ) : isLow ? (
            /* Low CIBIL Pointer: Rotated Left towards Orange Zone */
            <g transform="translate(50, 50) rotate(-35)">
              <polygon points="0,-34 -4,0 4,0" fill="#ea580c" />
              <circle cx="0" cy="0" r="5" fill="#c2410c" />
            </g>
          ) : (
            /* High CIBIL Pointer: Rotated Right towards Green Zone */
            <g transform="translate(50, 50) rotate(55)">
              <polygon points="0,-34 -4,0 4,0" fill="#059669" />
              <circle cx="0" cy="0" r="5" fill="#047857" />
            </g>
          )}
        </svg>

        {/* Small Center Score Indicator */}
        <span
          className={`absolute bottom-0 text-[8px] font-black tracking-tighter ${
            isNone ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-emerald-600'
          }`}
        >
          {isNone ? '0-300' : isLow ? '300-620' : '750-900'}
        </span>
      </div>
    </div>
  );
}
