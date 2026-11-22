import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

import { addShowToSchedule, removeScheduleSlot, updateScheduleSlot } from '../../utils/shows';
import { SHOW_TYPES, WEEKDAYS, fetchSchedule, londonNow } from '../../utils/schedule';
import { Field, Heading, Tick } from './ui';
import {
  DAY_START,
  clashesFor,
  crossesMidnight,
  dayLabel,
  nowInWeek,
  radioHour,
  radioRange,
  toRadio,
  toStored,
} from './radioWeek';

// The calendar library is only needed here, so it loads with this tab rather than the site.
const ScheduleCalendar = dynamic(() => import('./ScheduleCalendar'), {
  ssr: false,
  loading: () => <p className="acct-loading" role="status">Loading the timetable…</p>,
});

const SLOT_TYPES = [...SHOW_TYPES, 'automation'];

function typeLabel(type) {
  return String(type || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function defaultType(hour) {
  if (hour >= 7 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 16) return 'daytime';
  if (hour >= 16 && hour < 18) return 'drivetime';
  if (hour >= 18 && hour < 20) return 'sport';
  if (hour >= 20 && hour < 22) return 'pre-club';
  return 'after-dark';
}

function scheduleError(err, fallback) {
  const message = err instanceof Error ? err.message : fallback;
  if (/row-level security|permission denied|42501/i.test(message)) {
    return 'That change was blocked. In Supabase, run urn-app/supabase/schedule-admin.sql so admins can edit the timetable.';
  }
  return message;
}

/** Copy of the schedule with one slot moved, so the calendar doesn't jump back while saving. */
function withSlot(schedule, slot, next) {
  const out = {};
  WEEKDAYS.forEach((day) => {
    out[day] = (schedule[day] || []).filter((s) => s.id !== slot.id);
  });
  const { day, ...rest } = slot;
  out[next.day] = [...out[next.day], { ...rest, start: next.start, end: next.end }];
  return out;
}

function Stepper({ id, label, value, min, max, onChange }) {
  return (
    <div role="group" aria-labelledby={id} className="acct-field">
      <span id={id} className="acct-label">{label}</span>
      <div className="acct-step">
        <button type="button" aria-label={`${label} an hour earlier`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <span>{radioHour(value)}</span>
        <button type="button" aria-label={`${label} an hour later`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export default function ScheduleScreen({ userId, shows = [], onChanged, onError, onMessage }) {
  const [schedule, setSchedule] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [moved, setMoved] = useState(null);
  const [now, setNow] = useState(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const load = useCallback(async () => {
    const next = await fetchSchedule();
    setSchedule(next);
    setLoadError('');
  }, []);

  useEffect(() => {
    let active = true;
    load().catch((err) => {
      if (!active) return;
      const message = err instanceof Error ? err.message : 'Could not load the timetable.';
      setLoadError(message);
      onErrorRef.current(message);
    });
    return () => {
      active = false;
    };
  }, [load]);

  // Client only, so the server render and first paint agree.
  useEffect(() => {
    setNow(londonNow());
    const t = window.setInterval(() => setNow(londonNow()), 60000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!draft) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) setDraft(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft, busy]);

  function openSlot(slot) {
    onError('');
    setConfirmClear(false);
    const r = toRadio(slot.day, slot.start, slot.end);
    setDraft({ id: slot.id, ...r, name: slot.name, type: slot.type || 'daytime', original: { ...r, name: slot.name } });
  }

  function openNew(range) {
    onError('');
    setConfirmClear(false);
    let { re } = range;
    // A plain click picks one hour; start with two when the next hour is free.
    if (re - range.rs === 1) {
      const two = range.rs + 2;
      if (two <= 24 && !crossesMidnight(range.rs, two) && clashesFor(schedule, range.radioDay, range.rs, two).length === 0) {
        re = two;
      }
    }
    setDraft({ id: null, radioDay: range.radioDay, rs: range.rs, re, name: '', type: defaultType(range.rs + DAY_START) });
  }

  async function handleMove(slot, range, revert) {
    const stored = toStored(range.radioDay, range.rs, range.re);
    const before = schedule;
    onError('');
    setMoved(null);
    if (draft?.id === slot.id) setDraft(null);
    setSchedule(withSlot(schedule, slot, stored));
    setBusy(true);
    try {
      await updateScheduleSlot({
        id: slot.id,
        name: slot.name,
        day: stored.day,
        startHour: stored.start,
        endHour: stored.end,
        showType: slot.type || 'daytime',
        userId,
      });
      setMoved({ text: `${slot.name} is now ${dayLabel(range.radioDay, range.rs)}, ${radioRange(range.rs, range.re)}.`, slot });
      await load();
      await onChanged();
    } catch (err) {
      revert();
      setSchedule(before);
      onError(scheduleError(err, 'Could not move that show.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo() {
    if (!moved?.slot) return;
    const { slot } = moved;
    setBusy(true);
    onError('');
    try {
      await updateScheduleSlot({
        id: slot.id,
        name: slot.name,
        day: slot.day,
        startHour: slot.start,
        endHour: slot.end,
        showType: slot.type || 'daytime',
        userId,
      });
      const r = toRadio(slot.day, slot.start, slot.end);
      setMoved({ text: `${slot.name} is back on ${dayLabel(r.radioDay, r.rs)}, ${radioRange(r.rs, r.re)}.` });
      await load();
      await onChanged();
    } catch (err) {
      onError(scheduleError(err, 'Could not undo that move.'));
    } finally {
      setBusy(false);
    }
  }

  const crossing = draft && crossesMidnight(draft.rs, draft.re);
  const stored = draft && !crossing ? toStored(draft.radioDay, draft.rs, draft.re) : null;
  const clashes = draft && !crossing ? clashesFor(schedule, draft.radioDay, draft.rs, draft.re, draft.id) : [];
  const nameTrim = draft ? draft.name.trim() : '';
  const known = shows.some((s) => s.name.trim().toLowerCase() === nameTrim.toLowerCase());
  const shifted =
    draft &&
    (!draft.original ||
      draft.original.radioDay !== draft.radioDay ||
      draft.original.rs !== draft.rs ||
      draft.original.re !== draft.re);
  const canSave = draft && nameTrim && !crossing && clashes.length === 0 && !busy;
  const ghost =
    draft && shifted && !crossing
      ? { radioDay: draft.radioDay, rs: draft.rs, re: draft.re, name: nameTrim, clash: clashes.length > 0 }
      : null;

  async function handleSave(event) {
    event.preventDefault();
    if (!canSave) return;
    setBusy(true);
    setMoved(null);
    onError('');
    try {
      const input = {
        name: draft.name,
        day: stored.day,
        startHour: stored.start,
        endHour: stored.end,
        showType: draft.type,
        userId,
      };
      if (draft.id) await updateScheduleSlot({ ...input, id: draft.id });
      else await addShowToSchedule(input);
      const where = `${dayLabel(draft.radioDay, draft.rs)} ${radioRange(draft.rs, draft.re)}`;
      onMessage(draft.id ? `${nameTrim} updated: ${where}.` : `${nameTrim} added: ${where}.`);
      setDraft(null);
      await load();
      await onChanged();
    } catch (err) {
      onError(scheduleError(err, 'Could not save that slot.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!draft?.id) return;
    setBusy(true);
    setMoved(null);
    onError('');
    try {
      await removeScheduleSlot(draft.id);
      onMessage(`${draft.original.name} was taken off ${dayLabel(draft.original.radioDay, draft.original.rs)}.`);
      setDraft(null);
      setConfirmClear(false);
      await load();
      await onChanged();
    } catch (err) {
      onError(scheduleError(err, 'Could not clear that slot.'));
    } finally {
      setBusy(false);
    }
  }

  function setStart(rs) {
    setDraft((d) => ({ ...d, rs, re: Math.max(d.re, rs + 1) }));
  }

  return (
    <>
      <Heading lede="The weekly timetable, 8am to 8am like the public schedule. Drag a show to move it, drag its top or bottom edge to change its length, or drag across empty time to add one. Changes show on the website straight away.">
        Schedule
      </Heading>
      <ul aria-label="Colour key" className="acct-key">
        {SLOT_TYPES.map((type) => (
          <li key={type}>
            <i aria-hidden="true" style={{ background: `var(--tt-${type})` }} />
            {typeLabel(type)}
          </li>
        ))}
      </ul>

      {moved ? (
        <div role="status" className="acct-notice">
          <span className="acct-notice__text">
            <Tick color="var(--ext)" />
            {moved.text}
          </span>
          {moved.slot ? (
            <button type="button" onClick={handleUndo} disabled={busy}>Undo</button>
          ) : (
            <button type="button" onClick={() => setMoved(null)}>Dismiss</button>
          )}
        </div>
      ) : null}

      {loadError ? (
        <p className="acct-lede">{loadError}</p>
      ) : !schedule ? (
        <p className="acct-loading" role="status">Loading the timetable…</p>
      ) : (
        <div className="acct-sched">
          <div className={`acct-grid-wrap acct-cal${busy ? ' is-busy' : ''}`} role="region" aria-label="Weekly timetable" aria-busy={busy}>
            <ScheduleCalendar
              schedule={schedule}
              now={nowInWeek(now)}
              draft={draft}
              ghost={ghost}
              onOpen={openSlot}
              onCreate={openNew}
              onMove={handleMove}
            />
          </div>

          <aside className="acct-editor" aria-labelledby="ed">
            {draft ? (
              <form onSubmit={handleSave} style={{ display: 'contents' }}>
                <div className="acct-editor__kicker">
                  <span className="acct-label">{draft.id ? 'Editing' : 'New slot'}</span>
                  <h2 id="ed">
                    {draft.id ? draft.original.name : `${dayLabel(draft.radioDay, draft.rs)} ${radioRange(draft.rs, draft.re)}`}
                  </h2>
                </div>
                <Field
                  id="sn"
                  label="Show name"
                  hint={nameTrim && !known ? 'No show has this name yet, so saving creates a new one. Check the spelling.' : ''}>
                  <input
                    id="sn"
                    className="acct-input"
                    list="sn-shows"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Start typing a show"
                    aria-describedby={nameTrim && !known ? 'sn-hint' : undefined}
                    autoComplete="off"
                    autoFocus
                  />
                  <datalist id="sn-shows">
                    {shows.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </Field>
                <div role="group" aria-labelledby="dl" className="acct-field">
                  <span id="dl" className="acct-label">Day</span>
                  <div className="acct-days">
                    {WEEKDAYS.map((day) => (
                      <button key={day} type="button" aria-pressed={draft.radioDay === day} aria-label={day} onClick={() => setDraft({ ...draft, radioDay: day })}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="acct-hours">
                  <Stepper id="sl" label="Starts" value={draft.rs} min={0} max={23} onChange={setStart} />
                  <Stepper id="el" label="Ends" value={draft.re} min={draft.rs + 1} max={24} onChange={(re) => setDraft({ ...draft, re })} />
                </div>
                <p className="acct-hint">
                  {dayLabel(draft.radioDay, draft.rs)}, {radioRange(draft.rs, draft.re)} · {draft.re - draft.rs}{' '}
                  {draft.re - draft.rs === 1 ? 'hour' : 'hours'}
                </p>
                {crossing ? (
                  <p role="alert" className="acct-editor__warn">
                    A slot can&apos;t run past midnight. End this one at 12am and add the rest as a second slot.
                  </p>
                ) : clashes.length ? (
                  <p role="alert" className="acct-editor__warn">
                    Clashes with{' '}
                    {clashes
                      .map((c) => {
                        const r = toRadio(stored.day, c.start, c.end);
                        return `${c.name} (${radioRange(r.rs, r.re)})`;
                      })
                      .join(', ')}
                    . Move or shorten one of them first.
                  </p>
                ) : null}
                <div role="group" aria-labelledby="tl" className="acct-field">
                  <span id="tl" className="acct-label">Type</span>
                  <div className="acct-types">
                    {SLOT_TYPES.map((type) => (
                      <button key={type} type="button" aria-pressed={draft.type === type} onClick={() => setDraft({ ...draft, type })}>
                        <i aria-hidden="true" style={{ background: `var(--tt-${type})` }} />
                        {typeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>
                {confirmClear ? (
                  <div role="alert" className="acct-editor__confirm">
                    <span>
                      Clear {draft.original.name} from {dayLabel(draft.original.radioDay, draft.original.rs)}{' '}
                      {radioRange(draft.original.rs, draft.original.re)}? The slot goes back to empty.
                    </span>
                    <span>
                      <button type="button" className="acct-btn acct-btn--danger acct-btn--sm" disabled={busy} onClick={handleClear}>
                        Yes, clear it
                      </button>
                      <button type="button" className="acct-btn acct-btn--ghost acct-btn--sm" onClick={() => setConfirmClear(false)}>
                        Keep it
                      </button>
                    </span>
                  </div>
                ) : (
                  <div className="acct-editor__actions">
                    <button type="submit" className="acct-btn acct-btn--lg" disabled={!canSave}>
                      {busy ? 'Saving…' : draft.id ? 'Save changes' : 'Add to schedule'}
                    </button>
                    {draft.id ? (
                      <button type="button" className="acct-btn acct-btn--warn acct-btn--lg" disabled={busy} onClick={() => setConfirmClear(true)}>
                        Clear slot
                      </button>
                    ) : null}
                    <button type="button" className="acct-link" onClick={() => setDraft(null)} disabled={busy}>
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <>
                <h2 id="ed" className="acct-h3">Pick a slot</h2>
                <p className="acct-editor__empty">
                  Drag shows to move or resize them; each change saves straight away and can be undone. Choose a show to
                  rename it, change its type or clear it, or click empty time to add one. Esc closes the editor.
                </p>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
