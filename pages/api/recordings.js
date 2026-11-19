import { createClient } from '@supabase/supabase-js';
import { isAllowedEmail } from '../../lib/allowedEmail.mjs';
import { parseRecordingFile, retentionStatus, slotBelongsToShows } from '../../lib/recordings.mjs';
import { signRecordingUrl } from '../../lib/recordingSigner.mjs';

// Exact (case-insensitive) email match against the admins table, as the caller.
// ilike treats "_" and "%" as wildcards, so compare the results exactly.
async function isAdminUser(supabase, email) {
  const lower = (email || '').toLowerCase();
  if (!lower) return false;
  const { data, error } = await supabase.from('admins').select('email').ilike('email', lower);
  if (error) throw error;
  return (data ?? []).some((row) => (row.email || '').toLowerCase() === lower);
}

/**
 * GET /api/recordings?file=YYYY-MM-DD-HH.mp3
 * Authorization: Bearer <supabase access token>
 * Returns { url } - a short-lived signed link to recordings.urn1350.co.uk.
 * The MP3 itself is never proxied through this function.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const file = req.query.file;
  const parsed = parseRecordingFile(file);
  if (!parsed) return res.status(400).json({ error: 'bad_file' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'unauthenticated' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return res.status(500).json({ error: 'server_misconfigured' });

  // Anon key + the caller's own token: queries run under their RLS, no admin keys.
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return res.status(401).json({ error: 'unauthenticated' });
    if (!isAllowedEmail(user.email)) return res.status(403).json({ error: 'forbidden' });

    const status = retentionStatus(parsed);
    if (status === 'expired') return res.status(410).json({ error: 'expired' });
    if (status === 'future') return res.status(404).json({ error: 'not_found' });

    // Presenters: scope explicitly to the caller; don't rely on RLS to hide other rows.
    const { data: memberships, error: memberError } = await supabase
      .from('show_members')
      .select('show_id, shows(id, name)')
      .eq('presenter_id', user.id)
      .eq('status', 'approved');
    if (memberError) throw memberError;
    const shows = (memberships ?? []).map((row) => row.shows).filter(Boolean);

    let allowed = false;
    if (shows.length > 0) {
      const { data: slots, error: slotError } = await supabase
        .from('schedule_slots')
        .select('name, show_id')
        .eq('day', parsed.weekday)
        .lte('start_hour', parsed.hour)
        .gt('end_hour', parsed.hour);
      if (slotError) throw slotError;
      allowed = (slots ?? []).some((slot) => slotBelongsToShows(slot, shows));
    }

    if (!allowed) {
      // Admins may fetch any recording. Each such access is logged (no secrets or URLs).
      if (!(await isAdminUser(supabase, user.email))) {
        return res.status(403).json({ error: 'forbidden' });
      }
      console.log(JSON.stringify({ event: 'recording_admin_access', admin: user.id, file }));
    }

    const secret = process.env.RECORDINGS_SECRET;
    if (!secret) return res.status(500).json({ error: 'server_misconfigured' });
    return res.status(200).json({ url: signRecordingUrl(`/${file}`, secret) });
  } catch (err) {
    console.error('recordings api error:', err instanceof Error ? err.message : 'unknown');
    return res.status(500).json({ error: 'server_error' });
  }
}
