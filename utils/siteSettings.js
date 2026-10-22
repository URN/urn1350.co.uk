import { supabase } from './supabase';
import Settings from '../settings.json';

export async function getSiteSetting(key, fallback = '') {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value || fallback;
}

export async function setSiteSetting(key, value) {
  const { error } = await supabase.from('site_settings').upsert({
    key,
    value: String(value ?? ''),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function getSpotifyPlaylistId() {
  try {
    return await getSiteSetting('spotify_playlist', Settings.spotifyPlaylist || '');
  } catch {
    return Settings.spotifyPlaylist || '';
  }
}
