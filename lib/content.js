// Server-only: fetches and parses the station's CDN content. Import this only from
// getStaticProps / getServerSideProps / API routes so `yaml` never reaches the browser.
import YAML from 'yaml';

import Settings from '../settings.json';
import { normaliseSchedule } from '../utils/schedule';

// Fallback if the CDN list is missing or empty.
const FALLBACK_POSTS = [
  'https://www.instagram.com/p/DdRGRrujBah/embed',
  'https://www.instagram.com/p/DdTjmaRjul8/embed',
  'https://www.instagram.com/p/DdRKwRDjD8R/embed',
];

export async function fetchCdn(path) {
  const res = await fetch(`${Settings.cdnUrl}/${path}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.text();
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const str = (v) => (v ? String(v) : '');

/** Weekly schedule as plain JSON (see normaliseSchedule), or null if unavailable. */
export async function fetchSchedule() {
  try {
    // parseDocument with uniqueKeys:false keeps repeated show names within a day.
    const doc = YAML.parseDocument(await fetchCdn('schedule.yml'), { uniqueKeys: false });
    const raw = {};
    (doc.contents?.items || []).forEach((day) => {
      const shows = day.value?.items;
      if (!day.key || !Array.isArray(shows)) return;
      raw[day.key.value] = shows.map((s, i) => {
        const meta = s.value ? s.value.toJSON() : {};
        return { id: `${day.key.value}-${i}`, name: s.key?.value || '', start: num(meta.start), end: num(meta.end), type: meta.type || 'daytime' };
      });
    });
    return normaliseSchedule(raw);
  } catch (e) {
    return null;
  }
}

/** Podcast list sorted by `order`. Returns [] if the CDN file is unavailable. */
export async function fetchPodcasts() {
  try {
    // Tolerate a common typo: an extra space before the list dash.
    const parsed = YAML.parse((await fetchCdn('Podcasts/podcasts.yml')).replace(/^ {3}- /gm, '  - '));
    return (Array.isArray(parsed?.podcasts) ? parsed.podcasts : [])
      .filter((p) => p && p.slug && p.title)
      .map((p) => ({
        slug: String(p.slug),
        title: String(p.title),
        image: str(p.image),
        host: str(p.host),
        description: str(p.description).trim(),
        instagram: str(p.instagram),
        instagramlink: str(p.instagramlink),
        guests: str(p.guests),
        spotifyEmbed: str(p.spotifyEmbed),
        tiktoklink: str(p.tiktoklink),
        tiktokEmbed: str(p.tiktokEmbed),
        featured: p.featured === true || p.featured === 'yes' || p.featured === 'true',
        order: num(p.order) ?? 999,
      }))
      .sort((a, b) => a.order - b.order);
  } catch (e) {
    return [];
  }
}

/** The (up to) three Instagram embed URLs shown on the home page. */
export async function fetchInstagramPosts() {
  try {
    const urls = (YAML.parse(await fetchCdn('instagram_links.yml'))?.posts || [])
      .map((p) => (typeof p === 'string' ? p : p?.url))
      .filter(Boolean)
      .slice(0, 3);
    return urls.length ? urls : FALLBACK_POSTS;
  } catch (e) {
    return FALLBACK_POSTS;
  }
}
