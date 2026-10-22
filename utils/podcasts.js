import { supabase } from './supabase';

function instagramHandle(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (trimmed.startsWith('@')) return trimmed;
  const match = trimmed.match(/instagram\.com\/([^/?#]+)/i);
  return match ? `@${match[1]}` : null;
}

/** Same shape the podcast cards / detail page used with podcasts.yml. */
export function podcastFromShow(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.name,
    image: row.image_url,
    host: row.host,
    description: row.description,
    guests: row.guests,
    instagram: instagramHandle(row.instagram_url),
    instagramlink: row.instagram_url,
    spotifyEmbed: row.spotify_playlist_url,
    tiktoklink: row.tiktok_url,
    featured: row.featured === true,
    order: row.sort_order ?? 999,
  };
}

export async function listPodcasts() {
  const { data, error } = await supabase
    .from('shows')
    .select(
      'slug, name, image_url, host, description, guests, instagram_url, spotify_playlist_url, tiktok_url, featured, sort_order, kind, visible'
    )
    .eq('kind', 'podcast')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.visible !== false && row.slug)
    .map(podcastFromShow);
}

export async function getPodcastBySlug(slug) {
  if (!slug) return null;

  const { data, error } = await supabase
    .from('shows')
    .select(
      'slug, name, image_url, host, description, guests, instagram_url, spotify_playlist_url, tiktok_url, featured, sort_order, kind, visible'
    )
    .eq('kind', 'podcast')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.visible === false) return null;
  return podcastFromShow(data);
}
