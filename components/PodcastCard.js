import React, { useState } from 'react';
import Link from 'next/link';

import Reveal from './Reveal';
import { ArrowIcon } from './Icons';
import { initials } from '../utils/podcasts';

const SWATCHES = ['#c4b5fd', '#d8b4fe', '#b6a8d2', '#43d7fb', '#fc7588', '#f0743a', '#fefbf3', '#8a66cc'];

function swatchFor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return SWATCHES[h % SWATCHES.length];
}

/** Show artwork, or a pixel-initials block if it is missing or fails to load. */
export function PodcastArt({ podcast, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (podcast.image && !failed) {
    return (
      <img
        className={`art ${className}`}
        src={podcast.image}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className={`art art--mark ${className}`} style={{ background: swatchFor(podcast.slug) }} aria-hidden="true">
      {initials(podcast.title)}
    </span>
  );
}

export default function PodcastCard({ podcast, index = 0 }) {
  return (
    <Reveal as="li" className="pod" delay={Math.min(index, 5) * 70}>
      <Link href={`/podcasts/${podcast.slug}`} className="pod__link">
        <PodcastArt podcast={podcast} className="pod__art" />
        <span className="pod__body">
          <span className="pod__title">{podcast.title}</span>
          {podcast.host ? <span className="muted pod__host">Hosted by {podcast.host}</span> : null}
          {podcast.description ? <span className="pod__desc">{podcast.description}</span> : null}
          <span className="pod__cta">Listen<ArrowIcon /></span>
        </span>
      </Link>
    </Reveal>
  );
}
