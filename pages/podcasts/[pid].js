import Header from "../../components/header";
import Footer from "../../components/footer";

import Button from '@mui/material/Button';
import { Typography } from "@mui/material";

import Axios from 'axios';

import podcastInfo from "../../public/podcasts.json";

import Settings from '../../settings.json';


export default function Page({data}) {
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
      <main>
      <Typography gutterBottom variant="h1" component="div" key="title" className="h">
              {data.title}
            </Typography>
        <p className="description">{data.description}</p>
        <iframe style={{borderRadius: "12px"}} src={`https://open.spotify.com/embed/show/${data.spotify}?utm_source=generator`} width="100%" height="250" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>

        <div style={{textAlign: "center"}}>
          <Button style={{fontSize: "1.5em"}} target="_blank" className="podcast-button" variant="contained" color="primary" href={`https://open.spotify.com/show/${data.spotify}`}>Listen to older episodes on Spotify</Button>
        </div>
        </main>
      <Footer/>
    </>
  );
}

// This gets called on every request
export async function getServerSideProps(context) {
  var data = podcastInfo[context.query.pid];

  // Pass data to the page via props
  return { props:  {data} };
}
