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

/**
 * TikTok: optional `tiktokEmbed` (full embed URL), or `tiktoklink` profile/video URL.
 * Profile: https://www.tiktok.com/@handle → embed/@handle
 * Video:   .../video/123 → embed/v2/123
 */
function toTikTokEmbedUrl(data) {
  const direct = data.tiktokEmbed && String(data.tiktokEmbed).trim();
  if (direct) {
    if (direct.includes('tiktok.com/embed')) {
      return direct.split('?')[0];
    }
  }
  const link = data.tiktoklink && String(data.tiktoklink).trim();
  if (!link) return '';
  if (link.includes('tiktok.com/embed')) {
    return link.split('?')[0];
  }
  const videoMatch = link.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (videoMatch && videoMatch[1]) {
    return `https://www.tiktok.com/embed/v2/${videoMatch[1]}`;
  }
  const profileMatch = link.match(/tiktok\.com\/@([^/?&#]+)/i);
  if (profileMatch && profileMatch[1]) {
    return `https://www.tiktok.com/embed/@${profileMatch[1]}`;
  }
  return '';
}

function toTikTokOpenUrl(data) {
  const link = data.tiktoklink && String(data.tiktoklink).trim();
  return link || '';
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
      <main className="podcast-detail-page is-fluid">
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
          <section className="podcast-spotify podcast-embed-block">
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
              title="Spotify podcast player"
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

        {!toSpotifyEmbedUrl(data.spotifyEmbed) && toTikTokEmbedUrl(data) && (
          <section className="podcast-tiktok podcast-embed-block">
            <Typography gutterBottom variant="h2" component="div" className="h">
              Watch on TikTok
            </Typography>
            <div className="podcast-tiktok-frame">
              <iframe
                style={{ borderRadius: "12px" }}
                src={toTikTokEmbedUrl(data)}
                width="100%"
                height="520"
                frameBorder="0"
                allow="encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="TikTok embed"
              />
            </div>
            {toTikTokOpenUrl(data) && (
              <div style={{ textAlign: "center" }}>
                <Button
                  target="_blank"
                  rel="noopener noreferrer"
                  className="podcast-button"
                  variant="contained"
                  color="primary"
                  href={toTikTokOpenUrl(data)}
                >
                  Open on TikTok
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
    const raw = String(response.data).replace(/^ {3}- /gm, '  - ');
    const parsed = YAML.parse(raw);
    const podcasts = Array.isArray(parsed?.podcasts) ? parsed.podcasts : [];
    data = podcasts.find((podcast) => podcast.slug === context.query.pid) || null;
  } catch (error) {
    data = null;
  }

  // Pass data to the page via props
  return { props: { data } };
}
