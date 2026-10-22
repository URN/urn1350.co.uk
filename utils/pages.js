import { supabase } from './supabase';

/** Markdown body for /pages/[...slug], e.g. about or committees/2026. */
export async function getWebsitePage(slugParts) {
  const slug = Array.isArray(slugParts) ? slugParts.join('/') : String(slugParts || '');
  if (!slug) return null;

  const { data, error } = await supabase
    .from('website_pages')
    .select('body')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data?.body ?? null;
}
