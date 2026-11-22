import React from 'react';

import { ArrowIcon } from '../Icons';
import { Field, Select } from './ui';

export default function ProfileScreen({
  email,
  displayName,
  nameDraft,
  setNameDraft,
  editingName,
  setEditingName,
  onSaveName,
  savingName,
  avatarUrl,
  canEditProfile,
  onAvatar,
  adminRole,
  isAdmin,
  canReview,
  pendingCount,
  onReview,
  myShows,
  onOpenShow,
  otherShows,
  pendingShowIds,
  joinShowId,
  setJoinShowId,
  busyShowId,
  onJoin,
  onSignOut,
}) {
  const draftEmpty = nameDraft.trim().length === 0;
  const selected = otherShows.find((s) => s.id === joinShowId);
  const requested = selected && pendingShowIds.has(selected.id);
  const waiting = otherShows.filter((s) => pendingShowIds.has(s.id));

  return (
    <>
      <section className="acct-who" aria-labelledby="who">
        <div className="acct-who__avatar">
          <span className="acct-avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : (displayName[0] || '?').toUpperCase()}
          </span>
          {canEditProfile ? (
            <label className="acct-link">
              Change photo
              <input type="file" accept="image/*" className="acct-sr" onChange={onAvatar} />
            </label>
          ) : null}
        </div>
        <div className="acct-who__body">
          {editingName ? (
            <>
              <form className="acct-who__edit" onSubmit={onSaveName}>
                <label htmlFor="nm" className="acct-sr">Display name</label>
                <input id="nm" className="acct-input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
                <button type="submit" className="acct-btn acct-btn--lg" disabled={draftEmpty || savingName}>
                  {savingName ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="acct-btn acct-btn--ghost acct-btn--lg" onClick={() => setEditingName(false)}>
                  Cancel
                </button>
              </form>
              {draftEmpty ? (
                <p role="alert" className="acct-sub" style={{ color: '#fff' }}>
                  <strong>Your name can&apos;t be empty.</strong> It&apos;s what listeners see next to your show.
                </p>
              ) : null}
            </>
          ) : (
            <div className="acct-who__line">
              <h1 id="who" className="acct-h1">{displayName}</h1>
              <button
                type="button"
                className="acct-btn acct-btn--ghost acct-btn--sm"
                onClick={() => {
                  setNameDraft(displayName);
                  setEditingName(true);
                }}>
                Edit name
              </button>
            </div>
          )}
          <div className="acct-who__meta">
            <span>{email}</span>
            {isAdmin && adminRole ? <span className="acct-pill">{adminRole}</span> : null}
          </div>
        </div>
        <button type="button" className="acct-btn acct-btn--ghost" onClick={onSignOut}>Sign out</button>
      </section>

      {canReview && pendingCount > 0 ? (
        <button type="button" className="acct-banner-link" onClick={onReview}>
          <span>
            <span className="acct-count">{pendingCount}</span>
            {pendingCount === 1 ? 'person wants' : 'people want'} to join a show
          </span>
          <span>
            Review requests
            <ArrowIcon size={18} stroke={3.5} />
          </span>
        </button>
      ) : null}

      <div className="acct-cols" style={{ gap: 'clamp(32px, 4vw, 56px)' }}>
        <section aria-labelledby="ys" style={{ flex: '3 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 id="ys" className="acct-h2">Your shows</h2>
          {myShows.length === 0 ? (
            <p className="acct-lede">You&apos;re not on any shows yet. Request to join one.</p>
          ) : (
            <ul className="acct-list">
              {myShows.map((show) => (
                <li key={show.id}>
                  <button type="button" className="acct-row" style={{ padding: '16px 4px', gap: 18 }} onClick={() => onOpenShow(show)}>
                    <span className="acct-tile" aria-hidden="true">
                      {show.image_url ? <img src={show.image_url} alt="" /> : (show.name[0] || '?').toUpperCase()}
                    </span>
                    <span className="acct-row__text">
                      <span className="acct-row__name">{show.name}</span>
                    </span>
                    <ArrowIcon size={22} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="acct-panel" aria-labelledby="js" style={{ flex: '2 1 360px' }}>
          <div className="acct-panel__head">
            <h2 id="js" className="acct-h3">Join a show</h2>
            <p className="acct-sub">Pick a show you co-present. The Shows team gets your request and adds you.</p>
          </div>
          {otherShows.length === 0 ? (
            <p className="acct-sub">Every scheduled show is already on your list, or none are loaded yet.</p>
          ) : (
            <form
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              onSubmit={(event) => {
                event.preventDefault();
                if (selected && !requested) onJoin(selected);
              }}>
              <Field id="join" label="Show">
                <Select id="join" value={joinShowId} onChange={(e) => setJoinShowId(e.target.value)}>
                  <option value="">Choose a show</option>
                  {otherShows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {pendingShowIds.has(show.id) ? `${show.name} (requested)` : show.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <button type="submit" className="acct-btn" disabled={!joinShowId || requested || busyShowId === joinShowId}>
                {requested ? 'Requested' : busyShowId === joinShowId ? 'Sending…' : 'Request to join'}
              </button>
            </form>
          )}
          {waiting.length > 0 ? (
            <div className="acct-pending">
              <span className="acct-label">Waiting for approval</span>
              {waiting.map((show) => (
                <p key={show.id}>{show.name}</p>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
