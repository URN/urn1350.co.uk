export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAYTIME_START = 8 * 60;
const AFTER_DARK_START = 20 * 60;

/**
 * Turn the raw parsed schedule into something the UI can use directly:
 * automation/unnamed slots dropped, shows sorted, minutes precomputed,
 * and a `tag` ("News" / "Sport") plus `night` flag per show.
 * Output is plain JSON so it can cross the getStaticProps boundary.
 */
export function normaliseSchedule(raw) {
  if (!raw) return null;
  const out = {};
  DAY_NAMES.forEach((day) => {
    out[day] = [];
  });
  // The radio day runs 08:00 to 08:00. A slot the YAML files under "Tuesday 00:00"
  // is really the end of Monday night, so it moves to Monday with minutes past 24:00.
  DAY_NAMES.forEach((day, dayIndex) => {
    (raw[day] || [])
      .filter((s) => s.type !== 'automation' && s.name && s.start != null && s.end != null)
      .forEach((s) => {
        let startMin = Math.round(s.start * 60);
        let endMin = Math.round(s.end * 60);
        let target = dayIndex;
        if (startMin < DAYTIME_START) {
          target = (dayIndex + 6) % 7;
          startMin += 1440;
          endMin += 1440;
        }
        let tag = '';
        if (/^news\b/i.test(s.name)) tag = 'News';
        else if (s.type === 'sport') tag = 'Sport';
        out[DAY_NAMES[target]].push({
          id: s.id,
          name: s.name,
          type: s.type,
          startMin,
          endMin,
          tag,
          night: startMin >= AFTER_DARK_START,
        });
      });
  });
  DAY_NAMES.forEach((day) => out[day].sort((a, b) => a.startMin - b.startMin));
  return out;
}

/**
 * Current UK time on the broadcast clock. Before 08:00 we are still in the
 * previous day's schedule, so the day, date and minutes (counted past 24:00)
 * are shifted back to match how schedule slots are stored.
 */
export function londonNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  let dayIndex = Math.max(0, DAY_NAMES.indexOf(get('weekday')));
  let minutes = Number(get('hour')) * 60 + Number(get('minute'));
  let base = Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')));
  if (minutes < DAYTIME_START) {
    dayIndex = (dayIndex + 6) % 7;
    minutes += 1440;
    base -= 86400000;
  }
  const d = new Date(base);
  return {
    dayIndex,
    minutes,
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    date: d.getUTCDate(),
  };
}

/** "12 October" for each weekday of the current UK week. */
export function weekDates(now) {
  const base = Date.UTC(now.year, now.month - 1, now.date);
  return DAY_NAMES.map((_, i) => {
    const d = new Date(base + (i - now.dayIndex) * 86400000);
    return {
      long: d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long' }),
      short: d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }),
    };
  });
}

export function formatMinutes(min) {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatRange(show) {
  return `${formatMinutes(show.startMin)}–${formatMinutes(show.endMin)}`;
}

export function formatLeft(mins) {
  if (mins <= 0) return 'ending now';
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min left` : `${h} h left`;
}

/** Tags each show as 'now', 'past' or 'next' relative to the clock (only on today's list). */
export function decorate(shows, isToday, now) {
  return shows.map((s) => {
    let state = 'next';
    if (isToday) {
      if (s.startMin <= now.minutes && now.minutes < s.endMin) state = 'now';
      else if (s.endMin <= now.minutes) state = 'past';
    }
    return { ...s, state };
  });
}

export function findCurrent(schedule, now) {
  if (!schedule || !now) return null;
  const shows = schedule[DAY_NAMES[now.dayIndex]] || [];
  return shows.find((s) => s.startMin <= now.minutes && now.minutes < s.endMin) || null;
}

/** The next `count` shows after the current minute, rolling over into later days. */
export function findUpcoming(schedule, now, count = 2) {
  if (!schedule || !now) return [];
  const out = [];
  for (let offset = 0; offset < 8 && out.length < count; offset += 1) {
    const dayIndex = (now.dayIndex + offset) % 7;
    const shows = schedule[DAY_NAMES[dayIndex]] || [];
    shows.forEach((s) => {
      if (out.length >= count) return;
      if (offset === 0 && s.startMin <= now.minutes) return;
      // Label by the real calendar: after midnight the "next broadcast day" is today.
      const post = now.minutes >= 1440;
      const eff = offset - (post ? 1 : 0);
      let when;
      if (offset === 0) when = s.startMin >= 1440 ? (post ? 'tonight' : 'after midnight') : s.startMin >= AFTER_DARK_START ? 'tonight' : 'today';
      else if (eff === 0) when = s.startMin >= AFTER_DARK_START ? 'tonight' : 'today';
      else if (eff === 1) when = 'tomorrow';
      else when = DAY_NAMES[dayIndex];
      out.push({ ...s, offset, dayIndex, when });
    });
  }
  return out;
}
