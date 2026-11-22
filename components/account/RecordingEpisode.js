import React, { useEffect, useRef, useState } from 'react';

import { requestRecordingUrl } from '../../utils/recordings';
import { BackLink } from './ui';
import { PauseIcon, PlayIcon, DownloadIcon, clock, hoursLabel, longDate, timeRange } from './recordingsUi';
import { useDownload } from './RecordingsScreen';

const HOUR = 3600;
const stamp = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const x = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${x}`;
};
const wall = (ep, sec) => stamp(ep.startHour * HOUR + sec);

/** One recording: a player that runs across its hourly files, and a download per hour. */
export default function RecordingEpisode({ episode: ep, onBack }) {
  const audioRef = useRef(null);
  const pendingSeek = useRef(0);
  const [part, setPart] = useState(-1); // index of the hour loaded, -1 until first play
  const [url, setUrl] = useState('');
  const [pos, setPos] = useState(0); // seconds into the whole recording
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const dl = useDownload();
  const total = ep.hours.length * HOUR;

  useEffect(() => {
    if (url) audioRef.current?.play().catch(() => {});
  }, [url]);

  // Signed links are requested on click (or when the next hour starts), never on page load.
  async function loadAt(sec) {
    const idx = Math.min(ep.hours.length - 1, Math.floor(sec / HOUR));
    setError('');
    if (idx === part && url) {
      audioRef.current.currentTime = sec - idx * HOUR;
      setPos(sec);
      audioRef.current.play().catch(() => {});
      return;
    }
    try {
      const next = await requestRecordingUrl(ep.hours[idx].file);
      pendingSeek.current = sec - idx * HOUR;
      setPart(idx);
      setUrl(next);
      setPos(sec);
    } catch (err) {
      setError(err.message || 'Could not play this. Try again.');
    }
  }

  function toggle() {
    if (!url) loadAt(pos);
    else if (audioRef.current.paused) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }

  return (
    <>
      <BackLink onClick={onBack}>Recordings</BackLink>

      <div className="acct-head">
        <h1 className="acct-h1">{ep.showName}&nbsp;.</h1>
        <p className="acct-lede">{`${longDate(ep.dateKey)} · ${timeRange(ep)} · ${hoursLabel(ep.hours.length)}`}</p>
      </div>

      <section className="acct-rec-player" aria-label="Player and download">
        <div className="acct-rec-player__top">
          <button
            type="button"
            className="acct-rec-big"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={toggle}>
            {playing ? <PauseIcon size={22} /> : <PlayIcon size={24} />}
          </button>
          <div className="acct-rec-player__now">
            <span className="acct-rec-clock">{wall(ep, pos)}</span>
            <span>{ep.hours.length > 1 ? `Hour ${Math.max(part, 0) + 1} of ${ep.hours.length}` : 'Hour 1'}</span>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={url || undefined}
          onLoadedMetadata={() => {
            if (pendingSeek.current) audioRef.current.currentTime = pendingSeek.current;
            pendingSeek.current = 0;
          }}
          onTimeUpdate={() => part >= 0 && setPos(part * HOUR + audioRef.current.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            if (part + 1 < ep.hours.length) loadAt((part + 1) * HOUR);
            else setPlaying(false);
          }}
          onError={() => {
            if (url) setError('Could not play this. The link may have expired, so try again.');
            setUrl('');
            setPart(-1);
            setPlaying(false);
          }}
        />

        <div className="acct-rec-seek">
          <label htmlFor="rec-seek" className="acct-sr">Play position</label>
          <input
            id="rec-seek"
            type="range"
            min="0"
            max={total}
            step="5"
            value={Math.min(pos, total)}
            aria-valuetext={wall(ep, pos)}
            onChange={(e) => setPos(Number(e.target.value))}
            onMouseUp={(e) => loadAt(Number(e.target.value))}
            onTouchEnd={(e) => loadAt(Number(e.target.value))}
            onKeyUp={(e) => loadAt(Number(e.target.value))}
          />
          <div className="acct-rec-seek__ticks" aria-hidden="true">
            {ep.hours.map((h) => <span key={h.file}>{clock(h.hour)}</span>)}
            <span>{clock(ep.endHour)}</span>
          </div>
        </div>
        {error ? <p className="acct-rec-error" role="alert">{error}</p> : null}

        <ul className="acct-rec-parts" aria-label="Download">
          {ep.hours.map((part2, i) => (
            <li key={part2.file}>
              <span className="acct-rec-files__what">
                <strong>{`Hour ${i + 1}`}</strong>
                <span>{`${clock(part2.hour)}–${clock(part2.hour + 1)}`}</span>
                {dl.errors[part2.file] ? <span className="acct-rec-error" role="alert">{dl.errors[part2.file]}</span> : null}
              </span>
              <button
                type="button"
                className="acct-rec-dlbtn"
                aria-label={`Download hour ${i + 1}, ${clock(part2.hour)} to ${clock(part2.hour + 1)}`}
                disabled={dl.busy === part2.file}
                onClick={() => dl.download(part2.file)}>
                <DownloadIcon />
                {dl.busy === part2.file ? 'Preparing…' : 'Download'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
