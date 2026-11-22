import React from 'react';

import { londonToday, shiftDateKey, RETENTION_DAYS } from '../../lib/recordings.mjs';

export const clock = (h) => `${String(h % 24).padStart(2, '0')}:00`;

function fmt(dateKey, opts) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}
export const longDate = (key) => fmt(key, { weekday: 'long', day: 'numeric', month: 'long' });
export const dateParts = (key) => ({
  dow: fmt(key, { weekday: 'short' }),
  day: String(Number(key.slice(8, 10))),
  mon: fmt(key, { month: 'short' }),
});

export const timeRange = (ep) => `${clock(ep.startHour)}–${clock(ep.endHour)}`;
export const hoursLabel = (n) => `${n} ${n === 1 ? 'hour' : 'hours'}`;

/** The last day a recording is still on the server: tell people the day before. */
export const isLastDay = (dateKey) => dateKey === shiftDateKey(londonToday(), -RETENTION_DAYS);

export function PlayIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ marginLeft: 2 }}>
      <path d="M5 3 L21 12 L5 21 Z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="4" width="5" height="16" fill="currentColor" />
      <rect x="14" y="4" width="5" height="16" fill="currentColor" />
    </svg>
  );
}

export function DownloadIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3 V15 M6 10 L12 16 L18 10 M4 20 H20" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
