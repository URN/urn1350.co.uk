export function initials(title) {
  const words = String(title).replace(/[^\p{L}\p{N}\s']/gu, ' ').split(/\s+/).filter(Boolean);
  const skip = new Set(['the', 'a', 'an', 'of', 'and', 'on', 'off']);
  const meaningful = words.filter((w) => !skip.has(w.toLowerCase()));
  const pick = (meaningful.length >= 2 ? meaningful : words).slice(0, 2);
  return pick.map((w) => w[0].toUpperCase()).join('') || 'U';
}

export function toSpotifyEmbedUrl(value) {
  if (!value) return '';
  if (value.includes('/embed/show/')) return value.split('?')[0];
  const match = value.split('?')[0].match(/open\.spotify\.com\/show\/([^/]+)/i);
  return match && match[1] ? `https://open.spotify.com/embed/show/${match[1]}` : '';
}

export function toSpotifyShowUrl(value) {
  if (!value) return '';
  const clean = value.split('?')[0];
  const match = clean.match(/open\.spotify\.com\/(?:embed\/)?show\/([^/]+)/i);
  return match && match[1] ? `https://open.spotify.com/show/${match[1]}` : '';
}

/**
 * TikTok: optional `tiktokEmbed` (full embed URL), or `tiktoklink` profile/video URL.
 * Profile: https://www.tiktok.com/@handle -> embed/@handle
 * Video:   .../video/123 -> embed/v2/123
 */
export function toTikTokEmbedUrl(data) {
  const direct = data.tiktokEmbed && String(data.tiktokEmbed).trim();
  if (direct && direct.includes('tiktok.com/embed')) return direct.split('?')[0];
  const link = data.tiktoklink && String(data.tiktoklink).trim();
  if (!link) return '';
  if (link.includes('tiktok.com/embed')) return link.split('?')[0];
  const video = link.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (video && video[1]) return `https://www.tiktok.com/embed/v2/${video[1]}`;
  const profile = link.match(/tiktok\.com\/@([^/?&#]+)/i);
  return profile && profile[1] ? `https://www.tiktok.com/embed/@${profile[1]}` : '';
}
