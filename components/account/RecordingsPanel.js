import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listMyRecordingSlots, requestRecordingUrl } from '../../utils/recordings';
import { daysBetween, groupEpisodes, londonToday } from '../../lib/recordings.mjs';

const INITIAL_EPISODES = 4;
const pad = (n) => String(n).padStart(2, '0');
const clock = (h) => `${pad(h % 24)}:00`;

function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const longDate = (key) => dateFromKey(key).toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
});
const shortDate = (key) => dateFromKey(key).toLocaleDateString('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
});

function relativeDay(key, today) {
  const n = daysBetween(key, today);
  if (n <= 0) return 'Today';
  if (n === 1) return 'Yesterday';
  if (n < 7) return `${n} days ago`;
  const weeks = Math.round(n / 7);
  return weeks === 1 ? 'Last week' : `${weeks} weeks ago`;
}

export default function RecordingsPanel({ userId }) {
  const [hourly, setHourly] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [showFilter, setShowFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(null); // { file, kind }
  const [done, setDone] = useState('');
  const [errors, setErrors] = useState({});
  const [playing, setPlaying] = useState(null); // { file, url }
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    listMyRecordingSlots(userId)
      .then((list) => active && setHourly(list))
      .catch((err) => active && setLoadError(err instanceof Error ? err.message : 'Could not load recordings.'));
    return () => { active = false; };
  }, [userId]);

  const today = londonToday();
  const episodes = useMemo(() => (hourly ? groupEpisodes(hourly) : []), [hourly]);
  const showNames = useMemo(() => [...new Set(episodes.map((e) => e.showName))].sort(), [episodes]);
  const filtered = showFilter === 'all' ? episodes : episodes.filter((e) => e.showName === showFilter);
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_EPISODES);

  useEffect(() => {
    if (playing && audioRef.current) audioRef.current.play().catch(() => {});
  }, [playing]);

  function setRowError(file, message) {
    setErrors((prev) => ({ ...prev, [file]: message }));
  }

  async function handleDownload(file) {
    setBusy({ file, kind: 'download' });
    setRowError(file, '');
    setDone('');
    try {
      const url = await requestRecordingUrl(file); // signed now, on click
      window.location.assign(url);
      setDone(file);
    } catch (err) {
      setRowError(file, err instanceof Error ? err.message : 'Link expired, try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handlePlay(file) {
    if (playing?.file === file) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    setBusy({ file, kind: 'play' });
    setRowError(file, '');
    try {
      const url = await requestRecordingUrl(file);
      setPlaying({ file, url });
    } catch (err) {
      setRowError(file, err instanceof Error ? err.message : 'Link expired, try again.');
    } finally {
      setBusy(null);
    }
  }

  if (loadError) return <p className="account-error" role="alert">{loadError}</p>;
  if (hourly === null) {
    return (
      <div className="rec-skeleton" aria-hidden="true">
        <div /><div /><div />
      </div>
    );
  }
  if (episodes.length === 0) {
    return (
      <section className="account-card rec-empty">
        <h3>No recordings yet</h3>
        <p>
          Once one of your shows has been on air, its recording appears here within the hour.
          We keep recordings for 6 weeks.
        </p>
      </section>
    );
  }

  return (
    <div className="rec-panel">
      <p className="rec-intro">
        Listen back or download your shows. Recordings are kept for 6 weeks and can only be
        downloaded from the UK.
      </p>

      {showNames.length > 1 ? (
        <div className="rec-filters" role="group" aria-label="Filter by show">
          {['all', ...showNames].map((name) => (
            <button
              key={name}
              type="button"
              className={`rec-chip${showFilter === name ? ' is-active' : ''}`}
              aria-pressed={showFilter === name}
              onClick={() => { setShowFilter(name); setExpanded(false); }}>
              {name === 'all' ? 'All shows' : name}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="rec-episodes">
        {visible.map((ep) => (
          <li key={ep.key} className="account-card rec-episode">
            <header>
              <div>
                <h3>{longDate(ep.dateKey)}</h3>
                <p className="rec-meta">
                  {ep.showName} · {clock(ep.startHour)}–{clock(ep.endHour)}
                </p>
              </div>
              <span className="rec-when">{relativeDay(ep.dateKey, today)}</span>
            </header>

            <ul className="rec-parts">
              {ep.hours.map((part, i) => {
                const isBusy = busy?.file === part.file;
                const isPlaying = playing?.file === part.file;
                const label = `${ep.showName}, ${shortDate(ep.dateKey)}, ${clock(part.hour)}`;
                return (
                  <li key={part.file}>
                    <div className="rec-part-row">
                      <span className="rec-part-label">
                        {ep.hours.length > 1 ? `Hour ${i + 1}` : 'Full show'}
                        <small>{clock(part.hour)}–{clock(part.hour + 1)}</small>
                      </span>
                      <span className="rec-actions">
                        <button
                          type="button"
                          className="rec-btn rec-btn--ghost"
                          aria-label={`${isPlaying ? 'Stop' : 'Play'} ${label}`}
                          disabled={isBusy && busy.kind === 'play'}
                          onClick={() => handlePlay(part.file)}>
                          {isBusy && busy.kind === 'play' ? 'Loading…' : isPlaying ? '■ Stop' : '▶ Play'}
                        </button>
                        <button
                          type="button"
                          className="rec-btn"
                          aria-label={`Download ${label}`}
                          disabled={isBusy && busy.kind === 'download'}
                          onClick={() => handleDownload(part.file)}>
                          {isBusy && busy.kind === 'download'
                            ? 'Preparing…'
                            : done === part.file ? '✓ Started' : '⬇ Download'}
                        </button>
                      </span>
                    </div>
                    {isPlaying ? (
                      <audio
                        ref={audioRef}
                        className="rec-audio"
                        controls
                        preload="metadata"
                        src={playing.url}
                        onError={() => {
                          setRowError(part.file, 'Could not play this recording. The link may have expired, so try again.');
                          setPlaying(null);
                        }}
                      />
                    ) : null}
                    {errors[part.file] ? (
                      <p className="rec-error" role="alert">{errors[part.file]}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <p className="rec-expiry">Available until {shortDate(ep.expiresKey)}</p>
          </li>
        ))}
      </ul>

      {filtered.length > INITIAL_EPISODES ? (
        <button
          type="button"
          className="rec-more"
          onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show fewer' : `Show ${filtered.length - INITIAL_EPISODES} older ${filtered.length - INITIAL_EPISODES === 1 ? 'show' : 'shows'}`}
        </button>
      ) : null}
    </div>
  );
}
