const ITUNES_URL = 'https://itunes.apple.com/search';
const TIMEOUT_MS = 4000;

function clean(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Loose check so a wrong artist's cover never shows: one name must contain the other.
function artistsMatch(wanted, found) {
  const a = clean(wanted);
  const b = clean(found);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

// Looks up cover art for a track via the iTunes Search API (no key needed).
// Returns a 600px image URL, or null when nothing trustworthy is found.
export async function findArtwork(artist, title) {
  if (!artist || !title) return null;
  try {
    const url = new URL(ITUNES_URL);
    url.searchParams.set('term', `${artist} ${title}`);
    url.searchParams.set('entity', 'song');
    url.searchParams.set('country', 'GB');
    url.searchParams.set('limit', '5');
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const { results = [] } = await res.json();
    const hit = results.find((r) => artistsMatch(artist, r.artistName) && r.artworkUrl100);
    return hit ? hit.artworkUrl100.replace('100x100bb', '600x600bb') : null;
  } catch (error) {
    console.error('Artwork lookup failed:', error.message);
    return null;
  }
}
