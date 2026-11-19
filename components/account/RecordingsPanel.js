import React, { useEffect, useMemo, useRef, useState } from 'react';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import { listMyRecordingSlots, requestRecordingUrl } from '../../utils/recordings';
import { groupEpisodes, slotBelongsToShows } from '../../lib/recordings.mjs';

const EARLIER_FIRST_PAGE = 5;
const clock = (h) => `${String(h % 24).padStart(2, '0')}:00`;
const fmtDate = (key, opts) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
};
const longDate = (key) => fmtDate(key, { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = (key) => fmtDate(key, { weekday: 'short', day: 'numeric', month: 'short' });
const timeRange = (ep) => `${clock(ep.startHour)}–${clock(ep.endHour)}`;

/** Recordings for one show: a featured latest episode, earlier ones, one player. */
export default function RecordingsPanel({ userId, show }) {
  const [hourly, setHourly] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(null); // file being signed
  const [now, setNow] = useState(null); // { epKey, partIdx, url }
  const [paused, setPaused] = useState(false);
  const [errors, setErrors] = useState({}); // by episode key
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    listMyRecordingSlots(userId)
      .then((list) => active && setHourly(list))
      .catch((err) => active && setLoadError(err.message || 'Could not load recordings.'));
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (now) audioRef.current?.play().catch(() => {});
  }, [now]);

  const episodes = useMemo(() => {
    if (!hourly) return [];
    return groupEpisodes(hourly.filter((item) => (
      slotBelongsToShows({ show_id: item.showId, name: item.showName }, [show])
    )));
  }, [hourly, show]);

  // Signed links are requested on click (or when the next part starts), never on page load.
  async function withLink(epKey, file, then) {
    setBusy(file);
    setErrors((prev) => ({ ...prev, [epKey]: '' }));
    try {
      then(await requestRecordingUrl(file));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [epKey]: err.message || 'Link expired, try again.' }));
    } finally {
      setBusy(null);
    }
  }

  const loadPart = (ep, partIdx) => withLink(ep.key, ep.hours[partIdx].file, (url) => {
    setPaused(false);
    setNow({ epKey: ep.key, partIdx, url });
  });

  const download = (ep, file) => withLink(ep.key, file, (url) => window.location.assign(url));

  function togglePlay(ep) {
    if (now?.epKey === ep.key) {
      const audio = audioRef.current;
      if (audio?.paused) audio.play().catch(() => {});
      else audio?.pause();
      return;
    }
    loadPart(ep, 0);
  }

  function handleEnded() {
    const ep = episodes.find((e) => e.key === now?.epKey);
    if (ep && now.partIdx + 1 < ep.hours.length) loadPart(ep, now.partIdx + 1);
    else setNow(null);
  }

  if (loadError) return <p className="account-error" role="alert">{loadError}</p>;
  if (hourly === null) return <div className="rec-skeleton" aria-hidden="true"><div /></div>;
  if (episodes.length === 0) {
    return (
      <section className="rec" aria-label="Recordings">
        <p className="rec-empty">No recordings yet. Each show appears here an hour after it airs.</p>
      </section>
    );
  }

  const [latest, ...earlier] = episodes;
  const shownEarlier = showAll ? earlier : earlier.slice(0, EARLIER_FIRST_PAGE);
  const nowEp = episodes.find((e) => e.key === now?.epKey);
  const isPlaying = (ep) => now?.epKey === ep.key && !paused;

  const PlayButton = ({ ep, large }) => (
    <button
      type="button"
      className={`rec-play${large ? ' rec-play--large' : ''}`}
      aria-label={`${isPlaying(ep) ? 'Pause' : 'Play'} ${show.name}, ${shortDate(ep.dateKey)}`}
      disabled={busy !== null && busy === ep.hours[0].file}
      onClick={() => togglePlay(ep)}>
      {isPlaying(ep) ? <PauseRounded /> : <PlayArrowRounded />}
    </button>
  );

  const DownloadLinks = ({ ep }) => (
    <span className="rec-downloads">
      {ep.hours.map((part, i) => (
        <button
          key={part.file}
          type="button"
          className="rec-dl"
          aria-label={`Download ${show.name}, ${shortDate(ep.dateKey)}, ${clock(part.hour)}`}
          disabled={busy === part.file}
          onClick={() => download(ep, part.file)}>
          <DownloadRounded fontSize="inherit" />
          {busy === part.file ? 'Preparing…' : ep.hours.length > 1 ? `Part ${i + 1}` : 'Download'}
        </button>
      ))}
    </span>
  );

  return (
    <section className="rec" aria-label="Recordings">
      <div className="rec-hero">
        <PlayButton ep={latest} large />
        <div className="rec-hero-text">
          <span className="rec-tag">Latest</span>
          <strong>{longDate(latest.dateKey)}</strong>
          <span>{timeRange(latest)}</span>
        </div>
        <DownloadLinks ep={latest} />
        {errors[latest.key] ? <p className="rec-error" role="alert">{errors[latest.key]}</p> : null}
      </div>

      {earlier.length > 0 ? (
        <>
          <h3 className="rec-subhead">Earlier</h3>
          <ul className="rec-list">
            {shownEarlier.map((ep) => (
              <li key={ep.key}>
                <PlayButton ep={ep} />
                <span className="rec-when">
                  <strong>{shortDate(ep.dateKey)}</strong>
                  <small>{timeRange(ep)}</small>
                </span>
                <DownloadLinks ep={ep} />
                {errors[ep.key] ? <p className="rec-error" role="alert">{errors[ep.key]}</p> : null}
              </li>
            ))}
          </ul>
          {!showAll && earlier.length > EARLIER_FIRST_PAGE ? (
            <button type="button" className="rec-more" onClick={() => setShowAll(true)}>
              Show {earlier.length - EARLIER_FIRST_PAGE} older
            </button>
          ) : null}
        </>
      ) : null}

      <p className="rec-footnote">
        Kept for 6 weeks · downloads work from the UK only · about 140 MB per hour
      </p>

      {now ? (
        <div className="rec-player" role="region" aria-label="Now playing">
          <p>
            Now playing · {shortDate(nowEp.dateKey)}
            {nowEp.hours.length > 1 ? ` · Part ${now.partIdx + 1} of ${nowEp.hours.length}` : ''}
          </p>
          <audio
            ref={audioRef}
            controls
            src={now.url}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onEnded={handleEnded}
            onError={() => {
              setErrors((prev) => ({ ...prev, [nowEp.key]: 'Could not play this. The link may have expired, so try again.' }));
              setNow(null);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
