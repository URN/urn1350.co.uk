import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import Header from './Header';
import Footer from './Footer';
import PlayerBar from './PlayerBar';
import { useStation } from '../context/StationContext';
import { useStreamPlayer } from '../context/StreamPlayerContext';

/** Lock-screen and headphone controls, showing the current show and track. */
function useMediaSession() {
  const { show, track, ready } = useStation();
  const { isPlaying, play, pause } = useStreamPlayer();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof window.MediaMetadata === 'undefined') return;
    const showName = ready && show ? show.name : 'URN 1350';
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track && track.title ? track.title : showName,
      artist: track && track.artist ? track.artist : 'University Radio Nottingham',
      album: showName,
      artwork: [{ src: `/content/images/logo.png`, sizes: '170x170', type: 'image/png' }],
    });
  }, [show, track, ready]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return undefined;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    try {
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('stop', pause);
    } catch (e) {
      // Some browsers do not support every action.
    }
    return undefined;
  }, [isPlaying, play, pause]);
}

/** Thin lime bar across the top while a page is loading. */
function RouteProgress() {
  const router = useRouter();
  const [state, setState] = useState('idle');

  useEffect(() => {
    let t;
    const start = () => {
      clearTimeout(t);
      setState('loading');
    };
    const end = () => {
      setState('done');
      t = setTimeout(() => setState('idle'), 450);
    };
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', end);
    router.events.on('routeChangeError', end);
    return () => {
      clearTimeout(t);
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', end);
      router.events.off('routeChangeError', end);
    };
  }, [router.events]);

  return <div className={`route-progress route-progress--${state}`} aria-hidden="true" />;
}

export default function Layout({ children }) {
  const router = useRouter();
  useMediaSession();
  // The members area has its own header, so the public header and footer step aside.
  const members = router.pathname === '/account';

  useEffect(() => {
    document.documentElement.classList.add('hydrated');
  }, []);

  return (
    <div className="shell">
      <RouteProgress />
      {members ? null : <Header />}
      <main id="main" tabIndex={-1} className="page-enter" key={router.asPath.split('#')[0]}>
        {children}
      </main>
      {members ? null : <Footer />}
      <PlayerBar />
    </div>
  );
}
