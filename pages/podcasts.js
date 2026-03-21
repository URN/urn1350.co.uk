import Header from "../components/header";
import Footer from "../components/footer";
import EpisodesTable from '../components/PodcastBar';
import { Typography } from "@mui/material";
import Settings from '../settings.json';

export default function Page() {
  return (
    <>
      <Header
        title={`Podcasts - ${Settings.siteTitle}`}
      />
      <main className="podcasts-page">
        <Typography gutterBottom variant="h1" component="div" key="title" className="h podcasts-page-title">
          Podcasts
        </Typography>
        <span className="description">
          Explore all URN podcasts. Podcasts from previous years can still be found in{' '}
          <a href="https://archive.urn1350.co.uk">the archive</a>.
        </span>
        <EpisodesTable full={true} />
      </main>
      <Footer />
    </>
  );
}
