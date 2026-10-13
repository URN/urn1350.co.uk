import React from 'react';
import Link from 'next/link';

import Seo from '../components/Seo';
import Cta from '../components/Cta';
import Reveal from '../components/Reveal';
import PodcastCard from '../components/PodcastCard';
import { ArrowIcon } from '../components/Icons';
import LiveHero from '../components/home/LiveHero';
import Lineup from '../components/home/Lineup';
import { InstagramLatest, SpotifyPlaylist } from '../components/home/Social';
import { fetchSchedule, fetchPodcasts, fetchInstagramPosts } from '../lib/content';

export default function Home({ podcasts, posts }) {
  const featured = podcasts.filter((p) => p.featured);
  const shown = (featured.length ? featured : podcasts).slice(0, 4);

  return (
    <>
      <Seo />
      <LiveHero />
      <Lineup />

      {shown.length > 0 ? (
        <section className="teaser" aria-labelledby="pod-h">
          <Reveal className="section-head">
            <h2 id="pod-h" className="h-light">Podcasts</h2>
            <Link href="/podcasts" className="link-arrow">All podcasts<ArrowIcon /></Link>
          </Reveal>
          <ul className="pods pods--teaser">
            {shown.map((p, i) => (
              <PodcastCard podcast={p} index={i} key={p.slug} />
            ))}
          </ul>
        </section>
      ) : null}

      <InstagramLatest posts={posts} />
      <SpotifyPlaylist />
      <Cta heading="Want to join us?" href="/pages/get-involved" label="Get involved" />
    </>
  );
}

export async function getStaticProps() {
  const [schedule, podcasts, posts] = await Promise.all([fetchSchedule(), fetchPodcasts(), fetchInstagramPosts()]);
  return { props: { schedule, podcasts, posts }, revalidate: 60 };
}
