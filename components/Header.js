import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Settings from '../settings.json';
import { ArrowIcon, PlayIcon, PauseIcon } from './Icons';
import { useStation } from '../context/StationContext';
import { useStreamPlayer } from '../context/StreamPlayerContext';
import { useTheme } from '../context/ThemeContext';
import useDialog from '../hooks/useDialog';

const NAV = [
  { label: 'Schedule', href: '/schedule' },
  { label: 'Podcasts', href: '/podcasts' },
  { label: 'Get involved', href: '/pages/get-involved' },
  { label: 'About', href: '/pages/about' },
];
const MENU = [...NAV, { label: 'Committee', href: '/pages/committee' }];

export const SOCIALS = [
  { label: 'Instagram', href: `https://instagram.com/${Settings.twitter}` },
  { label: 'Spotify', href: `https://open.spotify.com/playlist/${Settings.spotifyPlaylist}` },
];

/** Current top-level section for nav highlighting; Committee counts as About. */
function isActive(asPath, href) {
  const path = asPath.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (href === '/pages/about') return path === href || path.startsWith('/pages/committee');
  return href === '/podcasts' ? path.startsWith('/podcasts') : path === href;
}

export default function Header() {
  const router = useRouter();
  const { show, leftText, ready } = useStation();
  const { isPlaying, togglePlay } = useStreamPlayer();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const panel = useDialog(open, close);

  // Close whenever navigation happens.
  useEffect(() => {
    router.events.on('routeChangeComplete', close);
    return () => router.events.off('routeChangeComplete', close);
  }, [router.events]);

  const subline = ready && show ? (
    <>
      <span className="menu__show">{show.name}</span>
      <span className="menu__left">{leftText}</span>
    </>
  ) : (
    'Live from the Portland Building'
  );

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="site-header__nav" aria-label="Main">
        <Link href="/" className="site-header__logo" aria-label="URN, University Radio Nottingham. Home">
          <img src={`${Settings.cdnUrl}/content/images/logo.png`} alt="" width="44" height="44" />
        </Link>
        <div className="site-header__links">
          {NAV.map((l) => {
            const active = isActive(router.asPath, l.href);
            return (
              <Link key={l.href} href={l.href} className="navlink" aria-current={active ? 'page' : undefined}>
                {l.label}
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen(true)}
        >
          <span className="menu-btn__bars" aria-hidden="true"><i /><i /></span>
          Menu
        </button>
      </nav>

      <div
        id="site-menu"
        ref={panel}
        className={`menu ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="menu__top">
          <img src={`${Settings.cdnUrl}/content/images/logo.png`} alt="" width="44" height="44" />
          <button type="button" className="menu-btn" onClick={close}>
            <span className="menu-btn__x" aria-hidden="true"><i /><i /></span>
            Close
          </button>
        </div>
        <ul className="menu__list">
          <li style={{ '--i': 0 }}>
            <button type="button" className="menu__row menu__row--live" onClick={() => { togglePlay(); setOpen(false); }}>
              <span className="menu__label">
                {isPlaying ? 'Pause' : 'Listen live'}
                <span className="menu__sub"><span className="live-dot" aria-hidden="true" />{subline}</span>
              </span>
              <span className="menu__play" aria-hidden="true">{isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}</span>
            </button>
          </li>
          {MENU.map((l, i) => {
            const current = router.asPath.split(/[?#]/)[0].replace(/\/$/, '') === l.href;
            return (
              <li key={l.href} style={{ '--i': i + 1 }}>
                <Link href={l.href} className="menu__row" aria-current={current ? 'page' : undefined}>
                  <span className="menu__label">{l.label}</span>
                  <ArrowIcon size={44} stroke={2.5} />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="menu__foot">
          {SOCIALS.map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
          ))}
          <Link href="/pages/competitions">Competition terms</Link>
          <button type="button" className="textbtn" onClick={toggle}>
            {theme === 'day' ? 'Switch to night look' : 'Switch to purple look'}
          </button>
        </div>
      </div>
    </header>
  );
}
