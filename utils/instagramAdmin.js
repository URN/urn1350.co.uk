import { supabase } from './supabase';
import { toInstagramEmbedUrl } from './instagram';

export async function listInstagramPostsAdmin() {
  const { data, error } = await supabase
    .from('instagram_posts')
    .select('id, embed_url, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateInstagramPost(id, postUrl) {
  const url = toInstagramEmbedUrl(postUrl);
  if (!url) throw new Error('Paste an Instagram post link.');
  const { error } = await supabase
    .from('instagram_posts')
    .update({ embed_url: url, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
