import { fetchSchedule } from '../../lib/content';

// Normalised weekly schedule for the client. Cached at the edge so every visitor
// does not hit the CDN.
export default async function handler(req, res) {
  const schedule = await fetchSchedule();
  if (!schedule) return res.status(502).json({ error: 'Schedule unavailable' });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).json(schedule);
}
