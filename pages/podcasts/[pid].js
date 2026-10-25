import React from 'react';
import Link from 'next/link';

import Seo from '../../components/Seo';
import Reveal from '../../components/Reveal';
import PixelHeading from '../../components/PixelHeading';
import { PodcastArt } from '../../components/PodcastCard';
import { ArrowIcon, ExternalIcon } from '../../components/Icons';
import { fetchPodcasts } from '../../lib/content';
import {
  toSpotifyEmbedUrl,
  toSpotifyShowUrl,
  toTikTokEmbedUrl,
} from '../../utils/podcasts';

export default function Page({ data }) {
  const spotifyEmbed = toSpotifyEmbedUrl(data.spotifyEmbed);
  const spotifyUrl = toSpotifyShowUrl(data.spotifyEmbed);
  const tiktokEmbed = !spotifyEmbed ? toTikTokEmbedUrl(data) : '';

  return (
    <>
      <Seo title={data.title} description={data.description} image={data.image} />

      <div className="crumbs">
        <Link href="/podcasts" className="link-arrow link-arrow--back"><ArrowIcon />All podcasts</Link>
      </div>

      <section className="show" aria-labelledby="h1">
        <PodcastArt podcast={data} className="show__art" />
        <div className="show__body">
          <PixelHeading id="h1" size="l">{data.title}</PixelHeading>
          <dl className="facts">
            {data.host ? (<div><dt className="caps caps--muted">Host</dt><dd>{data.host}</dd></div>) : null}
            {data.guests ? (<div><dt className="caps caps--muted">Guests</dt><dd>{data.guests}</dd></div>) : null}
            {data.instagram ? (<div><dt className="caps caps--muted">Instagram</dt><dd>{data.instagram}</dd></div>) : null}
          </dl>
          {data.description ? <p className="lede">{data.description}</p> : null}
          <div className="actions">
            {spotifyUrl ? (
              <a className="btn btn--lime btn--lg" href={spotifyUrl} target="_blank" rel="noopener noreferrer">Open on Spotify<ExternalIcon /></a>
            ) : null}
            {data.instagramlink ? (
              <a className="btn btn--ghost btn--lg" href={data.instagramlink} target="_blank" rel="noopener noreferrer">View on Instagram<ExternalIcon /></a>
            ) : null}
            {!spotifyEmbed && data.tiktoklink ? (
              <a className="btn btn--lime btn--lg" href={data.tiktoklink} target="_blank" rel="noopener noreferrer">Open on TikTok<ExternalIcon /></a>
            ) : null}
          </div>
        </div>
      </section>

      {spotifyEmbed ? (
        <Reveal as="section" className="embed" aria-label="Listen on Spotify">
          <h2 className="h-light">Listen on Spotify</h2>
          <iframe
            src={spotifyEmbed}
            title={`${data.title} on Spotify`}
            loading="lazy"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </Reveal>
      ) : null}

      {tiktokEmbed ? (
        <Reveal as="section" className="embed embed--tall" aria-label="Watch on TikTok">
          <h2 className="h-light">Watch on TikTok</h2>
          <iframe
            src={tiktokEmbed}
            title={`${data.title} on TikTok`}
            loading="lazy"
            height="560"
            allow="encrypted-media; fullscreen; picture-in-picture"
          />
        </Reveal>
      ) : null}
    </>
  );
}

export async function getStaticPaths() {
  const podcasts = await fetchPodcasts();
  return { paths: podcasts.map((p) => ({ params: { pid: p.slug } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const podcasts = await fetchPodcasts();
  const data = podcasts.find((p) => p.slug === params.pid) || null;
  if (!data) return { notFound: true, revalidate: 30 };
  return { props: { data }, revalidate: 60 };
}
