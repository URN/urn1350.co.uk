import { supabase } from './supabase';

export async function loadPresenterProfile(userId) {
  const { data, error } = await supabase
    .from('presenters')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensurePresenterRow(userId, email, displayName) {
  const { error } = await supabase.from('presenters').upsert(
    { id: userId, email, display_name: displayName },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) throw error;
}

export async function savePresenterProfile(profile) {
  const { error } = await supabase
    .from('presenters')
    .upsert({ ...profile, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function uploadAvatar(userId, file) {
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function isValidSpotifyUrl(url) {
  return url.startsWith('https://open.spotify.com/');
}
