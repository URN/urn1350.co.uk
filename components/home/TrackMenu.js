import React, { useEffect, useRef, useState } from 'react';

import { SpotifyIcon, AppleMusicIcon } from '../Icons';

function services(track) {
  const q = encodeURIComponent([track.artist, track.title].filter(Boolean).join(' '));
  return [
    { name: 'Spotify', Icon: SpotifyIcon, href: `https://open.spotify.com/search/${q}` },
    { name: 'Apple Music', Icon: AppleMusicIcon, href: `https://music.apple.com/gb/search?term=${q}` },
  ];
}

// Three-dot menu that opens the playing track in a streaming service.
export default function TrackMenu({ track }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const button = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // A new track closes any open menu.
  useEffect(() => setOpen(false), [track.title, track.artist]);

  return (
    <div className="trackmenu" ref={root}>
      <button
        type="button"
        ref={button}
        className="trackmenu__btn"
        aria-label="Open this track in a music app"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </button>
      {open ? (
        <ul className="trackmenu__list">
          {services(track).map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                <s.Icon size={20} />
                <span>Open in {s.name}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
