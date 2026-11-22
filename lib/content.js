// Server-side loaders for the public site's content, read from Supabase. Used from
// getStaticProps / getServerSideProps / API routes so pages stay statically generated.
import { fetchSchedule as fetchScheduleRows, normaliseSchedule } from '../utils/schedule';
import { listPodcasts } from '../utils/podcasts';
import { FALLBACK_POSTS, listInstagramPosts } from '../utils/instagram';

const str = (v) => (v ? String(v) : '');

/** Weekly schedule as plain JSON (see normaliseSchedule), or null if unavailable. */
export async function fetchSchedule() {
  try {
    return normaliseSchedule(await fetchScheduleRows());
  } catch (e) {
    return null;
  }
}

/** Podcast list sorted by `order`. Returns [] if Supabase is unavailable. */
export async function fetchPodcasts() {
  try {
    return (await listPodcasts())
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
        tiktokEmbed: '',
        featured: p.featured === true,
        order: Number.isFinite(Number(p.order)) ? Number(p.order) : 999,
      }));
  } catch (e) {
    return [];
  }
}

/** The (up to) three Instagram embed URLs shown on the home page. */
export async function fetchInstagramPosts() {
  try {
    return await listInstagramPosts();
  } catch (e) {
    return FALLBACK_POSTS;
  }
}
