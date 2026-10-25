import { supabase } from './supabase';

/** Fixed committee seats shown in Manage admins (in order). Access is chosen per person on the website. */
export const COMMITTEE_ROLES = [
  'Head of Station',
  'Deputy Head of Station',
  'Head of Daytime Programming',
  'Head of Cultural Programming',
  'Head of Specialist Music Programming',
  'Head of News Programming',
  'Head of Sports Programming',
  'Head of Music',
  'Head of Technology and Digital',
  'Head of Graphics and Imaging',
  'Head of Online Content',
  'Head of Audio Production',
  'Head of Finance',
  'Head of Welfare',
  'Social Secretary',
];

export const ACCESS_LEVELS = [
  { value: 'full', label: 'Full (includes Manage admins)' },
  { value: 'station', label: 'Station (all except Manage admins)' },
  { value: 'music', label: 'Music (Spotify only)' },
  { value: 'shows', label: 'Shows (shows + schedule)' },
];

export function normalizeAccessLevel(access) {
  const value = String(access || '').trim().toLowerCase();
  if (value === 'full' || value === 'station' || value === 'music' || value === 'shows') {
    return value;
  }
  return 'shows';
}

export function permissionsForAccess(access) {
  const level = normalizeAccessLevel(access);
  const full = level === 'full';
  const station = level === 'station' || full;
  const music = level === 'music';
  const shows = level === 'shows' || station;
  return {
    access: level,
    canManageAdmins: full,
    canManageShows: shows,
    canEditSchedule: shows,
    canManageWebsite: station || music,
    canManageWebsiteFull: station,
    canManageSpotify: station || music,
    canManageApp: station,
  };
}

export function permissionsForAdmin(admin) {
  if (!admin) return permissionsForAccess(null);
  return permissionsForAccess(admin.access_level);
}

/** Admin row + optional presenter display name. */
export async function getAdminInfo(email) {
  const { data, error } = await supabase
    .from('admins')
    .select('email, role, access_level, is_extra')
    .ilike('email', email)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function listAdminsWithNames() {
  const { data: admins, error } = await supabase
    .from('admins')
    .select('email, role, access_level, is_extra')
    .order('role', { ascending: true });
  if (error) throw error;

  const rows = admins ?? [];
  if (rows.length === 0) return [];

  const emails = rows.map((row) => row.email);
  const { data: presenters, error: presenterError } = await supabase
    .from('presenters')
    .select('email, display_name')
    .in('email', emails);
  if (presenterError) throw presenterError;

  const nameByEmail = new Map(
    (presenters ?? []).map((row) => [String(row.email || '').toLowerCase(), row.display_name])
  );

  return rows.map((row) => ({
    ...row,
    display_name: nameByEmail.get(String(row.email || '').toLowerCase()) || null,
  }));
}

/** Assign or clear a fixed committee seat. Empty email removes that seat's admin. */
export async function setCommitteeAdmin(title, email, accessLevel) {
  if (!COMMITTEE_ROLES.includes(title)) throw new Error('Unknown committee role.');

  const trimmed = String(email || '').trim().toLowerCase();
  const access = normalizeAccessLevel(accessLevel);

  const { data: existing, error: existingError } = await supabase
    .from('admins')
    .select('email')
    .eq('role', title)
    .eq('is_extra', false)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!trimmed) {
    if (existing?.email) {
      const { error } = await supabase.from('admins').delete().ilike('email', existing.email);
      if (error) throw error;
    }
    return;
  }

  if (existing?.email && existing.email.toLowerCase() !== trimmed) {
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .ilike('email', existing.email);
    if (deleteError) throw deleteError;
  }

  const { error } = await supabase.from('admins').upsert(
    {
      email: trimmed,
      role: title,
      access_level: access,
      is_extra: false,
    },
    { onConflict: 'email' }
  );
  if (error) throw error;
}

export async function addExtraAdmin(email, roleLabel, accessLevel) {
  const trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed) throw new Error('Enter an email address.');
  const label = String(roleLabel || '').trim() || 'Technical Team';
  const { error } = await supabase.from('admins').upsert(
    {
      email: trimmed,
      role: label,
      access_level: normalizeAccessLevel(accessLevel || 'full'),
      is_extra: true,
    },
    { onConflict: 'email' }
  );
  if (error) throw error;
}

export async function updateExtraAdmin(email, roleLabel, accessLevel) {
  const trimmed = String(email || '').trim();
  if (!trimmed) throw new Error('Missing email.');
  const label = String(roleLabel || '').trim() || 'Technical Team';
  const { error } = await supabase
    .from('admins')
    .update({
      role: label,
      access_level: normalizeAccessLevel(accessLevel),
      is_extra: true,
    })
    .ilike('email', trimmed);
  if (error) throw error;
}

export async function removeAdmin(email) {
  const trimmed = String(email || '').trim();
  if (!trimmed) throw new Error('Missing email.');
  const { error } = await supabase.from('admins').delete().ilike('email', trimmed);
  if (error) throw error;
}
