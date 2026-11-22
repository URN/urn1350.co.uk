import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { ArrowIcon } from '../Icons';
import { listInstagramPostsAdmin, updateInstagramPost } from '../../utils/instagramAdmin';
import { toInstagramPostUrl } from '../../utils/instagram';
import { getWebsitePageBody, listWebsitePages, saveWebsitePageBody } from '../../utils/pagesAdmin';
import { getSpotifyPlaylistId, setSiteSetting } from '../../utils/siteSettings';
import { Field, Heading, Tick } from './ui';

function InstagramCard({ onError, onMessage }) {
  const [posts, setPosts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listInstagramPostsAdmin()
      .then((rows) => {
        setPosts(rows);
        const next = {};
        rows.forEach((row) => {
          next[row.id] = toInstagramPostUrl(row.embed_url);
        });
        setDrafts(next);
      })
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load Instagram links.'));
  }, [onError]);

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    onError('');
    try {
      for (const post of posts) {
        await updateInstagramPost(post.id, drafts[post.id] || '');
      }
      onMessage('Instagram links saved.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save Instagram links.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="acct-panel" aria-labelledby="ig" onSubmit={handleSave} style={{ flex: '1 1 460px' }}>
      <div className="acct-panel__head">
        <h2 id="ig" className="acct-h3">Instagram on the homepage</h2>
        <p className="acct-sub">Paste the link to a post. We turn it into an embed for you.</p>
      </div>
      {posts.map((post, index) => {
        const value = drafts[post.id] || '';
        return (
          <div className="acct-field" key={post.id}>
            <label htmlFor={`ig${post.id}`} className="acct-label">Post {index + 1}</label>
            <input
              id={`ig${post.id}`}
              type="url"
              className="acct-input"
              value={value}
              onChange={(e) => setDrafts({ ...drafts, [post.id]: e.target.value })}
              placeholder="https://www.instagram.com/p/…"
            />
            <span className="acct-hint" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {value.trim() ? <Tick size={14} color="#fff" /> : null}
              {value.trim() ? 'Embed ready' : 'Empty. This spot is hidden on the homepage.'}
            </span>
          </div>
        );
      })}
      <button type="submit" className="acct-btn" disabled={busy || posts.length === 0}>
        {busy ? 'Saving…' : 'Save links'}
      </button>
    </form>
  );
}

function SpotifyCard({ onError, onMessage }) {
  const [current, setCurrent] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSpotifyPlaylistId()
      .then(setCurrent)
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load Spotify playlist.'));
  }, [onError]);

  async function handleSave(event) {
    event.preventDefault();
    const trimmed = value.trim();
    const match = trimmed.match(/playlist\/([A-Za-z0-9]+)/) || trimmed.match(/^([A-Za-z0-9]+)$/);
    if (!match) {
      onError('Paste a Spotify playlist link or id.');
      return;
    }
    setBusy(true);
    onError('');
    try {
      await setSiteSetting('spotify_playlist', match[1]);
      setCurrent(match[1]);
      setValue('');
      onMessage('Homepage playlist updated.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save the playlist. Run site-settings.sql first.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="acct-panel" aria-labelledby="spt" onSubmit={handleSave} style={{ flex: '1 1 400px' }}>
      <div className="acct-panel__head">
        <h2 id="spt" className="acct-h3">Spotify playlist</h2>
        <p className="acct-sub">The playlist embedded on the homepage. A link or just the playlist ID both work.</p>
      </div>
      <div className="acct-onair">
        <span className="acct-field" style={{ gap: 2 }}>
          <span className="acct-label">On the homepage now</span>
          <p>{current || 'Not set'}</p>
        </span>
      </div>
      <Field id="pl" label="New playlist">
        <input
          id="pl"
          className="acct-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://open.spotify.com/playlist/…"
        />
      </Field>
      <button type="submit" className="acct-btn" disabled={busy || !value.trim()}>
        {busy ? 'Saving…' : 'Set homepage playlist'}
      </button>
    </form>
  );
}

function PagesCard({ onError, onMessage }) {
  const [pages, setPages] = useState([]);
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listWebsitePages()
      .then((rows) => {
        setPages(rows);
        if (rows[0]) setSlug((current) => current || rows[0].slug);
      })
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load pages.'));
  }, [onError]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    getWebsitePageBody(slug)
      .then((page) => active && setBody(page?.body || ''))
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load the page.'));
    return () => {
      active = false;
    };
  }, [slug, onError]);

  async function handleSave() {
    setBusy(true);
    onError('');
    try {
      await saveWebsitePageBody(slug, body);
      onMessage(`${slug} saved.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save the page.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="acct-pages" aria-labelledby="pg">
      <div className="acct-pages__side">
        <div>
          <h2 id="pg" className="acct-h3">Pages</h2>
          <p className="acct-sub">Text pages on the site, written in Markdown.</p>
        </div>
        <ul>
          {pages.map((page) => (
            <li key={page.slug}>
              <button type="button" className="acct-pages__item" aria-pressed={page.slug === slug} onClick={() => setSlug(page.slug)}>
                <span>
                  {page.slug}
                  <small>/pages/{page.slug}</small>
                </span>
                <ArrowIcon size={16} stroke={3.5} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="acct-pages__edit">
        <div className="acct-pages__bar">
          <label htmlFor="md" className="acct-h3">{slug || 'Choose a page'}</label>
          {slug ? (
            <Link href={`/pages/${slug}`} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontSize: 15 }}>
              View on the site
            </Link>
          ) : null}
        </div>
        <textarea
          id="md"
          className="acct-textarea"
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-describedby="md-hint"
          disabled={!slug}
        />
        <div className="acct-pages__bar">
          <span id="md-hint" className="acct-hint"># Heading · **bold** · [link text](https://…)</span>
          <button type="button" className="acct-btn" disabled={busy || !slug} onClick={handleSave}>
            {busy ? 'Saving…' : 'Save page'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function WebsiteScreen({ perms, onError, onMessage }) {
  const full = perms.canManageWebsiteFull;
  return (
    <>
      <Heading
        lede={
          full
            ? 'What the homepage shows, and the text on every page.'
            : 'Change the playlist on the homepage. For anything else on the site, ask the Station team.'
        }>
        {full ? 'Website' : 'Spotify playlist'}
      </Heading>
      <div className="acct-cols" style={{ alignItems: 'flex-start' }}>
        {full ? <InstagramCard onError={onError} onMessage={onMessage} /> : null}
        <SpotifyCard onError={onError} onMessage={onMessage} />
      </div>
      {full ? <PagesCard onError={onError} onMessage={onMessage} /> : null}
    </>
  );
}
