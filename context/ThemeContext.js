import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'urn-theme';
const ThemeContext = createContext(null);

/** After 7pm UK time (when After Dark starts) the site goes to the Rewired night look, otherwise URN purple. */
function autoTheme(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', hourCycle: 'h23' }).format(date)
  );
  return hour >= 8 && hour < 19 ? 'day' : 'night';
}

function readStored() {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'day' || v === 'night' ? v : 'auto';
  } catch (e) {
    return 'auto';
  }
}

export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState('auto');
  const [auto, setAuto] = useState('night');
  // The boot script in _document already set the right theme before first paint,
  // so hold off writing it back until the real values have been read.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setChoice(readStored());
    setAuto(autoTheme());
    setLoaded(true);
    const id = setInterval(() => setAuto(autoTheme()), 60000);
    return () => clearInterval(id);
  }, []);

  const theme = choice === 'auto' ? auto : choice;

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'day' ? '#4a2a8b' : '#1e1e1e');
  }, [theme, loaded]);

  const toggle = useCallback(() => {
    const next = theme === 'day' ? 'night' : 'day';
    setChoice(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch (e) {
      // Storage unavailable (private mode): the choice still applies for this visit.
    }
  }, [theme]);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
