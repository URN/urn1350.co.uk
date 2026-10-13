import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import { PlayIcon, PauseIcon, Spinner } from './Icons';
import { useStation } from '../context/StationContext';
import { useStreamPlayer } from '../context/StreamPlayerContext';
import { useMessage, MESSAGE_MAX } from '../hooks/useMessage';
import useDialog from '../hooks/useDialog';

function trackText(track) {
  if (!track) return '';
  return [track.title, track.artist].filter(Boolean).join(' · ');
}

export default function PlayerBar() {
  const router = useRouter();
  const { show, leftText, ready, track } = useStation();
  const { isPlaying, isLoading, error, togglePlay } = useStreamPlayer();
  const msg = useMessage();
  const [sheet, setSheet] = useState(false);
  const sheetInput = useRef(null);

  const title = ready && show ? show.name : 'URN 1350';
  const label = isLoading ? 'Connecting to live stream' : isPlaying ? 'Pause live stream' : 'Play live stream';
  const np = trackText(track);

  // Ticker and bar copy for assistive tech should not re-announce on every scroll tick.
  const placeholder = ready && show ? `Message ${show.name} in the studio` : 'Message the studio';

  const closeSheet = () => {
    setSheet(false);
    msg.reset();
  };
  const dialog = useDialog(sheet, closeSheet, sheetInput);

  useEffect(() => {
    const done = () => setSheet(false);
    router.events.on('routeChangeStart', done);
    return () => router.events.off('routeChangeStart', done);
  }, [router.events]);

  const openMessage = (e) => {
    const field = router.pathname === '/' && document.getElementById('m-msg');
    if (field) {
      e.preventDefault();
      document.getElementById('message').scrollIntoView({ block: 'center' });
      field.focus({ preventScroll: true });
    } else {
      setSheet(true);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    await msg.send('');
  };

  const sent = msg.status === 'sent';

  return (
    <>
      <div className="player" role="region" aria-label="Live player">
        <button type="button" className={`player__play ${isPlaying ? 'is-playing' : ''}`} onClick={togglePlay} aria-label={label}>
          {isLoading ? <Spinner size={24} /> : isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={22} className="nudge" />}
        </button>

        <div className="player__info">
          <span className="player__title">
            <span className="badge badge--live"><span className="live-dot live-dot--white" aria-hidden="true" />Live</span>
            <span className="player__show">{title}</span>
            {ready && show ? <span className="player__left">· {leftText}</span> : null}
          </span>
          {error ? (
            <span className="player__error" role="alert">{error}</span>
          ) : np ? (
            <span className="ticker" aria-label={`Now playing: ${np}`}>
              <span className="ticker__track" aria-hidden="true">
                <span>Now playing: {np}</span>
                <span>Now playing: {np}</span>
              </span>
            </span>
          ) : (
            <span className="player__tag">1350 · Your student sound</span>
          )}
        </div>

        <div className="player__message">
          {sent ? (
            <div className="player__sent" role="status">
              <span><strong>Sent to the studio.</strong> Listen out for it.</span>
              <button type="button" className="btn btn--sm btn--ghost-ink" onClick={msg.reset}>New message</button>
            </div>
          ) : (
            <form onSubmit={submit} className="player__form">
              <label htmlFor="pb-msg" className="sr-only">Message the show</label>
              <input
                id="pb-msg"
                type="text"
                className="field field--pill"
                maxLength={MESSAGE_MAX}
                value={msg.text}
                onChange={(e) => msg.setText(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
              />
              <button type="submit" className="btn btn--send" disabled={!msg.text.trim() || msg.status === 'sending'}>
                {msg.status === 'sending' ? 'Sending' : 'Send'}
              </button>
            </form>
          )}
          {msg.status === 'error' ? <p className="player__err" role="alert">{msg.error}</p> : null}
        </div>

        <button type="button" className="btn btn--paper player__msgbtn" onClick={openMessage}>Message</button>
      </div>

      {sheet ? (
        <div className="sheet" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="sheet-h">
          <button type="button" className="sheet__scrim" aria-label="Close" tabIndex={-1} onClick={closeSheet} />
          <div className="sheet__panel">
            <div className="sheet__head">
              <h2 id="sheet-h">Message {ready && show ? show.name : 'the studio'}</h2>
              <button type="button" className="textbtn" onClick={closeSheet}>Close</button>
            </div>
            <p className="sheet__sub">Goes straight to the studio screen, live on air.</p>
            {sent ? (
              <div className="notice notice--ok" role="status">
                <span><strong>Sent.</strong> Listen out for it on air.</span>
                <button type="button" className="btn btn--sm btn--ghost-ink" onClick={msg.reset}>New message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="sheet__form">
                <label htmlFor="sheet-msg" className="sr-only">Your message</label>
                <textarea
                  id="sheet-msg"
                  ref={sheetInput}
                  className="field"
                  rows={3}
                  maxLength={MESSAGE_MAX}
                  value={msg.text}
                  onChange={(e) => msg.setText(e.target.value)}
                  placeholder={placeholder}
                />
                <div className="sheet__row">
                  <label htmlFor="sheet-name" className="caps">From</label>
                  <input id="sheet-name" type="text" className="field" value={msg.name} onChange={(e) => msg.setName(e.target.value)} placeholder="Name (optional)" maxLength={30} autoComplete="given-name" />
                </div>
                {msg.status === 'error' ? <p className="notice notice--err" role="alert">{msg.error}</p> : null}
                <button type="submit" className="btn btn--lime btn--lg" disabled={!msg.text.trim() || msg.status === 'sending'}>
                  {msg.status === 'sending' ? 'Sending' : 'Send to the studio'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
