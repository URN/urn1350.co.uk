import { supabase } from './supabase';
import { listSlotHours } from '../lib/recordings.mjs';

/** Hourly recordings (newest first) from the user's shows in the last 6 weeks. */
export async function listMyRecordingSlots(userId) {
  const { data: memberships, error: memberError } = await supabase
    .from('show_members')
    .select('show_id')
    .eq('presenter_id', userId)
    .eq('status', 'approved');
  if (memberError) throw memberError;
  const showIds = (memberships ?? []).map((row) => row.show_id).filter(Boolean);
  if (showIds.length === 0) return [];

  const { data: slots, error } = await supabase
    .from('schedule_slots')
    .select('day, start_hour, end_hour, name, show_id')
    .in('show_id', showIds);
  if (error) throw error;
  return listSlotHours(slots ?? []);
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
