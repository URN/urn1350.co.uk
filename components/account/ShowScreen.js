import React, { useEffect, useState } from 'react';

import { isValidSpotifyUrl } from '../../utils/presenters';
import {
  addMemberToShow,
  getShowKind,
  isShowVisible,
  listShowPresenters,
  removeMemberFromShow,
  updateShowKind,
  updateShowLinks,
  uploadShowImage,
} from '../../utils/shows';
import { BackLink, Field, Select, initialsOf } from './ui';

export default function ShowScreen({
  show,
  userId,
  isAdmin,
  canEdit,
  presenters: allPresenters,
  backText,
  onBack,
  onChanged,
  onError,
  onMessage,
  onVisibility,
  onLeave,
}) {
  const [members, setMembers] = useState([]);
  const [spotify, setSpotify] = useState(show.spotify_playlist_url || '');
  const [instagram, setInstagram] = useState(show.instagram_url || '');
  const [saving, setSaving] = useState(false);
  const [addPresenterId, setAddPresenterId] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    setSpotify(show.spotify_playlist_url || '');
    setInstagram(show.instagram_url || '');
    let active = true;
    listShowPresenters(show.id)
      .then((people) => active && setMembers(people))
      .catch(() => active && setMembers([]));
    return () => {
      active = false;
    };
  }, [show]);

  const kind = getShowKind(show);
  const spotifyTrim = spotify.trim();
  const spotifyBad = spotifyTrim.length > 0 && !isValidSpotifyUrl(spotifyTrim);

  async function handleImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canEdit) return;
    try {
      await uploadShowImage(show.id, file, kind);
      onMessage('Picture updated.');
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not upload the show picture.');
    }
  }

  async function handleLinks(event) {
    event.preventDefault();
    if (!canEdit || spotifyBad) return;
    setSaving(true);
    onError('');
    try {
      await updateShowLinks(show.id, {
        spotify_playlist_url: spotifyTrim || null,
        instagram_url: instagram.trim() || null,
      });
      onMessage('Links saved.');
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save the links.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPresenter(event) {
    event.preventDefault();
    if (!addPresenterId) return;
    try {
      await addMemberToShow(show.id, addPresenterId);
      setAddPresenterId('');
      onMessage('Presenter added.');
      await onChanged();
      setMembers(await listShowPresenters(show.id));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not add the presenter.');
    }
  }

  async function handleRemovePresenter(presenterId) {
    try {
      await removeMemberFromShow(show.id, presenterId);
      onMessage('Presenter removed.');
      await onChanged();
      setMembers(await listShowPresenters(show.id));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not remove the presenter.');
    }
  }

  function changeKind(next) {
    if (next === kind) return;
    updateShowKind(show.id, next)
      .then(onChanged)
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not change the show type.'));
  }

  const memberIds = new Set(members.map((person) => person.id));
  const addable = (allPresenters || []).filter((person) => !memberIds.has(person.id));
  const visible = isShowVisible(show);

  return (
    <>
      <BackLink onClick={onBack}>{backText}</BackLink>

      <section className="acct-showhead" aria-labelledby="h1">
        <div className="acct-showhead__cover">
          {show.image_url ? (
            <img src={show.image_url} alt="" />
          ) : (
            <span className="acct-showhead__mono" aria-hidden="true">{initialsOf(show.name).slice(0, 2)}</span>
          )}
          {canEdit ? (
            <label className="acct-showhead__edit">
              Change cover
              <input type="file" accept="image/*" onChange={handleImage} />
            </label>
          ) : null}
        </div>
        <div className="acct-showhead__body">
          <span className="acct-chip" style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 14 }}>
            {kind === 'podcast' ? 'Podcast' : 'Radio show'}
          </span>
          <h1 id="h1" className="acct-h1">{show.name}</h1>
        </div>
      </section>

      {isAdmin ? (
        <section className="acct-station" aria-labelledby="st">
          <h2 id="st" className="acct-label">Station settings · admins only</h2>
          <div role="group" aria-label="Show type" className="acct-seg">
            <button type="button" aria-pressed={kind === 'radio'} onClick={() => changeKind('radio')}>Radio show</button>
            <button type="button" aria-pressed={kind === 'podcast'} onClick={() => changeKind('podcast')}>Podcast</button>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={visible}
            className="acct-switch"
            onClick={() => onVisibility(show, !visible)}>
            <span className="acct-switch__track" aria-hidden="true"><i /></span>
            <span>
              Visible on Explore
              <small>Shows in the URN app&apos;s Explore tab</small>
            </span>
          </button>
        </section>
      ) : null}

      <div className="acct-cols">
        {canEdit ? (
          <form className="acct-panel" aria-labelledby="lk" onSubmit={handleLinks}>
            <div className="acct-panel__head">
              <h2 id="lk" className="acct-h3">Links</h2>
              <p className="acct-sub">These appear on the show&apos;s page and in the app.</p>
            </div>
            <Field id="ig" label="Instagram">
              <input id="ig" className="acct-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle or link" />
            </Field>
            <Field
              id="sp"
              label="Spotify"
              hintBad={spotifyBad}
              hint={spotifyBad ? 'Spotify links need to start with https://open.spotify.com/' : 'A playlist, artist or show link.'}>
              <input
                id="sp"
                className="acct-input"
                value={spotify}
                onChange={(e) => setSpotify(e.target.value)}
                aria-invalid={spotifyBad}
                aria-describedby="sp-hint"
                placeholder="https://open.spotify.com/…"
              />
            </Field>
            <button type="submit" className="acct-btn" disabled={saving || spotifyBad}>
              {saving ? 'Saving…' : 'Save links'}
            </button>
          </form>
        ) : null}

        <section className="acct-panel" aria-labelledby="pr">
          <h2 id="pr" className="acct-h3">Presenters</h2>
          <ul className="acct-people">
            {members.length === 0 ? (
              <li><span className="acct-sub">No presenters yet.</span></li>
            ) : (
              members.map((person) => {
                const name = person.display_name || person.email;
                return (
                  <li key={person.id}>
                    <span className="acct-initials" aria-hidden="true" style={{ width: 40, height: 40 }}>{initialsOf(name)}</span>
                    <span className="acct-people__name">
                      {name}
                      {person.id === userId ? <span className="acct-sub"> (you)</span> : null}
                    </span>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="acct-btn acct-btn--ghost acct-btn--sm"
                        aria-label={`Remove ${name}`}
                        onClick={() => handleRemovePresenter(person.id)}>
                        Remove
                      </button>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
          {isAdmin ? (
            <form className="acct-addrow" onSubmit={handleAddPresenter}>
              <Select id="addp" label="Add a presenter" value={addPresenterId} onChange={(e) => setAddPresenterId(e.target.value)}>
                <option value="">Add a presenter…</option>
                {addable.map((person) => (
                  <option key={person.id} value={person.id}>{person.display_name || person.email}</option>
                ))}
              </Select>
              <button type="submit" className="acct-btn" disabled={!addPresenterId}>Add</button>
            </form>
          ) : null}
        </section>
      </div>

      {onLeave ? (
        <section className="acct-leave" aria-label="Leave this show">
          {confirmLeave ? (
            <>
              <span>Leave {show.name}? You&apos;d need to request to rejoin.</span>
              <button type="button" className="acct-btn acct-btn--danger" onClick={onLeave}>Yes, leave</button>
              <button type="button" className="acct-btn acct-btn--ghost" onClick={() => setConfirmLeave(false)}>Stay</button>
            </>
          ) : (
            <button type="button" className="acct-btn acct-btn--warn" onClick={() => setConfirmLeave(true)}>Leave show</button>
          )}
        </section>
      ) : null}
    </>
  );
}
