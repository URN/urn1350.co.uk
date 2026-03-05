import Header from '../components/header';
import ImageHeader from '../components/index/imageHeader';
import Footer from '../components/footer';
import NowPlaying from '../components/index/nowPlaying';
import Schedule from '../components/index/schedule';
import News from '../components/index/news';

import InstagramLatest from '../components/index/instagramLatest';

import Settings from '../settings.json';
import EpisodesTable from '../components/PodcastBar';
import Spotify from '../components/index/spotify';

export default function Home() {
  return (
    <>
      <ImageHeader />
      <Header title={Settings.siteTitle} />
      <main>
        <NowPlaying />
        <InstagramLatest />
        <div className="index-container">

          <Schedule />
          <div className="schedule-parent">
            <Spotify />
          </div>
        </div>
        <EpisodesTable full={false}/>
      </main>
      <Footer />
    </>
  )
}
