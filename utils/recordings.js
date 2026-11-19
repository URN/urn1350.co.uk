import { supabase } from './supabase';
import { listSlotHours, slotBelongsToShows } from '../lib/recordings.mjs';

/** Hourly recordings (newest first) for one show in the last 6 weeks. */
export async function listShowRecordingSlots(show) {
  const { data: slots, error } = await supabase
    .from('schedule_slots')
    .select('day, start_hour, end_hour, name, show_id');
  if (error) throw error;
  return listSlotHours((slots ?? []).filter((slot) => slotBelongsToShows(slot, [show])));
}

const ERROR_MESSAGES = {
  401: 'Please sign in again.',
  403: 'Not available.',
  404: 'Recording not found.',
  410: 'Older than 6 weeks, so no longer available.',
};

/** Asks the API for a freshly signed link. Called on click, never on page load. */
export async function requestRecordingUrl(file) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error(ERROR_MESSAGES[401]);
  const res = await fetch(`/api/recordings?file=${encodeURIComponent(file)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(ERROR_MESSAGES[res.status] || 'Could not get the recording. Try again.');
  }
  const body = await res.json();
  return body.url;
}
