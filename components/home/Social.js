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
