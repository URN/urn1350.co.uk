import React from 'react';

export function PlayIcon({ size = 20, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 3 L21 12 L5 21 Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 20, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="4" width="5" height="16" fill="currentColor" />
      <rect x="14" y="4" width="5" height="16" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon({ size = 18, className, stroke = 3 }) {
  return (
    <svg className={`arrow ${className || ''}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M6 24 H42 M26 8 L42 24 L26 40" fill="none" stroke="currentColor" strokeWidth={stroke} />
    </svg>
  );
}

export function Spinner({ size = 22 }) {
  return (
    <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeDasharray="38 60" />
    </svg>
  );
}

export function ExternalIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 17 L17 7 M9 7 H17 V15" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
