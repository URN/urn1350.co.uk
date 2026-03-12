import React from 'react';

import Header from '../components/header';
import Footer from '../components/footer';
import NowPlaying from '../components/index/nowPlaying';

import Settings from '../settings.json';

export default function ListenPage() {
  return (
    <>
      <Header title={`Listen Live - ${Settings.siteTitle}`} />
      <main>
        <NowPlaying />
      </main>
      <Footer />
    </>
  );
}

