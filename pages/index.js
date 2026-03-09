import Header from '../components/header';
import ImageHeader from '../components/index/imageHeader';
import Footer from '../components/footer';
import Schedule from '../components/index/schedule';
import News from '../components/index/news';

import InstagramLatest from '../components/index/instagramLatest';

import Settings from '../settings.json';
import EpisodesTable from '../components/PodcastBar';
import Spotify from '../components/index/spotify';
import JoinUs from '../components/index/joinUs';

export default function Home() {
  return (
    <>
      <div className="site-header-sticky">
        <ImageHeader />
        <Header title={Settings.siteTitle} />
      </div>
      <main>
        <InstagramLatest />
        <div className="schedule-spotify-row">
          <Schedule />
          <div className="schedule-parent">
            <Spotify />
          </div>
        </div>
        <EpisodesTable full={false}/>
        <JoinUs />
      </main>
      <Footer />
    </>
  )
}
