import YAML from 'yaml';

import { supabase } from './supabase';

export const SHOW_TYPES = [
  'breakfast',
  'daytime',
  'drivetime',
  'sport',
  'pre-club',
  'after-dark',
];

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

function toHour(value) {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Filled shows plus the empty stretches between them, from midnight to midnight. */
export function blocksForDay(slots) {
  const sorted = [...(slots || [])]
    .filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end) && slot.end > slot.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const blocks = [];
  let cursor = 0;
  for (const slot of sorted) {
    if (slot.start > cursor) {
      blocks.push({ kind: 'empty', start: cursor, end: slot.start });
    }
    blocks.push({
      kind: 'show',
      id: slot.id,
      name: slot.name,
      start: slot.start,
      end: slot.end,
      type: slot.type || 'daytime',
    });
    cursor = Math.max(cursor, slot.end);
  }
  if (cursor < 24) {
    blocks.push({ kind: 'empty', start: cursor, end: 24 });
  }
  return blocks;
}

export function parseScheduleYaml(rawYaml) {
  if (!rawYaml) return null;

  const doc = YAML.parseDocument(rawYaml, { uniqueKeys: false });
  const result = {};

  if (!doc || !doc.contents || !Array.isArray(doc.contents.items)) {
    return result;
  }

  doc.contents.items.forEach((dayItem) => {
    const dayName = dayItem && dayItem.key ? dayItem.key.value : null;
    const dayMap = dayItem && dayItem.value && dayItem.value.items;

    if (!dayName || !Array.isArray(dayMap)) {
      return;
    }

    result[dayName] = dayMap.map((showItem, index) => {
      const showName = showItem && showItem.key ? showItem.key.value : '';
      const meta = showItem && showItem.value ? showItem.value.toJSON() : {};
      return {
        id: `${dayName}-${index}`,
        name: showName,
        start: toHour(meta.start),
        end: toHour(meta.end),
        type: meta.type || 'daytime',
      };
    });
  });

  return result;
}

/**
 * Same shape as parseScheduleYaml: { Monday: [{ id, name, start, end, type }] }.
 * Reads schedule_slots from the app's Supabase project.
 */
export async function fetchSchedule() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  const { data, error } = await supabase
    .from('schedule_slots')
    .select('id, day, name, start_hour, end_hour, show_type')
    .order('day_order', { ascending: true })
    .order('slot_order', { ascending: true });

  if (error) throw error;

  const schedule = {};
  for (const row of data ?? []) {
    if (!schedule[row.day]) schedule[row.day] = [];
    schedule[row.day].push({
      id: row.id,
      name: row.name,
      start: row.start_hour,
      end: row.end_hour,
      type: row.show_type,
    });
  }
  return schedule;
}
