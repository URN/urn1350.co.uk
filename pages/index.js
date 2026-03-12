import Header from '../components/header';
import Footer from '../components/footer';
import Schedule from '../components/index/schedule';
import News from '../components/index/news';

import NowPlaying from '../components/index/nowPlaying';
import InstagramLatest from '../components/index/instagramLatest';

import Settings from '../settings.json';
import EpisodesTable from '../components/PodcastBar';
import Spotify from '../components/index/spotify';
import JoinUs from '../components/index/joinUs';

export default function Home() {
  return (
    <>
      <Header title={Settings.siteTitle} />
      <main>
        <NowPlaying />
        <InstagramLatest />
        <div className="schedule-spotify-row">
          <Schedule />
          <div className="schedule-parent">
            <Spotify />
          </div>
        </div>
        <div className="home-podcast-section">
          <EpisodesTable full={false} />
        </div>
        <JoinUs />
      </main>
      <Footer />
    </>
  )
}
