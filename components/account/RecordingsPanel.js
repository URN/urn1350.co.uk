import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listMyRecordingSlots, requestRecordingUrl } from '../../utils/recordings';
import { groupEpisodes, slotBelongsToShows } from '../../lib/recordings.mjs';

const FIRST_PAGE = 4;
const clock = (h) => `${String(h % 24).padStart(2, '0')}:00`;
const fmtDate = (key, opts) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
};

export default function RecordingsPanel({ userId, show }) {
  const [hourly, setHourly] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(null); // file being prepared
  const [playing, setPlaying] = useState(null); // { file, url }
  const [errors, setErrors] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    listMyRecordingSlots(userId)
      .then((list) => active && setHourly(list))
      .catch((err) => active && setLoadError(err.message || 'Could not load recordings.'));
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (playing) audioRef.current?.play().catch(() => {});
  }, [playing]);

  const episodes = useMemo(() => {
    if (!hourly) return [];
    const mine = show
      ? hourly.filter((item) => slotBelongsToShows({ show_id: item.showId, name: item.showName }, [show]))
      : hourly;
    return groupEpisodes(mine);
  }, [hourly, show]);

  // Signed links are requested here, on click, so a tab left open still works.
  async function withLink(file, then) {
    setBusy(file);
    setErrors((prev) => ({ ...prev, [file]: '' }));
    try {
      then(await requestRecordingUrl(file));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [file]: err.message || 'Link expired, try again.' }));
    } finally {
      setBusy(null);
    }
  }

  const download = (file) => withLink(file, (url) => window.location.assign(url));
  const play = (file) => {
    if (playing?.file === file) return setPlaying(null);
    return withLink(file, (url) => setPlaying({ file, url }));
  };

  if (loadError) return <p className="account-error" role="alert">{loadError}</p>;
  if (hourly === null) {
    return <div className="rec-skeleton" aria-hidden="true"><div /><div /></div>;
  }
  if (episodes.length === 0) {
    return (
      <p className="account-muted">
        No recordings yet. This show appears here an hour after it airs.
      </p>
    );
  }

  const visible = showAll ? episodes : episodes.slice(0, FIRST_PAGE);
  return (
    <div>
      <p className="rec-intro">
        Kept for 6 weeks. Downloads only work from the UK.
      </p>
      <ul className="rec-episodes">
        {visible.map((ep) => (
          <li key={ep.key} className="account-card rec-episode">
            <h3>{fmtDate(ep.dateKey, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            {!show ? <p className="rec-meta">{ep.showName}</p> : null}
            <ul className="rec-parts">
              {ep.hours.map((part) => {
                const label = `${ep.showName}, ${fmtDate(ep.dateKey, { weekday: 'short', day: 'numeric', month: 'short' })}, ${clock(part.hour)}`;
                const isPlaying = playing?.file === part.file;
                const working = busy === part.file;
                return (
                  <li key={part.file}>
                    <div className="rec-part-row">
                      <strong>{clock(part.hour)}–{clock(part.hour + 1)}</strong>
                      <span className="rec-actions">
                        <button
                          type="button"
                          className="rec-btn rec-btn--ghost"
                          aria-label={`${isPlaying ? 'Stop' : 'Play'} ${label}`}
                          disabled={working}
                          onClick={() => play(part.file)}>
                          {isPlaying ? '■ Stop' : '▶ Play'}
                        </button>
                        <button
                          type="button"
                          className="rec-btn"
                          aria-label={`Download ${label}`}
                          disabled={working}
                          onClick={() => download(part.file)}>
                          {working ? 'Preparing…' : '⬇ Download'}
                        </button>
                      </span>
                    </div>
                    {isPlaying ? (
                      <audio
                        ref={audioRef}
                        className="rec-audio"
                        controls
                        src={playing.url}
                        onError={() => {
                          setErrors((prev) => ({ ...prev, [part.file]: 'Could not play this. Try again.' }));
                          setPlaying(null);
                        }}
                      />
                    ) : null}
                    {errors[part.file] ? <p className="rec-error" role="alert">{errors[part.file]}</p> : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      {!showAll && episodes.length > FIRST_PAGE ? (
        <button type="button" className="rec-more" onClick={() => setShowAll(true)}>
          Show older
        </button>
      ) : null}
    </div>
  );
}
