import React, { useEffect, useMemo, useRef, useState } from 'react';

import { RETENTION_DAYS, listDayHours, londonToday, shiftDateKey } from '../../lib/recordings.mjs';
import { listAllSlots, requestRecordingUrl } from '../../utils/recordings';
import { RecordingsNav, useDownload } from './RecordingsScreen';
import { DownloadIcon, PauseIcon, PlayIcon, clock, dateParts, longDate } from './recordingsUi';

const HOUR = 3600;
const stamp = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

/** Every hour of any day still on the server, for people who manage the schedule. */
export default function ArchiveScreen({ onSelectView }) {
  const [slots, setSlots] = useState(null);
  const [loadError, setLoadError] = useState('');
  const today = londonToday();
  const [day, setDay] = useState(today);
  const [current, setCurrent] = useState(null); // { file, url }
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [playError, setPlayError] = useState('');
  const audioRef = useRef(null);
  const dl = useDownload();

  useEffect(() => {
    let active = true;
    listAllSlots()
      .then((rows) => active && setSlots(rows))
      .catch((err) => active && setLoadError(err.message || 'Could not load recordings.'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (current) audioRef.current?.play().catch(() => {});
  }, [current]);

  const days = useMemo(
    () => Array.from({ length: RETENTION_DAYS + 1 }, (_, i) => shiftDateKey(today, -i)),
    [today],
  );
  // The day starts at 06:00, like the radio day.
  const hours = useMemo(() => {
    if (!slots) return [];
    const all = listDayHours(slots, day);
    return [...all.slice(6), ...all.slice(0, 6)];
  }, [slots, day]);

  async function play(item) {
    setPlayError('');
    if (current?.file === item.file) {
      if (audioRef.current.paused) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
      return;
    }
    try {
      setPos(0);
      setCurrent({ file: item.file, url: await requestRecordingUrl(item.file) });
    } catch (err) {
      setPlayError(err.message || 'Could not play this. Try again.');
    }
  }

  return (
    <>
      <div className="acct-rec-head">
        <div className="acct-head">
          <h1 className="acct-h1">Archive&nbsp;.</h1>
        </div>
        <RecordingsNav current="archive" onSelect={onSelectView} />
      </div>

      <div role="group" aria-label="Day" className="acct-rec-days">
        {days.map((key) => {
          const d = dateParts(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={key === day}
              aria-label={longDate(key)}
              onClick={() => setDay(key)}>
              <span>{d.dow}</span>
              <strong>{d.day}</strong>
            </button>
          );
        })}
      </div>

      {loadError ? <p role="alert" className="acct-notice acct-notice--error">{loadError}</p> : null}
      {slots === null && !loadError ? <p role="status" className="acct-loading">Loading recordings…</p> : null}
      {playError ? <p role="alert" className="acct-rec-error">{playError}</p> : null}

      {slots ? (
        <section aria-labelledby="dayh" className="acct-rec-day">
          <h2 id="dayh" className="acct-h3">{longDate(day)}</h2>
          <ul className="acct-rec-hours">
            {hours.map((item) => {
              const ok = item.status === 'ok';
              const isCurrent = current?.file === item.file;
              const isPlaying = isCurrent && playing;
              const range = `${clock(item.hour)}–${clock(item.hour + 1)}`;
              const name = item.showName || 'Automation';
              return (
                <li key={item.file} className={isCurrent ? 'is-current' : undefined}>
                  <div className="acct-rec-hours__row">
                    <span className="acct-rec-hours__range">{range}</span>
                    <span className="acct-rec-hours__show">
                      <span className={item.showName ? 'is-show' : undefined}>{name}</span>
                      {item.status === 'future' ? <span className="acct-sub">Not recorded yet</span> : null}
                      {dl.errors[item.file] ? <span className="acct-rec-error" role="alert">{dl.errors[item.file]}</span> : null}
                    </span>
                    {ok ? (
                      <>
                        <button
                          type="button"
                          className="acct-rec-round"
                          aria-label={`${isPlaying ? 'Pause' : 'Play'} ${range} hour`}
                          onClick={() => play(item)}>
                          {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button
                          type="button"
                          className="acct-rec-dlbtn"
                          aria-label={`Download ${range}, ${name}`}
                          disabled={dl.busy === item.file}
                          onClick={() => dl.download(item.file)}>
                          <DownloadIcon />
                          <span className="acct-hide-m">{dl.busy === item.file ? 'Preparing…' : 'Download'}</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                  {isCurrent ? (
                    <div className="acct-rec-hours__seek">
                      <label htmlFor="ar-seek" className="acct-sr">{`Position in ${range}`}</label>
                      <input
                        id="ar-seek"
                        type="range"
                        min="0"
                        max={HOUR}
                        step="5"
                        value={Math.min(pos, HOUR)}
                        aria-valuetext={stamp(pos)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setPos(v);
                          audioRef.current.currentTime = v;
                        }}
                      />
                      <div aria-hidden="true"><span>{clock(item.hour)}</span><span>{clock(item.hour + 1)}</span></div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {current ? (
        <audio
          ref={audioRef}
          src={current.url}
          onTimeUpdate={() => setPos(audioRef.current.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => {
            setPlayError('Could not play this. The link may have expired, so try again.');
            setCurrent(null);
            setPlaying(false);
          }}
        />
      ) : null}
    </>
  );
}
