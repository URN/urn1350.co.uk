import { supabase } from './supabase';
import { DAY_ORDER, SHOW_TYPES } from './schedule';
import { getAdminInfo } from './adminAccess';

const SLOT_TYPES = [...SHOW_TYPES, 'automation'];

export function getShowKind(show) {
  return show?.kind === 'podcast' ? 'podcast' : 'radio';
}

export function isShowVisible(show) {
  return show?.visible !== false;
}

export { getAdminInfo };

export async function isAdminEmail(email) {
  return (await getAdminInfo(email)) != null;
}

export async function listMyShows(userId) {
  const { data, error } = await supabase
    .from('show_members')
    .select('shows(*)')
    .eq('presenter_id', userId)
    .eq('status', 'approved');
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.shows)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listMyPendingShowIds(userId) {
  const { data, error } = await supabase
    .from('show_members')
    .select('show_id')
    .eq('presenter_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.show_id));
}

export async function listAllShows() {
  const { data, error } = await supabase.from('shows').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function listScheduledShows() {
  const [shows, slots] = await Promise.all([
    listAllShows(),
    supabase.from('schedule_slots').select('name'),
  ]);
  if (slots.error) throw slots.error;
  const names = new Set((slots.data ?? []).map((row) => row.name.trim().toLowerCase()));
  return shows.filter((show) => names.has(show.name.trim().toLowerCase()));
}

export async function requestToJoinShow(showId, userId) {
  const { error } = await supabase
    .from('show_members')
    .insert({ show_id: showId, presenter_id: userId, status: 'pending' });
  if (error) throw error;
}

export async function leaveShow(showId, userId) {
  const { error } = await supabase
    .from('show_members')
    .delete()
    .eq('show_id', showId)
    .eq('presenter_id', userId);
  if (error) throw error;
}

export async function updateShowKind(showId, kind) {
  const { error } = await supabase
    .from('shows')
    .update({ kind, updated_at: new Date().toISOString() })
    .eq('id', showId);
  if (error) throw error;
}

export async function setShowVisibility(showId, visible) {
  const { error } = await supabase
    .from('shows')
    .update({ visible, updated_at: new Date().toISOString() })
    .eq('id', showId);
  if (error) throw error;
}

export async function updateShowLinks(showId, links) {
  const { error } = await supabase
    .from('shows')
    .update({ ...links, updated_at: new Date().toISOString() })
    .eq('id', showId);
  if (error) throw error;
}

async function createShow(name, userId) {
  const { data, error } = await supabase
    .from('shows')
    .insert({ name, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function assertSlot({ name, day, startHour, endHour, showType }) {
  if (!name.trim()) throw new Error('Give the show a name first.');
  if (!DAY_ORDER[day]) throw new Error('Pick a day.');
  if (!SLOT_TYPES.includes(showType)) throw new Error('Pick a show type.');
  if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || endHour <= startHour) {
    throw new Error('The end hour has to be later than the start hour.');
  }
  if (startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24) {
    throw new Error('Use a start hour from 0 to 23 and an end hour from 1 to 24.');
  }
}

async function showForName(name, userId) {
  const existing = await listAllShows();
  const found = existing.find((row) => row.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (found) return found;
  return createShow(name.trim(), userId);
}

async function assertNoOverlap(day, startHour, endHour, ignoreId) {
  const { data, error } = await supabase
    .from('schedule_slots')
    .select('id, start_hour, end_hour')
    .eq('day', day);
  if (error) throw error;
  const overlap = (data ?? []).some(
    (slot) => slot.id !== ignoreId && startHour < slot.end_hour && endHour > slot.start_hour
  );
  if (overlap) throw new Error(`That time is already taken on ${day}.`);
}

/** Keep the public schedule in time order after a slot is added, moved, or removed. */
async function resequenceDay(day) {
  const { data, error } = await supabase
    .from('schedule_slots')
    .select('id')
    .eq('day', day)
    .order('start_hour', { ascending: true });
  if (error) throw error;
  const slots = data ?? [];
  for (let index = 0; index < slots.length; index += 1) {
    const { error: bumpError } = await supabase
      .from('schedule_slots')
      .update({ slot_order: 200 + index })
      .eq('id', slots[index].id);
    if (bumpError) throw bumpError;
  }
  for (let index = 0; index < slots.length; index += 1) {
    const { error: setError } = await supabase
      .from('schedule_slots')
      .update({ slot_order: index })
      .eq('id', slots[index].id);
    if (setError) throw setError;
  }
}

export async function addShowToSchedule({ name, day, startHour, endHour, showType, userId }) {
  assertSlot({ name, day, startHour, endHour, showType });
  const show = await showForName(name, userId);
  await assertNoOverlap(day, startHour, endHour);

  const { data: daySlots, error: dayError } = await supabase
    .from('schedule_slots')
    .select('slot_order')
    .eq('day', day);
  if (dayError) throw dayError;

  const slotOrder = (daySlots ?? []).reduce((max, slot) => Math.max(max, slot.slot_order), -1) + 1;
  const { error } = await supabase.from('schedule_slots').insert({
    day,
    day_order: DAY_ORDER[day],
    slot_order: slotOrder,
    name: show.name,
    start_hour: startHour,
    end_hour: endHour,
    show_type: showType,
    show_id: show.id,
  });
  if (error) throw error;
  await resequenceDay(day);
  return show;
}

export async function updateScheduleSlot({ id, name, day, startHour, endHour, showType, userId }) {
  assertSlot({ name, day, startHour, endHour, showType });
  const show = await showForName(name, userId);

  const { data: current, error: currentError } = await supabase
    .from('schedule_slots')
    .select('day')
    .eq('id', id)
    .single();
  if (currentError) throw currentError;

  await assertNoOverlap(day, startHour, endHour, id);
  const { error } = await supabase
    .from('schedule_slots')
    .update({
      day,
      day_order: DAY_ORDER[day],
      name: show.name,
      start_hour: startHour,
      end_hour: endHour,
      show_type: showType,
      show_id: show.id,
    })
    .eq('id', id);
  if (error) throw error;

  await resequenceDay(day);
  if (current.day !== day) await resequenceDay(current.day);
  return show;
}

export async function removeScheduleSlot(id) {
  const { data, error: readError } = await supabase
    .from('schedule_slots')
    .select('day')
    .eq('id', id)
    .single();
  if (readError) throw readError;

  const { error } = await supabase.from('schedule_slots').delete().eq('id', id);
  if (error) throw error;
  await resequenceDay(data.day);
}

export async function listPendingRequests() {
  const { data, error } = await supabase
    .from('show_members')
    .select('show_id, presenter_id, shows(name), presenters(display_name, email)')
    .eq('status', 'pending');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    show_id: row.show_id,
    presenter_id: row.presenter_id,
    show_name: row.shows?.name ?? 'Unknown show',
    presenter_name: row.presenters?.display_name ?? row.presenters?.email ?? 'Unknown presenter',
  }));
}

export async function approveRequest(showId, presenterId) {
  const { error } = await supabase
    .from('show_members')
    .update({ status: 'approved' })
    .eq('show_id', showId)
    .eq('presenter_id', presenterId);
  if (error) throw error;
}

export async function rejectRequest(showId, presenterId) {
  const { error } = await supabase
    .from('show_members')
    .delete()
    .eq('show_id', showId)
    .eq('presenter_id', presenterId);
  if (error) throw error;
}

export async function listPresenters() {
  const { data, error } = await supabase
    .from('presenters')
    .select('id, display_name, email')
    .order('display_name');
  if (error) throw error;
  return data ?? [];
}

export async function addMemberToShow(showId, presenterId) {
  const { error } = await supabase
    .from('show_members')
    .upsert({ show_id: showId, presenter_id: presenterId, status: 'approved' });
  if (error) throw error;
}

export async function removeMemberFromShow(showId, presenterId) {
  const { error } = await supabase
    .from('show_members')
    .delete()
    .eq('show_id', showId)
    .eq('presenter_id', presenterId);
  if (error) throw error;
}

export async function listShowPresenters(showId) {
  const { data, error } = await supabase
    .from('show_members')
    .select('presenters(id, display_name, email)')
    .eq('show_id', showId)
    .eq('status', 'approved');
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.presenters)
    .filter(Boolean)
    .sort((a, b) => (a.display_name ?? a.email).localeCompare(b.display_name ?? b.email));
}

export async function uploadShowImage(showId, file, kind = 'radio') {
  const isPng = (file.type || '').includes('png');
  const ext = isPng ? 'png' : 'jpg';
  const bucket = kind === 'podcast' ? 'podcast-images' : 'show-images';
  const path = `${showId}/cover.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || (isPng ? 'image/png' : 'image/jpeg'),
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const imageUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error: updateError } = await supabase
    .from('shows')
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', showId);
  if (updateError) throw updateError;
  return imageUrl;
}
