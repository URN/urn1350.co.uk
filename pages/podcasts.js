import Header from "../components/header";
import Footer from "../components/footer";

import Axios from 'axios';

import EpisodesTable from '../components/PodcastBar';

import { Typography } from "@material-ui/core";

import Settings from '../settings.json';


export default function Page() {
  return (
    <>
      <Header
        title={`Podcasts - ${Settings.siteTitle}`}
      />
      <main>
      <Typography gutterBottom variant="h1" component="div" key="title" className="h">Podcasts</Typography>
        <span className="description">Here are all our current podcasts. Podcasts from previous years may be found in <a href="https://archive.urn1350.co.uk">the archive</a></span>
        <EpisodesTable full={true}/>
        </main>
      <Footer/>
    </>
  );
}
