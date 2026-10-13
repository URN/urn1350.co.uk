import React, { useState } from 'react';
import Link from 'next/link';

import Reveal from './Reveal';
import { ArrowIcon } from './Icons';
import { initials } from '../utils/podcasts';

const SWATCHES = ['#9cd854', '#feda86', '#b6a8d2', '#43d7fb', '#fc7588', '#f0743a', '#fefbf3', '#8a66cc'];

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

/** Pulls a "trigger warning: …" style note out of a description so it can sit above the blurb. */
export function contentNote(description) {
  const m = /(trigger warning|content warning|content note)s?\s*[:\-–]\s*([^.!\n]+)/i.exec(description || '');
  return m ? `Content note: ${m[2].trim().replace(/^and\s+/i, '')}` : '';
}

export default function PodcastCard({ podcast, index = 0 }) {
  const note = contentNote(podcast.description);
  return (
    <Reveal as="li" className="pod" delay={Math.min(index, 5) * 70}>
      <Link href={`/podcasts/${podcast.slug}`} className="pod__link">
        <PodcastArt podcast={podcast} className="pod__art" />
        <span className="pod__body">
          <span className="pod__title">{podcast.title}</span>
          {podcast.host ? <span className="muted pod__host">Hosted by {podcast.host}</span> : null}
          {note ? <span className="tag tag--note">{note}</span> : null}
          {podcast.description ? <span className="pod__desc">{podcast.description}</span> : null}
          <span className="pod__cta">Listen<ArrowIcon /></span>
        </span>
      </Link>
    </Reveal>
  );
}
