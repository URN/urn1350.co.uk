import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';

const STREAM_URL = 'https://live.urn1350.co.uk/listen';

export const StreamPlayerContext = createContext(null);

export function StreamPlayerProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheBust] = useState(() => Math.floor(Math.random() * 10000000));
  const audioRef = useRef(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      audio.play();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const onPause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };
    const onError = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const value = {
    isPlaying,
    isLoading,
    togglePlay,
    streamURL: `${STREAM_URL}?cache=${cacheBust}`,
    audioRef,
  };

  return (
    <StreamPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={value.streamURL}
        preload="none"
        className="now-playing-audio"
        style={{ display: 'none' }}
      />
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
