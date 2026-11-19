// Pure helpers shared by client and server. No crypto, no Supabase.

export const RETENTION_DAYS = 42; // 6 weeks
export const RECORDINGS_TZ = 'Europe/London';

const FILE_RE = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})\.mp3$/;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n) => String(n).padStart(2, '0');
const dateKeyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Parses "YYYY-MM-DD-HH.mp3" strictly. Returns null for anything else. */
export function parseRecordingFile(file) {
  if (typeof file !== 'string' || file.length > 20) return null;
  const match = FILE_RE.exec(file);
  if (!match) return null;
  const [year, month, day, hour] = match.slice(1).map(Number);
  if (hour > 23) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }
  return {
    year,
    month,
    day,
    hour,
    dateKey: dateKeyOf(year, month, day),
    weekday: WEEKDAYS[date.getUTCDay()],
  };
}

export function recordingFileName(dateKey, hour) {
  return `${dateKey}-${pad(hour)}.mp3`;
}

const londonFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: RECORDINGS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

/** Current London wall-clock date (YYYY-MM-DD) and hour (0-23). */
export function londonNowParts(now = new Date()) {
  const parts = Object.fromEntries(
    londonFormatter.formatToParts(now).map((p) => [p.type, p.value]),
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

export function londonToday(now = new Date()) {
  return londonNowParts(now).dateKey;
}

/** Shifts a YYYY-MM-DD key by whole calendar days, with no timezone involved. */
export function shiftDateKey(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return dateKeyOf(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * 'ok' if the recording is finished and within the retention window,
 * 'expired' if older than the window, 'future' if not finished yet.
 */
export function retentionStatus(parsed, now = new Date()) {
  const { dateKey: today, hour: nowHour } = londonNowParts(now);
  const oldest = shiftDateKey(today, -RETENTION_DAYS);
  if (parsed.dateKey < oldest) return 'expired';
  if (parsed.dateKey > today) return 'future';
  if (parsed.dateKey === today && parsed.hour >= nowHour) return 'future';
  return 'ok';
}

/**
 * Expands weekly schedule slots into the hourly recordings of the last
 * RETENTION_DAYS days (newest first). Filenames use London wall-clock time, as
 * do slots, so no timezone conversion is needed.
 * slots: [{ day, start_hour, end_hour, show_id?, name? }]
 */
export function listSlotHours(slots, now = new Date()) {
  const today = londonToday(now);
  const out = [];
  for (let i = 0; i <= RETENTION_DAYS; i += 1) {
    const dateKey = shiftDateKey(today, -i);
    const [y, m, d] = dateKey.split('-').map(Number);
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    for (const slot of slots) {
      if (slot.day !== weekday) continue;
      for (let hour = slot.end_hour - 1; hour >= slot.start_hour; hour -= 1) {
        const file = recordingFileName(dateKey, hour);
        const parsed = parseRecordingFile(file);
        if (parsed && retentionStatus(parsed, now) === 'ok') {
          out.push({ file, dateKey, hour, showName: slot.name ?? '', showId: slot.show_id ?? null });
        }
      }
    }
  }
  return out.sort((a, b) => (a.file < b.file ? 1 : -1));
}
