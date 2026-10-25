import React, { useState } from 'react';

import { ArrowIcon } from '../Icons';
import { getShowKind, isShowVisible } from '../../utils/shows';
import { Heading, initialsOf } from './ui';

/** Admin list of every show and podcast, with the pending join requests on top. */
export default function ShowsScreen({ shows, requests, onRequest, onOpenShow, initialKind = 'radio' }) {
  const [kind, setKind] = useState(initialKind);
  const [query, setQuery] = useState('');

  const radio = shows.filter((s) => getShowKind(s) === 'radio');
  const pods = shows.filter((s) => getShowKind(s) === 'podcast');
  const q = query.trim().toLowerCase();
  const list = (kind === 'radio' ? radio : pods).filter((s) => !q || s.name.toLowerCase().includes(q));

  return (
    <>
      <Heading>Manage shows</Heading>

      <section className="acct-panel acct-panel--deep acct-requests" aria-labelledby="rq">
        <div className="acct-requests__top">
          <h2 id="rq" className="acct-h3">Requests to join</h2>
          <span className="acct-count">{requests.length}</span>
        </div>
        {requests.length === 0 ? <p className="acct-lede">All caught up. New requests show up here.</p> : null}
        <ul>
          {requests.map((r) => (
            <li key={`${r.show_id}:${r.presenter_id}`}>
              <span className="acct-initials" aria-hidden="true">{initialsOf(r.presenter_name)}</span>
              <span className="acct-requests__who">
                <strong>{r.presenter_name}</strong>
                <ArrowIcon size={16} stroke={3.5} />
                <span>{r.show_name}</span>
              </span>
              <span className="acct-requests__actions">
                <button type="button" className="acct-btn" style={{ minHeight: 44, fontSize: 15 }} onClick={() => onRequest(r, true)}>
                  Approve
                </button>
                <button type="button" className="acct-btn acct-btn--ghost" style={{ minHeight: 44, fontSize: 15 }} onClick={() => onRequest(r, false)}>
                  Reject
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="acct-toolbar">
        <div role="group" aria-label="Show type" className="acct-seg">
          <button type="button" aria-pressed={kind === 'radio'} onClick={() => setKind('radio')}>
            Radio shows · {radio.length}
          </button>
          <button type="button" aria-pressed={kind === 'podcast'} onClick={() => setKind('podcast')}>
            Podcasts · {pods.length}
          </button>
        </div>
        <span className="acct-search">
          <label htmlFor="q" className="acct-sr">Find a show</label>
          <input id="q" type="search" className="acct-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a show" />
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10" cy="10" r="6.5" fill="none" stroke="#fff" strokeWidth="2.2" />
            <path d="M15 15 L21 21" stroke="#fff" strokeWidth="2.2" />
          </svg>
        </span>
      </div>

      <ul className="acct-grid">
        {list.map((show) => (
          <li key={show.id}>
            <button type="button" className="acct-row" onClick={() => onOpenShow(show, kind)}>
              <span className="acct-row__text">
                <span className="acct-row__name">{show.name}</span>
                <span className="acct-row__meta">{kind === 'radio' ? 'Radio show' : 'Podcast'}</span>
              </span>
              {!isShowVisible(show) ? <span className="acct-chip">Hidden in app</span> : null}
              <ArrowIcon size={18} />
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 ? <p className="acct-lede">{q ? `No shows match “${query}”.` : 'Nothing here yet.'}</p> : null}
    </>
  );
}
