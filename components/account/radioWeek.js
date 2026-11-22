import { WEEKDAYS } from '../../utils/schedule';

// Slots are stored per calendar day as whole hours (0-24). The schedule editor shows the radio
// day instead, 08:00 to 08:00, like the public schedule. In "radio hours" 0 is 8am, 16 is
// midnight and 23 is 7am, so the overnight part of a radio day lives under the next calendar day.
export const DAY_START = 8;
export const MIDNIGHT = 24 - DAY_START;

export function toRadio(day, start, end) {
  if (start >= DAY_START) return { radioDay: day, rs: start - DAY_START, re: end - DAY_START };
  const prev = WEEKDAYS[(WEEKDAYS.indexOf(day) + 6) % 7];
  return { radioDay: prev, rs: start + MIDNIGHT, re: end + MIDNIGHT };
}

export function toStored(radioDay, rs, re) {
  if (rs >= MIDNIGHT) {
    return { day: WEEKDAYS[(WEEKDAYS.indexOf(radioDay) + 1) % 7], start: rs - MIDNIGHT, end: re - MIDNIGHT };
  }
  return { day: radioDay, start: rs + DAY_START, end: re + DAY_START };
}

export function formatHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

export const radioHour = (r) => formatHour(r + DAY_START);
export const radioRange = (rs, re) => `${radioHour(rs)}–${radioHour(re)}`;
export const dayLabel = (radioDay, rs) => (rs >= MIDNIGHT ? `${radioDay} night` : radioDay);

// The calendar works in real dates, so the week is pinned to one fixed week (Mon 1 Jan 2024,
// no clock change). Each radio day is that column's date from 08:00 to 08:00 the next morning.
const REF = new Date(2024, 0, 1);
const HOUR = 3600000;

export function radioToDate(radioDay, r) {
  const d = new Date(REF);
  d.setDate(d.getDate() + WEEKDAYS.indexOf(radioDay));
  return new Date(d.getTime() + (r + DAY_START) * HOUR);
}

/** A calendar range back to a radio-day slot; rs/re can be out of range, callers check. */
export function dateToRadio(start, end) {
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  let index = Math.round((dayStart - REF) / (24 * HOUR));
  let rs = start.getHours() - DAY_START;
  if (rs < 0) {
    index -= 1;
    rs += 24;
  }
  const re = rs + Math.round((end - start) / HOUR);
  return { radioDay: WEEKDAYS[((index % 7) + 7) % 7], rs, re };
}

/** London time now, moved into the pinned week so the calendar can mark today and now. */
export function nowInWeek(now) {
  if (!now) return undefined;
  return new Date(radioToDate(WEEKDAYS[now.dayIndex], 0).getTime() + (now.minutes - DAY_START * 60) * 60000);
}

/** Stored slots that the radio-day range would overlap, ignoring one slot id. */
export function clashesFor(schedule, radioDay, rs, re, ignoreId) {
  if (!schedule || crossesMidnight(rs, re)) return [];
  const stored = toStored(radioDay, rs, re);
  return (schedule[stored.day] || []).filter(
    (slot) => slot.id !== ignoreId && stored.start < slot.end && stored.end > slot.start
  );
}

/** A slot has to sit wholly before or wholly after midnight. */
export const crossesMidnight = (rs, re) => rs < MIDNIGHT && re > MIDNIGHT;
