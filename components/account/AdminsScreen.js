import React, { useCallback, useEffect, useState } from 'react';

import {
  ACCESS_LEVELS,
  COMMITTEE_ROLES,
  addExtraAdmin,
  listAdminsWithNames,
  removeAdmin,
  setCommitteeAdmin,
  updateExtraAdmin,
} from '../../utils/adminAccess';
import { Chevron, Field, Heading } from './ui';

const LEVEL_NOTES = {
  full: 'Everything, including this page.',
  station: 'Everything except managing admins.',
  shows: 'Shows, join requests and the schedule.',
  music: 'The homepage Spotify playlist only.',
};

function AccessSelect({ id, label, value, onChange }) {
  return (
    <span className="acct-selectwrap">
      {label ? <label htmlFor={id} className="acct-sr">{label}</label> : null}
      <select id={id} className="acct-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {ACCESS_LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.value.charAt(0).toUpperCase() + level.value.slice(1)}
          </option>
        ))}
      </select>
      <Chevron />
    </span>
  );
}

export default function AdminsScreen({ onError, onMessage, error }) {
  const [admins, setAdmins] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [extraDrafts, setExtraDrafts] = useState({});
  const [busyKey, setBusyKey] = useState('');
  const [extraEmail, setExtraEmail] = useState('');
  const [extraLabel, setExtraLabel] = useState('Technical Team');
  const [extraAccess, setExtraAccess] = useState('full');
  const [adding, setAdding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const rows = await listAdminsWithNames();
    setAdmins(rows);
    const next = {};
    COMMITTEE_ROLES.forEach((title) => {
      const match = rows.find((row) => !row.is_extra && String(row.role || '').toLowerCase() === title.toLowerCase());
      next[title] = { email: match?.email || '', access: match?.access_level || 'shows' };
    });
    setDrafts(next);
    const extrasNext = {};
    rows
      .filter((row) => row.is_extra)
      .forEach((row) => {
        extrasNext[row.email] = { label: row.role || 'Technical Team', access: row.access_level || 'full' };
      });
    setExtraDrafts(extrasNext);
  }, []);

  useEffect(() => {
    reload()
      .then(() => setLoaded(true))
      .catch((err) =>
        onError(err instanceof Error ? err.message : 'Could not load admins. Run urn-app/supabase/admins-access.sql in Supabase.')
      );
  }, [onError, reload]);

  async function run(key, task, done, fallback) {
    setBusyKey(key);
    onError('');
    try {
      await task();
      await reload();
      onMessage(done);
    } catch (err) {
      onError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusyKey('');
    }
  }

  async function handleAdd(event) {
    event.preventDefault();
    setAdding(true);
    onError('');
    try {
      await addExtraAdmin(extraEmail, extraLabel, extraAccess);
      setExtraEmail('');
      setExtraLabel('Technical Team');
      setExtraAccess('full');
      await reload();
      onMessage("Admin added. They'll get access next time they sign in.");
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not add that admin.');
    } finally {
      setAdding(false);
    }
  }

  const extras = admins.filter((row) => row.is_extra);

  return (
    <>
      <Heading lede="Who can change what. Put someone's email on a seat and they get that access the next time they sign in.">
        Admins
      </Heading>

      <ul aria-label="What each access level can do" className="acct-levels">
        {ACCESS_LEVELS.map((level) => (
          <li key={level.value}>
            <strong>{level.value}</strong>
            <span>{LEVEL_NOTES[level.value]}</span>
          </li>
        ))}
      </ul>

      {!loaded ? (
        error ? null : <p className="acct-loading" role="status">Loading…</p>
      ) : (
        <>
          <section aria-labelledby="cs" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="acct-toolbar" style={{ alignItems: 'baseline' }}>
              <h2 id="cs" className="acct-h2">Committee seats</h2>
              <span className="acct-sub">Clear an email to remove that person&apos;s access.</span>
            </div>
            <ul className="acct-list" style={{ borderBottom: 0 }}>
              {COMMITTEE_ROLES.map((title, i) => {
                const match = admins.find((row) => !row.is_extra && String(row.role || '').toLowerCase() === title.toLowerCase());
                const draft = drafts[title] || { email: '', access: 'shows' };
                const who = !match?.email ? 'No one in this seat' : match.display_name || 'Not signed in yet';
                return (
                  <li key={title} className="acct-seat" style={{ borderBottom: '1px solid var(--line)' }}>
                    <span className="acct-seat__who">
                      <strong>{title}</strong>
                      <span>{match?.display_name ? who : <em>{who}</em>}</span>
                    </span>
                    <label htmlFor={`seat${i}`} className="acct-sr">Email for {title}</label>
                    <input
                      id={`seat${i}`}
                      type="email"
                      className="acct-input"
                      value={draft.email}
                      placeholder="Email"
                      onChange={(e) => setDrafts({ ...drafts, [title]: { ...draft, email: e.target.value } })}
                    />
                    <AccessSelect
                      id={`seat${i}-a`}
                      label={`Access for ${title}`}
                      value={draft.access}
                      onChange={(access) => setDrafts({ ...drafts, [title]: { ...draft, access } })}
                    />
                    <button
                      type="button"
                      className="acct-btn acct-btn--ghost"
                      style={{ fontWeight: 600, minWidth: 92 }}
                      disabled={busyKey === title}
                      onClick={() =>
                        run(title, () => setCommitteeAdmin(title, draft.email || '', draft.access || 'shows'), `${title} saved.`, 'Could not save that admin.')
                      }>
                      {busyKey === title ? 'Saving…' : 'Save'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="oa" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="acct-head" style={{ gap: 6 }}>
              <h2 id="oa" className="acct-h2">Other admins</h2>
              <span className="acct-sub">People who need access but don&apos;t hold a committee seat.</span>
            </div>
            <ul className="acct-list" style={{ borderBottom: 0 }}>
              {extras.map((row, i) => {
                const draft = extraDrafts[row.email] || { label: row.role || 'Technical Team', access: row.access_level || 'full' };
                return (
                  <li key={row.email} className="acct-seat" style={{ borderBottom: '1px solid var(--line)', alignItems: 'flex-start' }}>
                    <span className="acct-seat__who" style={{ gap: 6 }}>
                      <label htmlFor={`ex${i}`} className="acct-sr">Label</label>
                      <input
                        id={`ex${i}`}
                        className="acct-input"
                        style={{ minHeight: 48, fontSize: 15, fontWeight: 600 }}
                        value={draft.label}
                        onChange={(e) => setExtraDrafts({ ...extraDrafts, [row.email]: { ...draft, label: e.target.value } })}
                      />
                      <span>{row.display_name || 'Not signed in yet'}</span>
                    </span>
                    <input type="email" className="acct-input" aria-label="Email" value={row.email} readOnly style={{ alignSelf: 'flex-start' }} />
                    <AccessSelect
                      id={`ex${i}-a`}
                      label="Access"
                      value={draft.access}
                      onChange={(access) => setExtraDrafts({ ...extraDrafts, [row.email]: { ...draft, access } })}
                    />
                    <span className="acct-seat__actions">
                      <button
                        type="button"
                        className="acct-btn acct-btn--ghost"
                        style={{ fontWeight: 600 }}
                        disabled={busyKey === row.email}
                        onClick={() =>
                          run(row.email, () => updateExtraAdmin(row.email, draft.label, draft.access), 'Admin updated.', 'Could not update that admin.')
                        }>
                        {busyKey === row.email ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="acct-btn acct-btn--warn"
                        onClick={() => run(`rm:${row.email}`, () => removeAdmin(row.email), 'Admin removed.', 'Could not remove that admin.')}>
                        Remove
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
            {extras.length === 0 ? <p className="acct-sub">No other admins yet.</p> : null}

            <form className="acct-addform" aria-labelledby="add" onSubmit={handleAdd}>
              <h3 id="add" className="acct-h3" style={{ fontSize: 20 }}>Add another admin</h3>
              <Field id="nl" label="Label">
                <input id="nl" className="acct-input" value={extraLabel} onChange={(e) => setExtraLabel(e.target.value)} />
              </Field>
              <Field id="ne" label="Email">
                <input
                  id="ne"
                  type="email"
                  className="acct-input"
                  value={extraEmail}
                  onChange={(e) => setExtraEmail(e.target.value)}
                  placeholder="name@nottingham.ac.uk"
                  required
                />
              </Field>
              <Field id="na" label="Access">
                <AccessSelect id="na" value={extraAccess} onChange={setExtraAccess} />
              </Field>
              <button type="submit" className="acct-btn acct-btn--lg" disabled={adding || !extraEmail.trim()}>
                {adding ? 'Adding…' : 'Add admin'}
              </button>
            </form>
          </section>
        </>
      )}
    </>
  );
}
