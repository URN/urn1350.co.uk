import React from 'react';
import Link from 'next/link';

import { initialsOf } from './ui';

/** Members header: logo, link back to the public site, the signed-in person and the section tabs. */
export default function AccountBar({ tabs, current, onSelect, name, avatarUrl }) {
  return (
    <header className="acct-bar">
      <div className="acct-bar__top">
        <Link href="/" className="acct-bar__logo" aria-label="URN home">
          <img src="/content/images/logo.png" alt="" width="40" height="40" />
        </Link>
        <span className="acct-bar__title">Members</span>
        <span className="acct-bar__right">
          <Link href="/" className="acct-bar__site acct-hide-m">Back to the site</Link>
          <button type="button" className="acct-bar__me" aria-label="Your profile" onClick={() => onSelect('profile')}>
            <span className="acct-initials" aria-hidden="true">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : initialsOf(name)}
            </span>
            <span className="acct-hide-m">{name}</span>
          </button>
        </span>
      </div>
      {tabs.length > 1 ? (
        <nav className="acct-bar__tabs" aria-label="Account sections">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="acct-bar__tab"
              aria-current={tab.key === current ? 'page' : undefined}
              onClick={() => onSelect(tab.key)}>
              {tab.label}
              {tab.count ? <span className="acct-count">{tab.count}</span> : null}
            </button>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
