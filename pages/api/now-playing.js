import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE =
  process.env.NOW_PLAYING_FILE || path.join(DATA_DIR, 'now-playing.json');

function emptyPayload() {
  return {
    station: '',
    artist: '',
    title: '',
    type: '',
    id: '',
    airdatetime: '',
    runtime: '',
    text: '',
    updatedAt: null,
  };
}

function toText(artist, title) {
  if (artist && title) return `${artist} - ${title}`;
  return artist || title || '';
}

function readStored() {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyPayload();
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const artist = parsed.artist || '';
    const title = parsed.title || '';
    return {
      ...emptyPayload(),
      ...parsed,
      artist,
      title,
      text: parsed.text || toText(artist, title),
    };
  } catch (error) {
    console.error('Error reading now-playing data:', error.message);
    return emptyPayload();
  }
}

function writeStored(payload) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function extractSecret(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.trim()) {
    return apiKey.trim();
  }
  return '';
}

function secretsMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeBody(body = {}) {
  const station = String(body.station ?? '').trim();
  const artist = String(body.artist ?? '').trim();
  const title = String(body.title ?? '').trim();
  const type = String(body.type ?? '').trim();
  const id = String(body.id ?? '').trim();
  const airdatetime = String(body.airdatetime ?? '').trim();
  const runtime = String(body.runtime ?? '').trim();

  return {
    station,
    artist,
    title,
    type,
    id,
    airdatetime,
    runtime,
    text: toText(artist, title),
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = readStored();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      artist: data.artist || '',
      title: data.title || '',
      text: data.text || toText(data.artist, data.title),
      station: data.station || '',
      type: data.type || '',
      id: data.id || '',
      airdatetime: data.airdatetime || '',
      runtime: data.runtime || '',
      updatedAt: data.updatedAt || null,
    });
  }

  if (req.method === 'POST') {
    const expected = process.env.NOW_PLAYING_SECRET;
    if (!expected) {
      return res.status(503).json({
        error: 'NOW_PLAYING_SECRET is not configured on the server.',
      });
    }

    if (!secretsMatch(extractSecret(req), expected)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = normalizeBody(req.body || {});
    if (!payload.artist && !payload.title) {
      return res.status(400).json({
        error: 'At least one of artist or title is required.',
      });
    }

    try {
      writeStored(payload);
      return res.status(200).json({ success: true, ...payload });
    } catch (error) {
      console.error('Error writing now-playing data:', error.message);
      return res.status(500).json({ error: 'Unable to store now playing data.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
