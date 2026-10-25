import React, { createContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';

const STREAM_URL = 'https://live.urn1350.co.uk/listen';

export const StreamPlayerContext = createContext(null);

export function StreamPlayerProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setError('');
    setIsLoading(true);
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
  }, []);

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
    () => ({ isPlaying, isLoading, error, play, pause, togglePlay }),
    [isPlaying, isLoading, error, play, pause, togglePlay]
  );

  return (
    <StreamPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" style={{ display: 'none' }} />
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
