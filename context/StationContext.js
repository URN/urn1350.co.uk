import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  londonNow,
  findCurrent,
  findUpcoming,
  formatLeft,
} from '../utils/schedule';

const TRACK_POLL_MS = 15000;
const CLOCK_MS = 15000;
const SCHEDULE_REFRESH_MS = 5 * 60 * 1000;

const StationContext = createContext(null);

function timeOf(iso) {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(Number.isNaN(d.getTime()) ? new Date() : d);
}

export function StationProvider({ children, initialSchedule }) {
  const [schedule, setSchedule] = useState(initialSchedule || null);
  const [now, setNow] = useState(null);
  const [track, setTrack] = useState(null);
  const [history, setHistory] = useState([]);
  const lastKey = useRef('');
  const lastHistoryKey = useRef('');

  // Pages that ship a statically generated schedule keep it fresh on navigation.
  useEffect(() => {
    if (initialSchedule) setSchedule(initialSchedule);
  }, [initialSchedule]);

  // Wall clock: only ever set on the client so SSR output never goes stale.
  useEffect(() => {
    const tick = () => setNow(londonNow());
    tick();
    const id = setInterval(tick, CLOCK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/schedule', { signal: AbortSignal.timeout?.(10000) });
        if (res.ok && !cancelled) setSchedule(await res.json());
      } catch (e) {
        // Keep whatever we already have.
      }
    };
    if (!initialSchedule) load();
    const id = setInterval(load, SCHEDULE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/now-playing', { signal: AbortSignal.timeout?.(8000) });
        const data = await res.json();
        if (cancelled) return;
        const artist = data.artist || '';
        const title = data.title || '';
        const key = `${artist}|${title}`;
        if (!artist && !title) {
          lastKey.current = '';
          setTrack(null);
        } else if (key !== lastKey.current) {
          lastKey.current = key;
          setTrack({ artist, title, time: timeOf(data.airdatetime || data.changedAt) });
        }
        const played = Array.isArray(data.history) ? data.history : [];
        const historyKey = played.map((h) => `${h.playedAt}|${h.artist}|${h.title}`).join('\n');
        if (historyKey !== lastHistoryKey.current) {
          lastHistoryKey.current = historyKey;
          setHistory(played.map((h) => ({ artist: h.artist || '', title: h.title || '', time: h.playedAt ? timeOf(h.playedAt) : '' })));
        }
      } catch (e) {
        // Keep the last known track if the endpoint is briefly unavailable.
      }
    };
    poll();
    const id = setInterval(poll, TRACK_POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && poll();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const value = useMemo(() => {
    const ready = Boolean(now && schedule);
    const show = ready ? findCurrent(schedule, now) : null;
    const left = show ? show.endMin - now.minutes : 0;
    const pct = show
      ? Math.min(100, Math.max(0, Math.round(((now.minutes - show.startMin) / (show.endMin - show.startMin)) * 100)))
      : 0;
    const upcoming = ready ? findUpcoming(schedule, now, 3) : [];
    return {
      ready,
      schedule,
      now,
      show,
      left,
      leftText: show ? formatLeft(left) : '',
      pct,
      upNext: upcoming.slice(0, 2),
      nextShow: upcoming[0] || null,
      track,
      history,
    };
  }, [schedule, now, track, history]);

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation() {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error('useStation must be used within StationProvider');
  return ctx;
}
