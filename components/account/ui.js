import React from 'react';

import { ArrowIcon } from '../Icons';

export function Tick({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12 L10 18 L20 6" fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 8 L12 16 L20 8" fill="none" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export function Heading({ children, lede }) {
  return (
    <div className="acct-head">
      <h1 className="acct-h1">{children}</h1>
      {lede ? <p className="acct-lede">{lede}</p> : null}
    </div>
  );
}

/** Success banner (status) or failure banner (alert). */
export function Notice({ message, error, onDismiss }) {
  if (error) {
    return (
      <div role="alert" className="acct-notice acct-notice--error">
        <span>{error}</span>
      </div>
    );
  }
  if (!message) return null;
  return (
    <div role="status" className="acct-notice">
      <span className="acct-notice__text">
        <Tick color="var(--ext)" />
        {message}
      </span>
      {onDismiss ? (
        <button type="button" onClick={onDismiss}>Dismiss</button>
      ) : null}
    </div>
  );
}

export function BackLink({ onClick, children }) {
  return (
    <button type="button" className="acct-back" onClick={onClick}>
      <ArrowIcon size={18} stroke={3.5} />
      {children}
    </button>
  );
}

export function Field({ id, label, hint, hintBad, children }) {
  return (
    <div className="acct-field">
      <label htmlFor={id} className="acct-label">{label}</label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className={`acct-hint${hintBad ? ' acct-hint--bad' : ''}`}>{hint}</span>
      ) : null}
    </div>
  );
}

export function Select({ id, label, value, onChange, children, small }) {
  return (
    <span className="acct-selectwrap">
      {label ? <label htmlFor={id} className="acct-sr">{label}</label> : null}
      <select id={id} className="acct-select" value={value} onChange={onChange} style={small ? { minHeight: 48 } : undefined}>
        {children}
      </select>
      <Chevron />
    </span>
  );
}

export function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
