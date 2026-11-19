import React, { useEffect, useState } from 'react';
import { listMyRecordingSlots, requestRecordingUrl } from '../../utils/recordings';

export default function RecordingsPanel({ userId }) {
  const [slots, setSlots] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busyFile, setBusyFile] = useState('');
  const [rowErrors, setRowErrors] = useState({});

  useEffect(() => {
    let active = true;
    listMyRecordingSlots(userId)
      .then((list) => active && setSlots(list))
      .catch((err) => active && setLoadError(err instanceof Error ? err.message : 'Could not load recordings.'));
    return () => {
      active = false;
    };
  }, [userId]);

  async function handleDownload(file) {
    setBusyFile(file);
    setRowErrors((prev) => ({ ...prev, [file]: '' }));
    try {
      const url = await requestRecordingUrl(file);
      window.location.assign(url);
    } catch (err) {
      setRowErrors((prev) => ({
        ...prev,
        [file]: err instanceof Error ? err.message : 'Link expired, try again.',
      }));
    } finally {
      setBusyFile('');
    }
  }

  if (loadError) return <p className="account-error">{loadError}</p>;
  if (slots === null) return <p className="account-muted">Loading recordings…</p>;
  if (slots.length === 0) {
    return <p className="account-muted">No recordings from your shows in the last 6 weeks.</p>;
  }

  return (
    <ul className="account-recordings">
      {slots.map((slot) => (
        <li key={slot.file}>
          <span>
            {slot.dateKey} {String(slot.hour).padStart(2, '0')}:00 · {slot.showName}
          </span>
          <button
            type="button"
            className="account-button"
            disabled={busyFile === slot.file}
            onClick={() => handleDownload(slot.file)}>
            {busyFile === slot.file ? 'Preparing…' : 'Download'}
          </button>
          {rowErrors[slot.file] ? <small className="account-error">{rowErrors[slot.file]}</small> : null}
        </li>
      ))}
    </ul>
  );
}
