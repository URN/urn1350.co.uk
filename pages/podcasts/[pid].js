import Header from "../../components/header";
import Footer from "../../components/footer";

import Button from '@mui/material/Button';
import { Typography } from "@mui/material";

import Axios from 'axios';
import YAML from 'yaml';

import Settings from '../../settings.json';

function toSpotifyEmbedUrl(value) {
  if (!value) return '';
  if (value.includes('/embed/show/')) return value;

  const clean = value.split('?')[0];
  const match = clean.match(/open\.spotify\.com\/show\/([^/]+)/i);
  if (match && match[1]) {
    return `https://open.spotify.com/embed/show/${match[1]}`;
  }
  return '';
}

function toSpotifyShowUrl(value) {
  if (!value) return '';
  const clean = value.split('?')[0];
  const embedMatch = clean.match(/open\.spotify\.com\/embed\/show\/([^/]+)/i);
  if (embedMatch && embedMatch[1]) {
    return `https://open.spotify.com/show/${embedMatch[1]}`;
  }
  const showMatch = clean.match(/open\.spotify\.com\/show\/([^/]+)/i);
  if (showMatch && showMatch[1]) {
    return `https://open.spotify.com/show/${showMatch[1]}`;
  }
  return '';
}

export default function Page({ data }) {
  if (!data) {
    return (
      <>
        <Header
          title={`Podcast Not found - ${Settings.siteTitle}`}
        />
         <Typography gutterBottom variant="h3" component="div" key="title" className="h err">
          Unfortunately, the podcast you were looking for could not be found.
          </Typography>
        <Footer />
      </>
    );
  }
  return (
    <>
      <Header
        title={`${data.title} - ${Settings.siteTitle}`}
        description={data.description}
      />
      <main className="podcast-detail-page">
        <article className="podcast-detail-card">
          {data.image && (
            <img className="podcast-detail-image" src={data.image} alt={data.title} />
          )}
          <div className="podcast-detail-content">
            <Typography gutterBottom variant="h1" component="div" key="title" className="h">
              {data.title}
            </Typography>
            {data.host && <p className="description"><strong>Host:</strong> {data.host}</p>}
            {data.description && <p className="description">{data.description}</p>}
            {data.instagram && (
              <p className="description"><strong>Instagram:</strong> {data.instagram}</p>
            )}
            {data.guests && (
              <p className="description"><strong>Guests:</strong> {data.guests}</p>
            )}
            {data.instagramlink && (
              <div style={{ textAlign: "center" }}>
                <Button
                  target="_blank"
                  className="podcast-button"
                  variant="outlined"
                  color="primary"
                  href={data.instagramlink}
                >
                  View on Instagram
                </Button>
              </div>
            )}
          </div>
        </article>

        {toSpotifyEmbedUrl(data.spotifyEmbed) && (
          <section className="podcast-spotify">
            <Typography gutterBottom variant="h2" component="div" className="h">
              Listen on Spotify
            </Typography>
            <iframe
              style={{ borderRadius: "12px" }}
              src={toSpotifyEmbedUrl(data.spotifyEmbed)}
              width="100%"
              height="250"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
            {toSpotifyShowUrl(data.spotifyEmbed) && (
              <div style={{ textAlign: "center" }}>
                <Button
                  target="_blank"
                  className="podcast-button"
                  variant="contained"
                  color="primary"
                  href={toSpotifyShowUrl(data.spotifyEmbed)}
                >
                  Open podcast on Spotify
                </Button>
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

// This gets called on every request
export async function getServerSideProps(context) {
  let data = null;
  try {
    const response = await Axios.get(`${Settings.cdnUrl}/Podcasts/podcasts.yml`);
    const parsed = YAML.parse(response.data);
    const podcasts = Array.isArray(parsed?.podcasts) ? parsed.podcasts : [];
    data = podcasts.find((podcast) => podcast.slug === context.query.pid) || null;
  } catch (error) {
    data = null;
  }

  // Pass data to the page via props
  return { props: { data } };
}
