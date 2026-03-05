import React from 'react';

import Header from '../components/header';
import ImageHeader from '../components/index/imageHeader';
import Footer from '../components/footer';
import NowPlaying from '../components/index/nowPlaying';

import Settings from '../settings.json';

export default function ListenPage() {
  return (
    <>
      <div className="site-header-sticky">
        <ImageHeader />
        <Header title={`Listen Live - ${Settings.siteTitle}`} />
      </div>
      <main>
        <NowPlaying />
      </main>
      <Footer />
    </>
  );
}

