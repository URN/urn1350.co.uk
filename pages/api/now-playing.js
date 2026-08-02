import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getStore } from '@netlify/blobs';

const BLOB_STORE = 'now-playing';
const BLOB_KEY = 'current';
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

function normalizeStored(parsed) {
  if (!parsed || typeof parsed !== 'object') return emptyPayload();
  const artist = parsed.artist || '';
  const title = parsed.title || '';
  return {
    ...emptyPayload(),
    ...parsed,
    artist,
    title,
    text: parsed.text || toText(artist, title),
  };
}

function useBlobs() {
  // Netlify Functions inject blob credentials; local next dev uses the file fallback.
  return Boolean(
    process.env.NETLIFY ||
      process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.SITE_ID ||
      process.env.NETLIFY_SITE_ID
  );
}

function getBlobStore() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_API_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN;

  if (siteID && token) {
    return getStore({
      name: BLOB_STORE,
      siteID,
      token,
      consistency: 'strong',
    });
  }

  return getStore({ name: BLOB_STORE, consistency: 'strong' });
}

function readFromFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyPayload();
    return normalizeStored(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  } catch (error) {
    console.error('Error reading now-playing file:', error.message);
    return emptyPayload();
  }
}

function writeToFile(payload) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

async function readStored() {
  if (useBlobs()) {
    try {
      const store = getBlobStore();
      const data = await store.get(BLOB_KEY, {
        type: 'json',
        consistency: 'strong',
      });
      return normalizeStored(data);
    } catch (error) {
      console.error('Error reading now-playing blob:', error.message);
      // Fall through to file for local/netlify-dev edge cases.
    }
  }
  return readFromFile();
}

async function writeStored(payload) {
  if (useBlobs()) {
    const store = getBlobStore();
    await store.setJSON(BLOB_KEY, payload);
    return;
  }
  writeToFile(payload);
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
    const data = await readStored();
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
      await writeStored(payload);
      return res.status(200).json({ success: true, ...payload });
    } catch (error) {
      console.error('Error writing now-playing data:', error.message);
      return res.status(500).json({
        error: 'Unable to store now playing data.',
        detail: error.message,
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
