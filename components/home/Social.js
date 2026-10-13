import React from 'react';

import Reveal from '../Reveal';
import Settings from '../../settings.json';

/** Latest Instagram posts (URLs come from the CDN at build time). Embeds load lazily. */
export function InstagramLatest({ posts }) {
  return (
    <section className="social" aria-labelledby="ig-h">
      <Reveal className="section-head">
        <h2 id="ig-h" className="h-light">Latest at URN</h2>
        <a className="link-arrow" href={`https://instagram.com/${Settings.twitter}`} target="_blank" rel="noopener noreferrer">@{Settings.twitter} on Instagram</a>
      </Reveal>
      <div className="social__feed">
        {posts.map((url, i) => (
          <Reveal className="social__card" delay={i * 90} key={url}>
            <iframe src={url} title={`URN1350 Instagram post ${i + 1}`} loading="lazy" scrolling="no" allow="encrypted-media" />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function SpotifyPlaylist() {
  return (
    <section className="social social--playlist" aria-labelledby="sp-h">
      <Reveal className="section-head">
        <h2 id="sp-h" className="h-light">The URN playlist</h2>
        <a className="link-arrow" href={`https://open.spotify.com/playlist/${Settings.spotifyPlaylist}`} target="_blank" rel="noopener noreferrer">Open in Spotify</a>
      </Reveal>
      <Reveal className="social__playlist" delay={80}>
        <iframe
          src={`https://open.spotify.com/embed/playlist/${Settings.spotifyPlaylist}?utm_source=generator`}
          title="URN playlist on Spotify"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </Reveal>
    </section>
  );
}
