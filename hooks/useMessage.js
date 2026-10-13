import { useCallback, useEffect, useRef, useState } from 'react';

export const MESSAGE_MAX = 200;
const COOLDOWN_MS = 4000;

/**
 * Sends a message to the studio via /api/message.
 * status: 'idle' | 'sending' | 'sent' | 'error'
 */
export function useMessage() {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const cooling = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const send = useCallback(
    async (prefix = '') => {
      const body = text.trim();
      if (!body || status === 'sending' || cooling.current) return false;
      setStatus('sending');
      setError('');
      const who = name.trim();
      const msg = `${prefix ? `[${prefix}] ` : ''}${body}${who ? ` (from ${who})` : ''}`;
      try {
        const res = await fetch('/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msg }),
          signal: AbortSignal.timeout?.(10000),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus('sent');
        setText('');
        cooling.current = true;
        timer.current = setTimeout(() => {
          cooling.current = false;
        }, COOLDOWN_MS);
        return true;
      } catch (e) {
        setStatus('error');
        setError('Unable to send your message. Please try again.');
        return false;
      }
    },
    [text, name, status]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError('');
  }, []);

  return { text, setText, name, setName, status, error, send, reset };
}
