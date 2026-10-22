import { supabase } from './supabase';

export async function listWebsitePages() {
  const { data, error } = await supabase
    .from('website_pages')
    .select('slug, updated_at')
    .order('slug', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getWebsitePageBody(slug) {
  const { data, error } = await supabase
    .from('website_pages')
    .select('slug, body')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveWebsitePageBody(slug, body) {
  const { error } = await supabase
    .from('website_pages')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('slug', slug);
  if (error) throw error;
}
