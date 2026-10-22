import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import Settings from '../settings.json';
import { supabase } from '../utils/supabase';
import {
  ALLOWED_EMAIL_DOMAINS,
  accountNameFromUser,
  isAllowedEmail,
  signInWithMicrosoft,
  signOut,
} from '../utils/auth';
import {
  ensurePresenterRow,
  isValidSpotifyUrl,
  loadPresenterProfile,
  savePresenterProfile,
  uploadAvatar,
} from '../utils/presenters';
import {
  addMemberToShow,
  addShowToSchedule,
  approveRequest,
  getShowKind,
  getAdminInfo,
  isShowVisible,
  leaveShow,
  listAllShows,
  listMyPendingShowIds,
  listMyShows,
  listPendingRequests,
  listPresenters,
  listScheduledShows,
  listShowPresenters,
  rejectRequest,
  removeMemberFromShow,
  removeScheduleSlot,
  requestToJoinShow,
  setShowVisibility,
  updateScheduleSlot,
  updateShowKind,
  updateShowLinks,
  uploadShowImage,
} from '../utils/shows';
import { SHOW_TYPES, WEEKDAYS, blocksForDay, fetchSchedule } from '../utils/schedule';
import { listInstagramPostsAdmin, updateInstagramPost } from '../utils/instagramAdmin';
import { toInstagramPostUrl } from '../utils/instagram';
import { getWebsitePageBody, listWebsitePages, saveWebsitePageBody } from '../utils/pagesAdmin';
import { getSpotifyPlaylistId, setSiteSetting } from '../utils/siteSettings';
import {
  ACCESS_LEVELS,
  addExtraAdmin,
  COMMITTEE_ROLES,
  listAdminsWithNames,
  permissionsForAdmin,
  removeAdmin,
  setCommitteeAdmin,
  updateExtraAdmin,
} from '../utils/adminAccess';

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    function applySession(next) {
      if (!active) return;
      if (next && !isAllowedEmail(next.user.email)) {
        supabase.auth.signOut();
        setNotice(
          `Please sign in with your ${ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(' or ')} account.`
        );
        setSession(null);
      } else {
        setSession(next);
      }
      setReady(true);
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session)).catch(() => {
      if (active) setReady(true);
    });
    const timeout = window.setTimeout(() => {
      if (active) setReady(true);
    }, 4000);

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      applySession(next);
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Header title={`Presenters - ${Settings.siteTitle}`} />
      <main className="account-page">
        <h1>Presenters</h1>
        {!ready ? (
          <p className="account-muted">Loading…</p>
        ) : session ? (
          <PresenterHome session={session} onSignedOut={() => setSession(null)} />
        ) : (
          <SignInPanel notice={notice} />
        )}
      </main>
      <Footer />
    </>
  );
}

function SignInPanel({ notice }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setBusy(true);
    setError('');
    try {
      await signInWithMicrosoft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Microsoft sign-in.');
      setBusy(false);
    }
  }

  return (
    <section className="account-card account-signin">
      <p>Sign in with your university Microsoft account to manage your presenter profile.</p>
      {notice ? <p className="account-error">{notice}</p> : null}
      {error ? <p className="account-error">{error}</p> : null}
      <button type="button" className="account-button" onClick={handleSignIn} disabled={busy}>
        {busy ? 'Opening Microsoft…' : 'Sign in with Microsoft'}
      </button>
      <p className="account-muted">
        Use your {ALLOWED_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(' or ')} email
      </p>
    </section>
  );
}

function PresenterHome({ session, onSignedOut }) {
  const userId = session.user.id;
  const email = session.user.email ?? '';
  const accountName = accountNameFromUser(session.user);

  const [loaded, setLoaded] = useState(false);
  const [displayName, setDisplayName] = useState(accountName);
  const [nameDraft, setNameDraft] = useState(accountName);
  const [editingName, setEditingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState('');
  const [adminPerms, setAdminPerms] = useState(() => permissionsForAdmin(null));
  const [myShows, setMyShows] = useState([]);
  const [allShows, setAllShows] = useState([]);
  const [scheduledShows, setScheduledShows] = useState([]);
  const [pendingShowIds, setPendingShowIds] = useState(new Set());
  const [pendingRequests, setPendingRequests] = useState([]);
  const [presenters, setPresenters] = useState([]);
  const [joinShowId, setJoinShowId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyShowId, setBusyShowId] = useState(null);
  const [view, setView] = useState({ name: 'home' });

  const refresh = useCallback(async () => {
    const admin = await getAdminInfo(email);
    const perms = permissionsForAdmin(admin);
    setIsAdmin(!!admin);
    setAdminRole(admin?.role || '');
    setAdminPerms(perms);
    const [mine, all, scheduled, pendingIds] = await Promise.all([
      listMyShows(userId),
      listAllShows(),
      listScheduledShows(),
      listMyPendingShowIds(userId),
    ]);
    setMyShows(mine);
    setAllShows(all);
    setScheduledShows(scheduled);
    setPendingShowIds(pendingIds);
    if (admin && perms.canManageShows) {
      const [requests, people] = await Promise.all([listPendingRequests(), listPresenters()]);
      setPendingRequests(requests);
      setPresenters(people);
    }
  }, [email, userId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        await ensurePresenterRow(userId, email, accountName);
        const profile = await loadPresenterProfile(userId);
        if (!active) return;
        setAvatarUrl(profile?.avatar_url ?? null);
        setDisplayName(profile?.display_name || accountName);
        setNameDraft(profile?.display_name || accountName);
        await refresh();
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your profile.');
      } finally {
        if (active) setLoaded(true);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [userId, email, accountName, refresh]);

  const canEditProfile = myShows.length > 0 || isAdmin;
  const myShowIds = new Set(myShows.map((show) => show.id));
  const otherShows = scheduledShows.filter((show) => !myShowIds.has(show.id));

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canEditProfile) return;
    setError('');
    try {
      const url = await uploadAvatar(userId, file);
      setAvatarUrl(url);
      await savePresenterProfile({
        id: userId,
        email,
        display_name: displayName,
        avatar_url: url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the picture.');
    }
  }

  async function handleSaveName(event) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setError('Your display name cannot be empty.');
      return;
    }
    setError('');
    try {
      await savePresenterProfile({
        id: userId,
        email,
        display_name: trimmed,
        avatar_url: avatarUrl,
      });
      setDisplayName(trimmed);
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your name.');
    }
  }

  async function handleJoin(show) {
    setBusyShowId(show.id);
    setError('');
    setMessage('');
    try {
      await requestToJoinShow(show.id, userId);
      await refresh();
      setJoinShowId('');
      setMessage(`Request sent to join ${show.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request.');
    } finally {
      setBusyShowId(null);
    }
  }

  async function handleVisibility(show, visible) {
    setError('');
    try {
      await setShowVisibility(show.id, visible);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update visibility.');
    }
  }

  async function handleLeave(show) {
    if (!window.confirm(`Remove yourself from "${show.name}"?`)) return;
    setBusyShowId(show.id);
    setError('');
    try {
      await leaveShow(show.id, userId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave the show.');
    } finally {
      setBusyShowId(null);
    }
  }

  if (!loaded) return <p className="account-muted">Loading your profile…</p>;

  const openShow = allShows.find((show) => show.id === view.showId)
    || myShows.find((show) => show.id === view.showId)
    || null;

  if (view.name === 'show' && openShow) {
    return (
      <>
        {error ? <p className="account-error">{error}</p> : null}
        {message ? <p className="account-ok">{message}</p> : null}
        <button type="button" className="account-back" onClick={() => setView(view.back || { name: 'home' })}>
          ← Back
        </button>
        <ShowDetailEditor
          show={openShow}
          isAdmin={isAdmin}
          canEdit={isAdmin || myShowIds.has(openShow.id)}
          presenters={presenters}
          onChanged={refresh}
          onError={setError}
          onMessage={setMessage}
          onVisibility={handleVisibility}
          onLeave={myShowIds.has(openShow.id) ? () => handleLeave(openShow) : null}
        />
      </>
    );
  }

  if (isAdmin && view.name !== 'home') {
    return (
      <AdminHub
        view={view}
        setView={setView}
        userId={userId}
        shows={allShows}
        presenters={presenters}
        pendingRequests={pendingRequests}
        perms={adminPerms}
        onChanged={refresh}
        onError={setError}
        onMessage={setMessage}
        error={error}
        message={message}
      />
    );
  }

  return (
    <>
      <section className="account-card account-profile">
        <div className="account-avatar-block">
          <label className={`account-avatar${canEditProfile ? '' : ' is-disabled'}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span>{(displayName[0] || '?').toUpperCase()}</span>
            )}
            <input type="file" accept="image/*" onChange={handleAvatar} disabled={!canEditProfile} />
          </label>
          {canEditProfile ? (
            <label className="account-avatar-edit">
              Edit
              <input type="file" accept="image/*" onChange={handleAvatar} />
            </label>
          ) : null}
        </div>
        <div>
          {editingName ? (
            <form className="account-inline" onSubmit={handleSaveName}>
              <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingName(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="account-name"
              onClick={() => {
                setNameDraft(displayName);
                setEditingName(true);
              }}>
              {displayName}
            </button>
          )}
          <p className="account-muted">{email}</p>
          {isAdmin && adminRole ? <p className="account-role-label">{adminRole}</p> : null}
          <button
            type="button"
            className="account-text-button"
            onClick={async () => {
              await signOut();
              onSignedOut();
            }}>
            Sign out
          </button>
        </div>
      </section>

      {error ? <p className="account-error">{error}</p> : null}
      {message ? <p className="account-ok">{message}</p> : null}

      <h2>Your shows</h2>
      {myShows.length === 0 ? (
        <p className="account-muted">You&apos;re not on any shows yet. Request to join one below.</p>
      ) : (
        <ul className="account-nav-list">
          {myShows.map((show) => (
            <li key={show.id}>
              <button
                type="button"
                className="account-nav-row"
                onClick={() => setView({ name: 'show', showId: show.id, back: { name: 'home' } })}>
                <span>{show.name}</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Join a show</h2>
      {otherShows.length === 0 ? (
        <p className="account-muted">Every scheduled show is already on your list, or none are loaded yet.</p>
      ) : (
        <section className="account-card">
          <form
            className="account-form"
            onSubmit={(event) => {
              event.preventDefault();
              const show = otherShows.find((item) => item.id === joinShowId);
              if (show && !pendingShowIds.has(show.id)) handleJoin(show);
            }}>
            <label>
              Show
              <select value={joinShowId} onChange={(event) => setJoinShowId(event.target.value)}>
                <option value="">Choose a show</option>
                {otherShows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {pendingShowIds.has(show.id) ? `${show.name} (requested)` : show.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={!joinShowId || pendingShowIds.has(joinShowId) || busyShowId === joinShowId}>
              {pendingShowIds.has(joinShowId)
                ? 'Requested'
                : busyShowId === joinShowId
                  ? 'Sending…'
                  : 'Request to join'}
            </button>
          </form>
        </section>
      )}

      {isAdmin ? (
        <nav className="account-admin-menu" aria-label="Admin">
          {adminPerms.canManageShows ? (
            <button type="button" className="account-nav-row" onClick={() => setView({ name: 'manage-shows' })}>
              <span>Manage shows</span>
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
          {adminPerms.canEditSchedule ? (
            <button type="button" className="account-nav-row" onClick={() => setView({ name: 'schedule' })}>
              <span>Edit schedule</span>
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
          {adminPerms.canManageWebsite ? (
            <button
              type="button"
              className="account-nav-row"
              onClick={() =>
                setView({
                  name: adminPerms.canManageWebsiteFull ? 'website' : 'website-spotify',
                })
              }>
              <span>{adminPerms.canManageWebsiteFull ? 'Manage website' : 'Spotify playlist'}</span>
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
          {adminPerms.canManageApp ? (
            <button type="button" className="account-nav-row" onClick={() => setView({ name: 'app' })}>
              <span>Manage app</span>
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
          {adminPerms.canManageAdmins ? (
            <button type="button" className="account-nav-row" onClick={() => setView({ name: 'admins' })}>
              <span>Manage admins</span>
              <span aria-hidden="true">›</span>
            </button>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

function ShowDetailEditor({
  show,
  isAdmin,
  canEdit,
  presenters: allPresenters,
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

  async function handleImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canEdit) return;
    try {
      await uploadShowImage(show.id, file, getShowKind(show));
      onMessage?.('Picture updated.');
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not upload the show picture.');
    }
  }

  async function handleLinks(event) {
    event.preventDefault();
    if (!canEdit) return;
    const spotifyUrl = spotify.trim();
    if (spotifyUrl && !isValidSpotifyUrl(spotifyUrl)) {
      onError('Playlist links should start with https://open.spotify.com/');
      return;
    }
    setSaving(true);
    onError('');
    try {
      await updateShowLinks(show.id, {
        spotify_playlist_url: spotifyUrl || null,
        instagram_url: instagram.trim() || null,
      });
      onMessage?.('Links saved.');
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
      onMessage?.('Presenter added.');
      await onChanged();
      setMembers(await listShowPresenters(show.id));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not add the presenter.');
    }
  }

  async function handleRemovePresenter(presenterId) {
    try {
      await removeMemberFromShow(show.id, presenterId);
      onMessage?.('Presenter removed.');
      await onChanged();
      setMembers(await listShowPresenters(show.id));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not remove the presenter.');
    }
  }

  const memberIds = new Set(members.map((person) => person.id));
  const addable = (allPresenters || []).filter((person) => !memberIds.has(person.id));

  return (
    <section className="account-card show-profile">
      <div className="show-profile-header">
        <label className={`show-cover-edit${canEdit ? ' is-editable' : ''}`}>
          {show.image_url ? (
            <img className="show-profile-image" src={show.image_url} alt="" />
          ) : (
            <span className="show-cover-placeholder">{(show.name[0] || '?').toUpperCase()}</span>
          )}
          {canEdit ? <input type="file" accept="image/*" onChange={handleImage} /> : null}
          {canEdit ? <span className="show-cover-hint">Edit</span> : null}
        </label>
        <div className="show-profile-heading">
          <h2>{show.name}</h2>
          <p className="account-muted">{getShowKind(show) === 'podcast' ? 'Podcast' : 'Radio show'}</p>
        </div>
      </div>

      {isAdmin ? (
        <div className="show-profile-controls">
          <label className="account-check">
            <input
              type="checkbox"
              checked={isShowVisible(show)}
              onChange={(event) => onVisibility(show, event.target.checked)}
            />
            Visible on Explore (app)
          </label>
          <div className="show-kind-toggle">
            <button
              type="button"
              className={getShowKind(show) === 'radio' ? 'is-active' : ''}
              onClick={() =>
                updateShowKind(show.id, 'radio')
                  .then(onChanged)
                  .catch((err) => onError(err instanceof Error ? err.message : 'Could not change the show type.'))
              }
              disabled={getShowKind(show) === 'radio'}>
              Radio show
            </button>
            <button
              type="button"
              className={getShowKind(show) === 'podcast' ? 'is-active' : ''}
              onClick={() =>
                updateShowKind(show.id, 'podcast')
                  .then(onChanged)
                  .catch((err) => onError(err instanceof Error ? err.message : 'Could not change the show type.'))
              }
              disabled={getShowKind(show) === 'podcast'}>
              Podcast
            </button>
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleLinks} className="account-form">
          <label>
            Instagram
            <input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@handle or link" />
          </label>
          <label>
            Spotify
            <input value={spotify} onChange={(event) => setSpotify(event.target.value)} placeholder="https://open.spotify.com/..." />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save links'}
          </button>
        </form>
      ) : null}

      <div className="show-presenters">
        <h3>Presenters</h3>
        <ul className="account-list account-list--inset">
          {members.length === 0 ? (
            <li>
              <span className="account-muted">No presenters yet.</span>
            </li>
          ) : (
            members.map((person) => (
              <li key={person.id}>
                <span>{person.display_name || person.email}</span>
                {isAdmin ? (
                  <button type="button" className="account-text-button" onClick={() => handleRemovePresenter(person.id)}>
                    Remove
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>

        {isAdmin ? (
          <form className="account-form account-form--inline" onSubmit={handleAddPresenter}>
            <label>
              Add presenter
              <select value={addPresenterId} onChange={(event) => setAddPresenterId(event.target.value)}>
                <option value="">Choose a presenter</option>
                {addable.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name || person.email}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={!addPresenterId}>
              Add
            </button>
          </form>
        ) : null}
      </div>

      {onLeave ? (
        <button type="button" className="timetable-remove show-leave" onClick={onLeave}>
          Leave show
        </button>
      ) : null}
    </section>
  );
}

const SLOT_TYPES = [...SHOW_TYPES, 'automation'];

function formatHour(hour) {
  if (hour === 0 || hour === 24) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function formatRange(start, end) {
  return `${formatHour(start)}–${formatHour(end)}`;
}

function typeLabel(type) {
  return String(type || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function typeClass(type) {
  return type === 'automation' ? 'is-automation' : type;
}

function defaultType(start) {
  if (start >= 7 && start < 10) return 'breakfast';
  if (start >= 10 && start < 16) return 'daytime';
  if (start >= 16 && start < 18) return 'drivetime';
  if (start >= 18 && start < 20) return 'sport';
  if (start >= 20 && start < 22) return 'pre-club';
  return 'after-dark';
}

function scheduleError(err, fallback) {
  const message = err instanceof Error ? err.message : fallback;
  if (/row-level security|permission denied|42501/i.test(message)) {
    return 'That change was blocked. In Supabase, run urn-app/supabase/schedule-admin.sql so admins can edit the timetable.';
  }
  return message;
}

function TimetableEditor({ userId, onChanged, onError, onMessage }) {
  const [schedule, setSchedule] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const load = useCallback(async () => {
    const next = await fetchSchedule();
    setSchedule(next);
    setLoadError('');
  }, []);

  useEffect(() => {
    let active = true;
    load().catch((err) => {
      if (!active) return;
      const message = err instanceof Error ? err.message : 'Could not load the timetable.';
      setLoadError(message);
      onErrorRef.current(message);
    });
    return () => {
      active = false;
    };
  }, [load]);

  function openEmpty(day, block) {
    onError('');
    setDraft({
      id: null,
      day,
      name: '',
      start: block.start,
      end: block.end,
      anchorStart: block.start,
      anchorEnd: block.end,
      type: defaultType(block.start),
    });
  }

  function openShow(day, block) {
    onError('');
    setDraft({
      id: block.id,
      day,
      name: block.name,
      start: block.start,
      end: block.end,
      type: block.type || 'daytime',
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!draft) return;
    const start = Number(draft.start);
    const end = Number(draft.end);
    setBusy(true);
    onError('');
    try {
      const input = {
        name: draft.name,
        day: draft.day,
        startHour: start,
        endHour: end,
        showType: draft.type,
        userId,
      };
      if (draft.id) await updateScheduleSlot({ ...input, id: draft.id });
      else await addShowToSchedule(input);
      onMessage(
        draft.id
          ? `${draft.name.trim()} updated on ${draft.day}.`
          : `${draft.name.trim()} is on the ${draft.day} schedule.`
      );
      setDraft(null);
      await load();
      await onChanged();
    } catch (err) {
      onError(scheduleError(err, 'Could not save that slot.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!draft?.id) return;
    if (!window.confirm(`Take "${draft.name}" off ${draft.day} ${formatRange(draft.start, draft.end)}?`)) return;
    setBusy(true);
    onError('');
    try {
      await removeScheduleSlot(draft.id);
      onMessage(`${draft.name} was taken off ${draft.day}.`);
      setDraft(null);
      await load();
      await onChanged();
    } catch (err) {
      onError(scheduleError(err, 'Could not clear that slot.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-card account-timetable">
      <h3>Timetable</h3>
      <p className="account-muted">
        Coloured blocks are filled. Dashed blocks are empty. Click one to add, change, or clear a show.
      </p>
      <div className="timetable-legend">
        {SLOT_TYPES.map((type) => (
          <span key={type} className={`timetable-key ${typeClass(type)}`}>
            {typeLabel(type)}
          </span>
        ))}
        <span className="timetable-key is-empty">Empty</span>
      </div>
      {loadError ? (
        <p className="account-error">{loadError}</p>
      ) : !schedule ? (
        <p className="account-muted">Loading the timetable…</p>
      ) : (
        <div className="timetable-scroll">
          <div className="timetable" role="grid" aria-label="Weekly timetable">
            {WEEKDAYS.map((day, index) => (
              <div key={day} className="timetable-head" style={{ gridColumn: index + 2 }}>
                {day.slice(0, 3)}
              </div>
            ))}
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="timetable-hour" style={{ gridRow: hour + 2 }}>
                {formatHour(hour)}
              </div>
            ))}
            {WEEKDAYS.map((day, dayIndex) =>
              blocksForDay(schedule[day]).map((block) => {
                const selected =
                  draft &&
                  draft.day === day &&
                  ((draft.id && block.id === draft.id) ||
                    (!draft.id &&
                      block.kind === 'empty' &&
                      draft.anchorStart === block.start &&
                      draft.anchorEnd === block.end));
                return (
                  <button
                    key={`${day}-${block.kind}-${block.start}`}
                    type="button"
                    className={`timetable-slot ${block.kind === 'empty' ? 'is-empty' : typeClass(block.type)}${
                      selected ? ' is-selected' : ''
                    }`}
                    style={{
                      gridColumn: dayIndex + 2,
                      gridRow: `${block.start + 2} / ${block.end + 2}`,
                    }}
                    title={
                      block.kind === 'empty'
                        ? `Empty ${formatRange(block.start, block.end)}`
                        : `${block.name} ${formatRange(block.start, block.end)}`
                    }
                    onClick={() => (block.kind === 'empty' ? openEmpty(day, block) : openShow(day, block))}>
                    <span className="timetable-slot-name">{block.kind === 'empty' ? 'Empty' : block.name}</span>
                    {block.end - block.start > 1 ? (
                      <span className="timetable-slot-time">{formatRange(block.start, block.end)}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {draft ? (
        <form className="account-form timetable-editor" onSubmit={handleSave}>
          <h3>{draft.id ? `Edit ${draft.name}` : `Fill ${draft.day} ${formatRange(Number(draft.start), Number(draft.end))}`}</h3>
          <label>
            Show name
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              autoFocus
            />
          </label>
          <label>
            Day
            <select value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })}>
              {WEEKDAYS.map((weekday) => (
                <option key={weekday} value={weekday}>
                  {weekday}
                </option>
              ))}
            </select>
          </label>
          <div className="timetable-hours-fields">
            <label>
              Start
              <select
                value={draft.start}
                onChange={(event) => setDraft({ ...draft, start: Number(event.target.value) })}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              End
              <select
                value={draft.end}
                onChange={(event) => setDraft({ ...draft, end: Number(event.target.value) })}>
                {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Type
            <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
              {SLOT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <div className="timetable-actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Saving…' : draft.id ? 'Save changes' : 'Add to timetable'}
            </button>
            {draft.id ? (
              <button type="button" className="timetable-remove" onClick={handleRemove} disabled={busy}>
                Clear slot
              </button>
            ) : null}
            <button type="button" className="account-text-button" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function AdminHub({
  view,
  setView,
  userId,
  shows,
  presenters,
  pendingRequests,
  perms,
  onChanged,
  onError,
  onMessage,
  error,
  message,
}) {
  const radioShows = shows.filter((show) => getShowKind(show) === 'radio');
  const podcasts = shows.filter((show) => getShowKind(show) === 'podcast');

  const allowed = (() => {
    switch (view.name) {
      case 'manage-shows':
      case 'pending':
      case 'radio-shows':
      case 'podcasts':
        return perms.canManageShows;
      case 'schedule':
        return perms.canEditSchedule;
      case 'website':
      case 'website-instagram':
      case 'website-pages':
      case 'website-page':
        return perms.canManageWebsiteFull;
      case 'website-spotify':
        return perms.canManageSpotify;
      case 'app':
        return perms.canManageApp;
      case 'admins':
        return perms.canManageAdmins;
      default:
        return false;
    }
  })();

  useEffect(() => {
    if (!allowed) setView({ name: 'home' });
  }, [allowed, setView]);

  async function handleRequest(request, approve) {
    onError('');
    try {
      if (approve) await approveRequest(request.show_id, request.presenter_id);
      else await rejectRequest(request.show_id, request.presenter_id);
      onMessage(approve ? 'Request approved.' : 'Request rejected.');
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update the request.');
    }
  }

  if (!allowed) return null;

  return (
    <>
      <button type="button" className="account-back" onClick={() => setView({ name: 'home' })}>
        ← Back to profile
      </button>
      {error ? <p className="account-error">{error}</p> : null}
      {message ? <p className="account-ok">{message}</p> : null}

      {view.name === 'manage-shows' ? (
        <section className="account-card">
          <h2>Manage shows</h2>
          <ul className="account-nav-list">
            <li>
              <button type="button" className="account-nav-row" onClick={() => setView({ name: 'pending' })}>
                <span>Pending requests{pendingRequests.length ? ` (${pendingRequests.length})` : ''}</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="account-nav-row" onClick={() => setView({ name: 'radio-shows' })}>
                <span>Radio shows</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="account-nav-row" onClick={() => setView({ name: 'podcasts' })}>
                <span>Podcasts</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          </ul>
        </section>
      ) : null}

      {view.name === 'pending' ? (
        <section className="account-card">
          <button type="button" className="account-back" onClick={() => setView({ name: 'manage-shows' })}>
            ← Manage shows
          </button>
          <h2>Pending requests</h2>
          {pendingRequests.length === 0 ? (
            <p className="account-muted">No pending requests.</p>
          ) : (
            <ul className="account-list">
              {pendingRequests.map((request) => (
                <li key={`${request.show_id}:${request.presenter_id}`}>
                  <span>
                    {request.presenter_name} → {request.show_name}
                  </span>
                  <span>
                    <button type="button" onClick={() => handleRequest(request, true)}>
                      Approve
                    </button>{' '}
                    <button type="button" onClick={() => handleRequest(request, false)}>
                      Reject
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {view.name === 'radio-shows' || view.name === 'podcasts' ? (
        <section className="account-card">
          <button type="button" className="account-back" onClick={() => setView({ name: 'manage-shows' })}>
            ← Manage shows
          </button>
          <h2>{view.name === 'podcasts' ? 'Podcasts' : 'Radio shows'}</h2>
          <ul className="account-nav-list">
            {(view.name === 'podcasts' ? podcasts : radioShows).map((show) => (
              <li key={show.id}>
                <button
                  type="button"
                  className="account-nav-row"
                  onClick={() =>
                    setView({
                      name: 'show',
                      showId: show.id,
                      back: { name: view.name },
                    })
                  }>
                  <span>{show.name}</span>
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {view.name === 'schedule' ? (
        <TimetableEditor userId={userId} onChanged={onChanged} onError={onError} onMessage={onMessage} />
      ) : null}

      {view.name === 'website' ? (
        <section className="account-card">
          <h2>Manage website</h2>
          <ul className="account-nav-list">
            <li>
              <button type="button" className="account-nav-row" onClick={() => setView({ name: 'website-instagram' })}>
                <span>Instagram links</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="account-nav-row" onClick={() => setView({ name: 'website-spotify' })}>
                <span>Spotify playlist</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="account-nav-row" onClick={() => setView({ name: 'website-pages' })}>
                <span>Pages</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          </ul>
        </section>
      ) : null}

      {view.name === 'website-instagram' ? (
        <WebsiteInstagramEditor
          onBack={() => setView({ name: 'website' })}
          onError={onError}
          onMessage={onMessage}
        />
      ) : null}

      {view.name === 'website-spotify' ? (
        <WebsiteSpotifyEditor
          onBack={() => setView({ name: perms.canManageWebsiteFull ? 'website' : 'home' })}
          onError={onError}
          onMessage={onMessage}
        />
      ) : null}

      {view.name === 'admins' ? (
        <ManageAdminsEditor onError={onError} onMessage={onMessage} />
      ) : null}

      {view.name === 'website-pages' ? (
        <WebsitePagesList
          onBack={() => setView({ name: 'website' })}
          onOpen={(slug) => setView({ name: 'website-page', slug })}
          onError={onError}
        />
      ) : null}

      {view.name === 'website-page' ? (
        <WebsitePageEditor
          slug={view.slug}
          onBack={() => setView({ name: 'website-pages' })}
          onError={onError}
          onMessage={onMessage}
        />
      ) : null}

      {view.name === 'app' ? (
        <section className="account-card">
          <h2>Manage app</h2>
          <p className="account-muted">
            App Explore visibility is edited on each show under Manage shows. More app-only settings can go here later.
          </p>
        </section>
      ) : null}
    </>
  );
}

function AccessLevelSelect({ value, onChange, id }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      {ACCESS_LEVELS.map((level) => (
        <option key={level.value} value={level.value}>
          {level.label}
        </option>
      ))}
    </select>
  );
}

function ManageAdminsEditor({ onError, onMessage }) {
  const [admins, setAdmins] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [busyKey, setBusyKey] = useState('');
  const [extraEmail, setExtraEmail] = useState('');
  const [extraLabel, setExtraLabel] = useState('Technical Team');
  const [extraAccess, setExtraAccess] = useState('full');
  const [extraDrafts, setExtraDrafts] = useState({});
  const [addingExtra, setAddingExtra] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const rows = await listAdminsWithNames();
    setAdmins(rows);
    const next = {};
    COMMITTEE_ROLES.forEach((title) => {
      const match = rows.find(
        (row) => !row.is_extra && String(row.role || '').toLowerCase() === title.toLowerCase()
      );
      next[title] = {
        email: match?.email || '',
        access: match?.access_level || 'shows',
      };
    });
    setDrafts(next);

    const extrasNext = {};
    rows
      .filter((row) => row.is_extra)
      .forEach((row) => {
        extrasNext[row.email] = {
          label: row.role || 'Technical Team',
          access: row.access_level || 'full',
        };
      });
    setExtraDrafts(extrasNext);
  }, []);

  useEffect(() => {
    reload()
      .then(() => setLoaded(true))
      .catch((err) =>
        onError(
          err instanceof Error
            ? err.message
            : 'Could not load admins. Run urn-app/supabase/admins-access.sql in Supabase.'
        )
      );
  }, [onError, reload]);

  async function saveSeat(title) {
    setBusyKey(title);
    onError('');
    try {
      const draft = drafts[title] || { email: '', access: 'shows' };
      await setCommitteeAdmin(title, draft.email || '', draft.access || 'shows');
      await reload();
      onMessage(`Saved ${title}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save that admin.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleAddExtra(event) {
    event.preventDefault();
    setAddingExtra(true);
    onError('');
    try {
      await addExtraAdmin(extraEmail, extraLabel, extraAccess);
      setExtraEmail('');
      setExtraLabel('Technical Team');
      setExtraAccess('full');
      await reload();
      onMessage('Extra admin added.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not add that admin.');
    } finally {
      setAddingExtra(false);
    }
  }

  async function saveExtra(email) {
    setBusyKey(email);
    onError('');
    try {
      const draft = extraDrafts[email] || { label: 'Technical Team', access: 'full' };
      await updateExtraAdmin(email, draft.label, draft.access);
      await reload();
      onMessage('Extra admin updated.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not update that admin.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleRemoveExtra(email) {
    onError('');
    try {
      await removeAdmin(email);
      await reload();
      onMessage('Admin removed.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not remove that admin.');
    }
  }

  const extras = admins.filter((row) => row.is_extra);

  return (
    <section className="account-card">
      <h2>Manage admins</h2>
      <p className="account-muted">
        Assign each committee role an email and access level. Display names appear after they sign in
        for the first time.
      </p>
      {!loaded ? (
        <p className="account-muted">Loading…</p>
      ) : (
        <>
          <div>
            {COMMITTEE_ROLES.map((title) => {
              const match = admins.find(
                (row) => !row.is_extra && String(row.role || '').toLowerCase() === title.toLowerCase()
              );
              const draft = drafts[title] || { email: '', access: 'shows' };
              return (
                <div className="account-admin-seat" key={title}>
                  <div className="account-admin-seat-title">{title}</div>
                  {match?.display_name ? (
                    <p className="account-admin-seat-name">{match.display_name}</p>
                  ) : match?.email ? (
                    <p className="account-admin-seat-name">Not signed in yet</p>
                  ) : null}
                  <div className="account-admin-seat-row">
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(event) =>
                        setDrafts({
                          ...drafts,
                          [title]: { ...draft, email: event.target.value },
                        })
                      }
                      placeholder="email@nottingham.ac.uk"
                    />
                    <AccessLevelSelect
                      value={draft.access}
                      onChange={(access) =>
                        setDrafts({
                          ...drafts,
                          [title]: { ...draft, access },
                        })
                      }
                    />
                    <button
                      type="button"
                      disabled={busyKey === title}
                      onClick={() => saveSeat(title)}>
                      {busyKey === title ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h3>Other admins</h3>
          <p className="account-muted">
            Add technical team accounts (or anyone else) and pick their access level.
          </p>
          {extras.length === 0 ? (
            <p className="account-muted">No extra admins yet.</p>
          ) : (
            <ul className="account-extra-list">
              {extras.map((row) => {
                const draft = extraDrafts[row.email] || {
                  label: row.role || 'Technical Team',
                  access: row.access_level || 'full',
                };
                return (
                  <li key={row.email}>
                    <div className="account-admin-seat">
                      <p className="account-admin-seat-name">
                        {row.display_name ? `${row.display_name} · ` : ''}
                        {row.email}
                      </p>
                      <div className="account-admin-seat-row">
                        <input
                          value={draft.label}
                          onChange={(event) =>
                            setExtraDrafts({
                              ...extraDrafts,
                              [row.email]: { ...draft, label: event.target.value },
                            })
                          }
                          placeholder="Technical Manager"
                        />
                        <AccessLevelSelect
                          value={draft.access}
                          onChange={(access) =>
                            setExtraDrafts({
                              ...extraDrafts,
                              [row.email]: { ...draft, access },
                            })
                          }
                        />
                        <button
                          type="button"
                          disabled={busyKey === row.email}
                          onClick={() => saveExtra(row.email)}>
                          {busyKey === row.email ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => handleRemoveExtra(row.email)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form className="account-form" onSubmit={handleAddExtra}>
            <label>
              Label
              <input
                value={extraLabel}
                onChange={(event) => setExtraLabel(event.target.value)}
                placeholder="Technical Manager"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={extraEmail}
                onChange={(event) => setExtraEmail(event.target.value)}
                placeholder="email@nottingham.ac.uk"
                required
              />
            </label>
            <label>
              Access
              <AccessLevelSelect value={extraAccess} onChange={setExtraAccess} />
            </label>
            <button type="submit" disabled={addingExtra || !extraEmail.trim()}>
              {addingExtra ? 'Adding…' : 'Add other admin'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

function WebsiteInstagramEditor({ onBack, onError, onMessage }) {
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
    <section className="account-card">
      <button type="button" className="account-back" onClick={onBack}>
        ← Manage website
      </button>
      <h2>Instagram links</h2>
      <p className="account-muted">Paste the normal Instagram post link — embed is added automatically.</p>
      <form className="account-form" onSubmit={handleSave}>
        {posts.map((post, index) => (
          <label key={post.id}>
            Post {index + 1}
            <input
              value={drafts[post.id] || ''}
              onChange={(event) => setDrafts({ ...drafts, [post.id]: event.target.value })}
              placeholder="https://www.instagram.com/p/…"
            />
          </label>
        ))}
        <button type="submit" disabled={busy || posts.length === 0}>
          {busy ? 'Saving…' : 'Save links'}
        </button>
      </form>
    </section>
  );
}

function WebsiteSpotifyEditor({ onBack, onError, onMessage }) {
  const [playlistId, setPlaylistId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSpotifyPlaylistId()
      .then(setPlaylistId)
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load Spotify playlist.'));
  }, [onError]);

  async function handleSave(event) {
    event.preventDefault();
    const value = playlistId.trim();
    const match = value.match(/playlist\/([A-Za-z0-9]+)/) || value.match(/^([A-Za-z0-9]+)$/);
    if (!match) {
      onError('Paste a Spotify playlist link or id.');
      return;
    }
    setBusy(true);
    onError('');
    try {
      await setSiteSetting('spotify_playlist', match[1]);
      setPlaylistId(match[1]);
      onMessage('Homepage Spotify playlist updated.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save the playlist. Run site-settings.sql first.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-card">
      <button type="button" className="account-back" onClick={onBack}>
        ← Manage website
      </button>
      <h2>Spotify playlist</h2>
      <form className="account-form" onSubmit={handleSave}>
        <label>
          Playlist link or id
          <input value={playlistId} onChange={(event) => setPlaylistId(event.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save playlist'}
        </button>
      </form>
    </section>
  );
}

function WebsitePagesList({ onBack, onOpen, onError }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    listWebsitePages()
      .then(setPages)
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load pages.'));
  }, [onError]);

  return (
    <section className="account-card">
      <button type="button" className="account-back" onClick={onBack}>
        ← Manage website
      </button>
      <h2>Pages</h2>
      <ul className="account-nav-list">
        {pages.map((page) => (
          <li key={page.slug}>
            <button type="button" className="account-nav-row" onClick={() => onOpen(page.slug)}>
              <span>{page.slug}</span>
              <span aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WebsitePageEditor({ slug, onBack, onError, onMessage }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getWebsitePageBody(slug)
      .then((page) => setBody(page?.body || ''))
      .catch((err) => onError(err instanceof Error ? err.message : 'Could not load the page.'));
  }, [slug, onError]);

  async function handleSave(event) {
    event.preventDefault();
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
    <section className="account-card">
      <button type="button" className="account-back" onClick={onBack}>
        ← Pages
      </button>
      <h2>{slug}</h2>
      <form className="account-form" onSubmit={handleSave}>
        <label>
          Markdown
          <textarea className="account-markdown" rows={18} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save page'}
        </button>
      </form>
    </section>
  );
}
