import React from 'react';

import Seo from '../components/Seo';
import Cta from '../components/Cta';
import PixelHeading from '../components/PixelHeading';
import PodcastCard from '../components/PodcastCard';
import { fetchPodcasts } from '../lib/content';

export default function Page({ podcasts }) {
  return (
    <>
      <Seo title="Podcasts" />
      <section className="pagehead pagehead--split" aria-labelledby="h1">
        <div className="pagehead__title pagehead__title--row">
          <PixelHeading id="h1" size="xl">Podcasts</PixelHeading>
        </div>
        <div className="pagehead__aside">
          <p className="lede muted">
            Explore all URN podcasts. Podcasts from previous years can still be found in{' '}
            <a className="textlink" href="https://archive.urn1350.co.uk">the archive</a>.
          </p>
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

      <Cta heading="Got an idea for a podcast?" sub="We'll give you the studio and the training." href="/pages/get-involved" label="Get involved" />
    </>
  );
}

export async function getStaticProps() {
  const podcasts = await fetchPodcasts();
  return { props: { podcasts }, revalidate: 60 };
}
