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

export function SpotifyIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <g fill="none" stroke="var(--raised)" strokeLinecap="round">
        <path d="M5.8 9.2 C10.3 7.8 15.2 8.3 18.6 10.4" strokeWidth="2.2" />
        <path d="M6.6 12.6 C10.4 11.5 14.4 11.9 17.5 13.7" strokeWidth="1.9" />
        <path d="M7.4 15.7 C10.5 14.9 13.6 15.2 16.2 16.7" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function AppleMusicIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor" />
      <path d="M9 17.2 V7.6 L17 6 V15.4" fill="none" stroke="var(--raised)" strokeWidth="1.8" strokeLinejoin="round" />
      <ellipse cx="7.4" cy="17.2" rx="2" ry="1.6" fill="var(--raised)" />
      <ellipse cx="15.4" cy="15.4" rx="2" ry="1.6" fill="var(--raised)" />
    </svg>
  );
}
