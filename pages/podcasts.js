import React from 'react';

import Seo from '../components/Seo';
import Cta from '../components/Cta';
import PixelHeading from '../components/PixelHeading';
import PodcastCard from '../components/PodcastCard';
import { ArrowIcon } from '../components/Icons';
import Reveal from '../components/Reveal';
import { fetchPodcasts } from '../lib/content';

export default function Page({ podcasts }) {
  return (
    <>
      <Seo title="Podcasts" />
      <section className="pagehead pagehead--split" aria-labelledby="h1">
        <div className="pagehead__title pagehead__title--row">
          <PixelHeading id="h1" size="xl">Podcasts</PixelHeading>
        </div>
      </section>

      {podcasts.length > 0 ? (
        <ul className="pods">
          {podcasts.map((p, i) => (
            <PodcastCard podcast={p} index={i} key={p.slug} />
          ))}
        </ul>
      ) : (
        <p className="empty">Unable to load podcasts.</p>
      )}

      <Reveal as="section" className="archive" aria-labelledby="archive-h">
        <div className="archive__text">
          <h2 id="archive-h" className="archive__title">Looking for older shows?</h2>
          <p className="muted">You can find shows from previous years in the archive.</p>
        </div>
        <a className="btn btn--ghost btn--xl" href="https://archive.urn1350.co.uk" target="_blank" rel="noopener noreferrer">
          Browse the archive<ArrowIcon className="arrow" />
        </a>
      </Reveal>

      <Cta heading="Got an idea for a podcast?" sub="We'll give you the studio and the training." href="/pages/get-involved" label="Get involved" />
    </>
  );
}

export async function getStaticProps() {
  const podcasts = await fetchPodcasts();
  return { props: { podcasts }, revalidate: 60 };
}
