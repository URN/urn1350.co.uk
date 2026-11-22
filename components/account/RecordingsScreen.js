import React, { useEffect, useMemo, useState } from 'react';

import { groupEpisodes, listSlotHours, londonNowParts, slotBelongsToShows } from '../../lib/recordings.mjs';
import { listAllSlots, requestRecordingUrl } from '../../utils/recordings';
import { Chevron } from './ui';
import {
  DownloadIcon,
  PlayIcon,
  clock,
  dateParts,
  hoursLabel,
  isLastDay,
  longDate,
  timeRange,
} from './recordingsUi';

/** Switch between the two recordings views (archive is for people who manage the schedule). */
export function RecordingsNav({ current, onSelect }) {
  return (
    <nav className="acct-rec-nav" aria-label="Recordings view">
      <button type="button" aria-current={current === 'recordings' ? 'page' : undefined} onClick={() => onSelect('recordings')}>
        Your shows
      </button>
      <button type="button" aria-current={current === 'archive' ? 'page' : undefined} onClick={() => onSelect('archive')}>
        Archive by date
      </button>
    </nav>
  );
}

/** Downloads sign a link on click, never on page load. */
export function useDownload() {
  const [busy, setBusy] = useState('');
  const [errors, setErrors] = useState({});
  async function download(file) {
    setBusy(file);
    setErrors((prev) => ({ ...prev, [file]: '' }));
    try {
      window.location.assign(await requestRecordingUrl(file));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [file]: err.message || 'Could not get the recording. Try again.' }));
    } finally {
      setBusy('');
    }
  }
  return { busy, errors, download };
}

function EpisodeRow({ ep, isNew, open, onToggle, onListen, dl }) {
  const date = dateParts(ep.dateKey);
  const lastDay = isLastDay(ep.dateKey);
  const tag = isNew ? 'New' : lastDay ? 'Deleted tomorrow' : '';
  const filesId = `files-${ep.key.replace(/[^a-z0-9]/gi, '-')}`;
  const label = `${ep.showName}, ${longDate(ep.dateKey)}`;

  return (
    <li className="acct-rec-row">
      <div className="acct-rec-row__main">
        <span className={`acct-rec-date${isNew ? ' acct-rec-date--on' : ''}`} aria-hidden="true">
          <span>{date.dow}</span>
          <strong>{date.day}</strong>
          <span>{date.mon}</span>
        </span>
        <div className="acct-rec-row__body">
          <button type="button" className="acct-rec-row__title" onClick={() => onListen(ep)}>
            <span className="acct-sr">{longDate(ep.dateKey)}, </span>
            {ep.showName}
          </button>
          <span className="acct-rec-row__meta">{`${timeRange(ep)} · ${hoursLabel(ep.hours.length)}`}</span>
          {tag ? (
            <span className={`acct-rec-tag${isNew ? ' acct-rec-tag--new' : ' acct-rec-tag--warn'}`}>{tag}</span>
          ) : null}
        </div>
        <div className="acct-rec-acts">
          <button type="button" className="acct-rec-listen" aria-label={`Listen to ${label}`} onClick={() => onListen(ep)}>
            <PlayIcon size={14} />
            Listen
          </button>
          <button
            type="button"
            className="acct-rec-dlbtn"
            aria-expanded={open}
            aria-controls={filesId}
            aria-label={`Download ${label}`}
            onClick={onToggle}>
            <DownloadIcon />
            Download
            <span className={`acct-rec-chev${open ? ' is-open' : ''}`}><Chevron /></span>
          </button>
        </div>
      </div>
      {open ? (
        <div id={filesId} className="acct-rec-files">
          <ul>
            {ep.hours.map((part, i) => (
              <li key={part.file}>
                <span className="acct-rec-files__what">
                  <strong>{`Hour ${i + 1} · ${clock(part.hour)}–${clock(part.hour + 1)}`}</strong>
                  <span>60 minutes</span>
                  {dl.errors[part.file] ? <span className="acct-rec-error" role="alert">{dl.errors[part.file]}</span> : null}
                </span>
                <button
                  type="button"
                  className="acct-rec-dlbtn"
                  aria-label={`Download hour ${i + 1}, ${clock(part.hour)} to ${clock(part.hour + 1)}, ${ep.showName}`}
                  disabled={dl.busy === part.file}
                  onClick={() => dl.download(part.file)}>
                  <DownloadIcon />
                  {dl.busy === part.file ? 'Preparing…' : 'Download'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/** Recordings of the shows the signed-in person presents, newest first. */
export default function RecordingsScreen({ myShows, canArchive, onSelectView, onOpenEpisode }) {
  const [slots, setSlots] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState('');
  const dl = useDownload();

  useEffect(() => {
    let active = true;
    listAllSlots()
      .then((rows) => active && setSlots(rows))
      .catch((err) => active && setLoadError(err.message || 'Could not load recordings.'));
    return () => { active = false; };
  }, []);

  const mine = useMemo(
    () => (slots || []).filter((slot) => slotBelongsToShows(slot, myShows)),
    [slots, myShows],
  );
  const episodes = useMemo(() => (slots ? groupEpisodes(listSlotHours(mine)) : []), [slots, mine]);

  // A show is on air in its slot this hour: the hour is only downloadable once it ends.
  const onAir = useMemo(() => {
    if (!slots) return null;
    const now = londonNowParts();
    const [y, m, d] = now.dateKey.split('-').map(Number);
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return mine.find((slot) => slot.day === weekday && now.hour >= slot.start_hour && now.hour < slot.end_hour) || null;
  }, [slots, mine]);

  return (
    <>
      <div className="acct-rec-head">
        <div className="acct-head">
          <h1 className="acct-h1">Recordings&nbsp;.</h1>
          <p className="acct-lede">Kept for 6 weeks.</p>
        </div>
        {canArchive ? <RecordingsNav current="recordings" onSelect={onSelectView} /> : null}
      </div>

      {onAir ? (
        <div role="status" className="acct-rec-live">
          <span className="acct-rec-live__badge"><span className="acct-rec-live__dot" />Recording now</span>
          <span>
            <strong>{onAir.name}.</strong>
            {` Each hour is ready to download once it ends, at ${clock(londonNowParts().hour + 1)}.`}
          </span>
        </div>
      ) : null}

      {loadError ? <p role="alert" className="acct-notice acct-notice--error">{loadError}</p> : null}
      {slots === null && !loadError ? <p role="status" className="acct-loading">Loading recordings…</p> : null}
      {slots && episodes.length === 0 ? (
        <p className="acct-sub">
          {myShows.length === 0
            ? 'Join a show from your profile and its recordings will appear here.'
            : 'No recordings yet. Each show appears here an hour after it airs.'}
        </p>
      ) : null}

      {episodes.length > 0 ? (
        <ul className="acct-rec-list">
          {episodes.map((ep, i) => (
            <EpisodeRow
              key={ep.key}
              ep={ep}
              isNew={i === 0}
              open={open === ep.key}
              onToggle={() => setOpen(open === ep.key ? '' : ep.key)}
              onListen={onOpenEpisode}
              dl={dl}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}
