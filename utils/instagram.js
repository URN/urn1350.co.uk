import { supabase } from './supabase';

const FALLBACK_POSTS = [
  'https://www.instagram.com/p/DdRGRrujBah/embed',
  'https://www.instagram.com/p/DdTjmaRjul8/embed',
  'https://www.instagram.com/p/DdRKwRDjD8R/embed',
];

/** Normalise any Instagram post/reel URL to the embed form used on the homepage. */
export function toInstagramEmbedUrl(url) {
  let trimmed = String(url || '').trim();
  if (!trimmed) return null;
  trimmed = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '');
  trimmed = trimmed.replace(/\/embed$/i, '');
  if (!trimmed) return null;
  return `${trimmed}/embed`;
}

/** Strip /embed for display in the admin form. */
export function toInstagramPostUrl(url) {
  const embed = toInstagramEmbedUrl(url);
  if (!embed) return '';
  return embed.replace(/\/embed$/i, '');
}

/** Up to three Instagram embed URLs for the homepage strip. */
export async function listInstagramPosts() {
  const { data, error } = await supabase
    .from('instagram_posts')
    .select('embed_url, sort_order')
    .order('sort_order', { ascending: true })
    .limit(3);

  if (error) throw error;

  const urls = (data ?? []).map((row) => toInstagramEmbedUrl(row.embed_url)).filter(Boolean);
  return urls.length > 0 ? urls : FALLBACK_POSTS;
}

export { FALLBACK_POSTS };
