import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import PixelHeading from '../PixelHeading';
import TrackMenu from './TrackMenu';
import { PlayIcon, PauseIcon, Spinner } from '../Icons';
import { useStation } from '../../context/StationContext';
import { useStreamPlayer } from '../../context/StreamPlayerContext';
import { useMessage, MESSAGE_MAX } from '../../hooks/useMessage';
import { formatRange, formatMinutes, SHOW_TAG_LABELS } from '../../utils/schedule';

function showTag(show) {
  const kind = show.type || '';
  const label = SHOW_TAG_LABELS[kind];
  return label ? { label, kind } : null;
}

const KINDS = {
  Request: 'What should they play next?',
  'Shout-out': 'Shout-out to…',
  Question: 'Ask the DJ anything',
  'Score update': "Who's winning? Send us the score",
};

function Meter({ active }) {
  const bars = [0, 1, 2, 3];
  return (
    <span className={`meter ${active ? 'is-active' : ''}`} aria-hidden="true">
      {bars.map((b) => (
        <span key={b} style={{ '--b': b }} />
      ))}
    </span>
  );
}

export default function LiveHero() {
  const { ready, show, pct, left, leftText, upNext, track, history } = useStation();
  const { isPlaying, isLoading, error, togglePlay } = useStreamPlayer();
  const msg = useMessage();
  const [kind, setKind] = useState('Request');
  const input = useRef(null);
  const playBtn = useRef(null);
  // If the schedule never loads, still reveal the heading rather than leaving it blank.
  const [waited, setWaited] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const kinds = ['Request', 'Shout-out', 'Question'].concat(show && show.tag === 'Sport' ? ['Score update'] : []);
  const activeKind = kinds.includes(kind) ? kind : kinds[0];

  const title = ready && show ? show.name : 'URN 1350';
  const live = Boolean(ready && show);

  useEffect(() => {
    if (msg.status !== 'sent') return undefined;
    const t = setTimeout(() => msg.reset(), 9000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg.status]);

  const playText = isLoading ? 'Connecting…' : isPlaying ? 'Pause' : 'Listen live';
  const playLabel = isLoading ? 'Connecting to live stream' : isPlaying ? 'Pause live stream' : 'Play live stream';
  // Animate the pill's width between label changes so it squishes rather than snaps.
  const prevText = useRef(null);
  const prevWidth = useRef(0);
  useLayoutEffect(() => {
    const el = playBtn.current;
    if (!el) return undefined;
    const first = prevText.current === null;
    prevText.current = playText;
    // The DOM already holds the new label here, so the old width comes from the last run.
    const from = prevWidth.current;
    el.style.width = '';
    const to = el.offsetWidth;
    prevWidth.current = to;
    if (first || !from || !window.matchMedia('(min-width: 901px)').matches) return undefined;
    el.style.width = `${from}px`;
    el.getBoundingClientRect();
    if (from === to) {
      el.style.width = '';
      return undefined;
    }
    el.style.width = `${to}px`;
    const done = (e) => {
      if (e.propertyName !== 'width') return;
      el.style.width = '';
      el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
    return () => el.removeEventListener('transitionend', done);
  }, [playText]);

  const nowPlaying = track ? [track.title, track.artist].filter(Boolean).join(' · ') : '';

  const shout = () => {
    if (!track) return;
    setKind('Shout-out');
    msg.setText(`Loving this one, ${track.title}!`);
    msg.reset();
    if (input.current) input.current.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    await msg.send(activeKind);
  };

  return (
    <section id="listen" className={`live ${isPlaying ? 'is-playing' : ''}`} aria-labelledby="live-h">
      <div className="live__mark" aria-hidden="true">URN</div>

      <div className="live__progress">
        <div className="live__meta">
          <span className="doto">{live ? formatRange(show) : ready ? 'Between shows' : ' '}</span>
          <span className="muted">{live && left < 60 ? leftText : '\u00a0'}</span>
        </div>
        <div
          className="bar"
          role={live ? 'progressbar' : undefined}
          aria-label={live ? 'Show progress' : undefined}
          aria-valuemin={live ? 0 : undefined}
          aria-valuemax={live ? 100 : undefined}
          aria-valuenow={live ? pct : undefined}
        >
          <div className="bar__fill" style={{ width: live ? `${pct}%` : '0%' }} />
        </div>
      </div>

      <div className="live__grid">
        <div className="live__main">
          <PixelHeading id="live-h" size="hero" play={ready || waited}>{title}</PixelHeading>

          <button
            ref={playBtn}
            type="button"
            className={`bigplay ${isPlaying ? 'is-playing' : ''}`}
            onClick={togglePlay}
            aria-label={playLabel}
          >
            <span className="bigplay__disc">
              {isLoading ? <Spinner size={28} /> : isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={28} className="nudge" />}
            </span>
            <span className="bigplay__label">{playText}</span>
          </button>
          <p className="muted bigplay__sub">{nowPlaying || 'Live from the Portland Building'}</p>
          {error ? <p className="notice notice--err" role="alert">{error}</p> : null}

          {upNext.length > 0 ? (
            <div className="upnext">
              <h2 className="caps caps--butter">Up next</h2>
              <ul>
                {upNext.map((u, i) => {
                  const tag = showTag(u);
                  return (
                    <li key={`${u.id}-${u.when}`} className={i >= 2 ? 'upnext__extra' : undefined}>
                      <a href="#lineup" className="upnext__row">
                        <span className="upnext__time">{formatMinutes(u.startMin)}</span>
                        <span className="upnext__title">{u.name}</span>
                        {tag ? (
                          <span className={`upnext__tag upnext__tag--${tag.kind}`}>{tag.label}</span>
                        ) : (
                          <span className="muted upnext__when">{u.when}</span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        {track ? (
          <div className="live__side">
            <div className="nowplaying" aria-live="polite">
              <div className="nowplaying__tile">
                {track.artwork ? (
                  <img className="nowplaying__art" src={track.artwork} alt="" width="96" height="96" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <Meter active={isPlaying} />
                )}
              </div>
              <div className="nowplaying__text">
                <span className="nowplaying__label">
                  <span className="caps caps--lime">Now playing</span>
                  {track.time ? <span className="muted nowplaying__since tnum">{track.time}</span> : null}
                </span>
                <span className="nowplaying__title">{track.title}</span>
                <span className="muted nowplaying__artist">{track.artist}</span>
              </div>
              <TrackMenu track={track} />
            </div>
              <button type="button" className="btn btn--ghost" onClick={shout}>Loving this? Tell the studio</button>
            {history.length > 0 ? (
              <div className="played">
                <h2 className="caps caps--muted">Played earlier</h2>
                <ol>
                  {history.map((h) => (
                    <li key={`${h.time}-${h.title}`}>
                      <span className="muted tnum">{h.time}</span>
                      <span className="played__track">
                        <span>{h.title}</span>
                        {h.artist ? <span className="muted">{h.artist}</span> : null}
                      </span>
                      <TrackMenu track={h} />
                    </li>
                  ))}
                </ol>
              </div>
  
        ) : null}
        </div>
        ) : null}
      </div>

      <form id="message" className="panel" onSubmit={submit}>
        <div className="panel__head">
          <div>
            <h2 className="panel__title">Message {title}</h2>
            <p className="muted panel__hint">Request a song or say hi. It goes straight to the studio.</p>
          </div>
          <div role="group" aria-label="Message type" className="pills">
            {kinds.map((k) => (
              <button key={k} type="button" className="pill" aria-pressed={k === activeKind} onClick={() => setKind(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
        {msg.status === 'sent' ? (
          <div className="notice notice--ok" role="status">
            <span><strong>Sent to {title}.</strong> Listen out for it on air.</span>
            <button type="button" className="btn btn--sm btn--ghost-ink" onClick={msg.reset}>OK</button>
          </div>
        ) : null}
        {msg.status === 'error' ? <p className="notice notice--err" role="alert">{msg.error}</p> : null}
        <div className="panel__fields">
          <label htmlFor="m-msg" className="sr-only">Your message</label>
          <input
            id="m-msg"
            ref={input}
            type="text"
            className="field field--lg field--grow"
            maxLength={MESSAGE_MAX}
            value={msg.text}
            onChange={(e) => msg.setText(e.target.value)}
            placeholder={KINDS[activeKind]}
            autoComplete="off"
          />
          <span className="field field--lg field--from">
            <label htmlFor="m-name" className="caps caps--muted">From</label>
            <input id="m-name" type="text" value={msg.name} onChange={(e) => msg.setName(e.target.value)} autoComplete="given-name" placeholder="Name (optional)" maxLength={30} />
          </span>
          <button type="submit" className="btn btn--send btn--lg" disabled={!msg.text.trim() || msg.status === 'sending'}>
            {msg.status === 'sending' ? 'Sending' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
}
