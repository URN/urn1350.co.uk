import React, { createContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';

const STREAM_URL = 'https://live.urn1350.co.uk/listen';

export const StreamPlayerContext = createContext(null);

// WebKit (Safari, and every browser on iOS) feeds Web Audio silence from an endless live stream,
// so routing the stream through an analyser there would mute the radio.
function canAnalyseStream() {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  return !iOS && !safari;
}

export function StreamPlayerProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceElRef = useRef(null);
  // Read each frame by visuals that follow the music; null until the first play.
  const analyserRef = useRef(null);

  const connectAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || typeof window === 'undefined' || !canAnalyseStream()) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      // A remounted <audio> element needs its own source, or the analyser keeps reading the old, silent one.
      if (sourceElRef.current !== audio) {
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        // Fine enough bins (~11 Hz) to split the bass into several bands.
        analyser.fftSize = 4096;
        analyser.smoothingTimeConstant = 0.2;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceElRef.current = audio;
        analyserRef.current = analyser;
      }
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    } catch (e) {
      // Visuals fall back to their own timing if the audio graph is unavailable.
    }
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setError('');
    setIsLoading(true);
    connectAnalyser();
    // A fresh URL each time so a resume always joins the live edge,
    // not whatever was buffered when the listener paused.
    audio.src = `${STREAM_URL}?cache=${Date.now()}`;
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
        setError('Unable to play the stream. Press play to try again.');
      });
    }
  }, [connectAnalyser]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    // Drop the connection so a paused tab is not downloading radio in the background.
    audio.removeAttribute('src');
    audio.load();
    setIsLoading(false);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying || isLoading) pause();
    else play();
  }, [isPlaying, isLoading, play, pause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onPlaying = () => {
      // Sound is routed through the audio context, so a suspended one would leave the stream silent.
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
      setIsPlaying(true);
      setIsLoading(false);
      setError('');
    };
    const onWaiting = () => {
      if (audio.getAttribute('src')) setIsLoading(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
    const onFail = () => {
      // Removing src on pause can raise an "empty src" error; ignore it.
      if (!audio.getAttribute('src')) return;
      setIsPlaying(false);
      setIsLoading(false);
      setError('Unable to play the stream. Press play to try again.');
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onFail);
    audio.addEventListener('error', onFail);
    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onFail);
      audio.removeEventListener('error', onFail);
    };
  }, []);

  const value = useMemo(
    () => ({ isPlaying, isLoading, error, play, pause, togglePlay, analyserRef }),
    [isPlaying, isLoading, error, play, pause, togglePlay]
  );

  return (
    <StreamPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" crossOrigin="anonymous" style={{ display: 'none' }} />
    </StreamPlayerContext.Provider>
  );
}

export function useStreamPlayer() {
  const ctx = React.useContext(StreamPlayerContext);
  if (!ctx) {
    throw new Error('useStreamPlayer must be used within StreamPlayerProvider');
  }
  return ctx;
}
