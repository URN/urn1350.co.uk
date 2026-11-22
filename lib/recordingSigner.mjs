// SERVER ONLY. Imports node:crypto; never import this from client code.
import crypto from 'node:crypto';

export const RECORDINGS_ORIGIN = 'https://recordings.urn1350.co.uk';

/**
 * Signs a recording URL for nginx secure_link:
 *   secure_link_md5 "$secure_link_expires$uri <SECRET>";
 * `uri` is the decoded path starting with "/".
 */
export function signRecordingUrl(uri, secret, ttlSeconds = 12 * 3600, nowMs = Date.now()) {
  if (!secret) throw new Error('RECORDINGS_SECRET is not set');
  const expires = Math.floor(nowMs / 1000) + ttlSeconds;
  const md5 = crypto
    .createHash('md5')
    .update(`${expires}${uri} ${secret}`)
    .digest('base64url'); // Node's base64url has no padding
  return `${RECORDINGS_ORIGIN}${uri}?md5=${md5}&expires=${expires}`;
}
