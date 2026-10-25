import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import Seo from '../components/Seo';
import { ArrowIcon } from '../components/Icons';
import AccountBar from '../components/account/AccountBar';
import AdminsScreen from '../components/account/AdminsScreen';
import ProfileScreen from '../components/account/ProfileScreen';
import ScheduleScreen from '../components/account/ScheduleScreen';
import ShowScreen from '../components/account/ShowScreen';
import ShowsScreen from '../components/account/ShowsScreen';
import WebsiteScreen from '../components/account/WebsiteScreen';
import { Notice } from '../components/account/ui';
import { supabase } from '../utils/supabase';
import {
  ALLOWED_EMAIL_DOMAINS,
  accountNameFromUser,
  isAllowedEmail,
  signInWithMicrosoft,
  signOut,
} from '../utils/auth';
import { ensurePresenterRow, loadPresenterProfile, savePresenterProfile, uploadAvatar } from '../utils/presenters';
import {
  approveRequest,
  getAdminInfo,
  leaveShow,
  listAllShows,
  listMyPendingShowIds,
  listMyShows,
  listPendingRequests,
  listPresenters,
  listScheduledShows,
  rejectRequest,
  requestToJoinShow,
  setShowVisibility,
} from '../utils/shows';
import { permissionsForAdmin } from '../utils/adminAccess';

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [rejected, setRejected] = useState('');

  useEffect(() => {
    let active = true;

    function applySession(next) {
      if (!active) return;
      if (next && !isAllowedEmail(next.user.email)) {
        supabase.auth.signOut();
        setRejected(next.user.email || 'that account');
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
    <div className="acct">
      <Seo title="Members" description="Sign in to manage your URN shows and profile." />
      {!ready ? (
        <SignInPanel loading />
      ) : session ? (
        <MembersHome session={session} onSignedOut={() => setSession(null)} />
      ) : (
        <SignInPanel rejected={rejected} />
      )}
    </div>
  );
}

function SignInPanel({ loading, rejected }) {
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
    <div className="acct-signin">
      <div className="acct-signin__shape" aria-hidden="true">URN</div>
      <div className="acct-signin__top">
        <Link href="/" aria-label="URN home">
          <img src="/content/images/logo.png" alt="" width="44" height="44" />
        </Link>
        <Link href="/" style={{ fontSize: 15, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Back to the site</Link>
      </div>

      <div className="acct-signin__main">
        <div className="acct-signin__body">
          <h1 className="acct-h1 acct-signin__title">Members</h1>
          {loading ? (
            <p role="status" className="acct-loading" style={{ padding: 0 }}>Loading…</p>
          ) : (
            <>
              <p className="acct-signin__intro">
                Manage your show, download your recordings and keep your presenter profile up to date.
              </p>
              {rejected ? (
                <div role="alert" className="acct-signin__alert">
                  <strong>That account can&apos;t sign in here.</strong>
                  <span>
                    You used <strong>{rejected}</strong>, so we&apos;ve signed you back out. Use your University of
                    Nottingham or URN account instead.
                  </span>
                </div>
              ) : null}
              {error ? (
                <div role="alert" className="acct-signin__alert acct-signin__alert--error">
                  <strong>Sign-in didn&apos;t finish.</strong>
                  <span>{error} If it keeps happening, message the Technical team.</span>
                </div>
              ) : null}
              <div className="acct-signin__cta">
                <button type="button" className="acct-btn" onClick={handleSignIn} disabled={busy} style={busy ? { opacity: 0.75 } : undefined}>
                  {busy ? 'Opening Microsoft…' : 'Sign in with Microsoft'}
                  <ArrowIcon size={20} stroke={4} />
                </button>
                <p className="acct-sub">
                  Use your <strong style={{ color: '#fff' }}>@{ALLOWED_EMAIL_DOMAINS[0]}</strong> or{' '}
                  <strong style={{ color: '#fff' }}>@{ALLOWED_EMAIL_DOMAINS[1]}</strong> account.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="acct-signin__foot">
        Not a member yet? <Link href="/pages/get-involved">Find out how to get involved</Link>.
      </p>
    </div>
  );
}

const VIEW_TAB = { home: 'profile', shows: 'shows', schedule: 'schedule', website: 'website', admins: 'admins' };

function MembersHome({ session, onSignedOut }) {
  const userId = session.user.id;
  const email = session.user.email ?? '';
  const accountName = accountNameFromUser(session.user);

  const [loaded, setLoaded] = useState(false);
  const [displayName, setDisplayName] = useState(accountName);
  const [nameDraft, setNameDraft] = useState(accountName);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState('');
  const [perms, setPerms] = useState(() => permissionsForAdmin(null));
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
    const next = permissionsForAdmin(admin);
    setIsAdmin(!!admin);
    setAdminRole(admin?.role || '');
    setPerms(next);
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
    if (admin && next.canManageShows) {
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

  const tabs = [{ key: 'profile', label: 'Profile' }];
  if (isAdmin) {
    if (perms.canManageShows) tabs.push({ key: 'shows', label: 'Manage shows', count: pendingRequests.length || '' });
    if (perms.canEditSchedule) tabs.push({ key: 'schedule', label: 'Schedule' });
    if (perms.canManageWebsite) {
      tabs.push({ key: 'website', label: perms.canManageWebsiteFull ? 'Website' : 'Spotify playlist' });
    }
    if (perms.canManageAdmins) tabs.push({ key: 'admins', label: 'Admins' });
  }

  const openShow = view.name === 'show'
    ? allShows.find((show) => show.id === view.showId) || myShows.find((show) => show.id === view.showId) || null
    : null;
  const currentTab = view.name === 'show' ? (view.back?.name === 'shows' ? 'shows' : 'profile') : VIEW_TAB[view.name];

  // Send people home if the screen they are on is not one they may use (or a show that has gone).
  const allowed = tabs.some((tab) => tab.key === currentTab) && (view.name !== 'show' || !!openShow);
  useEffect(() => {
    if (loaded && !allowed) setView({ name: 'home' });
  }, [loaded, allowed]);

  function go(next) {
    setError('');
    setMessage('');
    setView(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }

  function selectTab(key) {
    go({ name: key === 'profile' ? 'home' : key });
  }

  async function handleAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canEditProfile) return;
    setError('');
    try {
      const url = await uploadAvatar(userId, file);
      setAvatarUrl(url);
      await savePresenterProfile({ id: userId, email, display_name: displayName, avatar_url: url });
      setMessage('Photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the picture.');
    }
  }

  async function handleSaveName(event) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setError('');
    setSavingName(true);
    try {
      await savePresenterProfile({ id: userId, email, display_name: trimmed, avatar_url: avatarUrl });
      setDisplayName(trimmed);
      setEditingName(false);
      setMessage('Name updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your name.');
    } finally {
      setSavingName(false);
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
      setMessage("Request sent. You'll see the show here once it's approved.");
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
    setBusyShowId(show.id);
    setError('');
    try {
      await leaveShow(show.id, userId);
      await refresh();
      go({ name: 'home' });
      setMessage(`You left ${show.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave the show.');
    } finally {
      setBusyShowId(null);
    }
  }

  async function handleRequest(request, approve) {
    setError('');
    try {
      if (approve) await approveRequest(request.show_id, request.presenter_id);
      else await rejectRequest(request.show_id, request.presenter_id);
      setMessage(approve ? `${request.presenter_name} added to ${request.show_name}.` : `Request from ${request.presenter_name} rejected.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the request.');
    }
  }

  if (!loaded) return <p role="status" className="acct-loading">Loading your profile…</p>;

  let screen = null;
  if (!allowed) {
    screen = null;
  } else if (view.name === 'show') {
    const fromList = view.back?.name === 'shows';
    screen = (
      <ShowScreen
        show={openShow}
        userId={userId}
        isAdmin={isAdmin && perms.canManageShows}
        canEdit={(isAdmin && perms.canManageShows) || myShowIds.has(openShow.id)}
        presenters={presenters}
        backText={fromList ? 'Manage shows' : 'Your shows'}
        onBack={() => go(view.back || { name: 'home' })}
        onChanged={refresh}
        onError={setError}
        onMessage={setMessage}
        onVisibility={handleVisibility}
        onLeave={myShowIds.has(openShow.id) ? () => handleLeave(openShow) : null}
      />
    );
  } else if (view.name === 'shows') {
    screen = (
      <ShowsScreen
        shows={allShows}
        requests={pendingRequests}
        initialKind={view.kind}
        onRequest={handleRequest}
        onOpenShow={(show, kind) => go({ name: 'show', showId: show.id, back: { name: 'shows', kind } })}
      />
    );
  } else if (view.name === 'schedule') {
    screen = <ScheduleScreen userId={userId} shows={allShows} onChanged={refresh} onError={setError} onMessage={setMessage} />;
  } else if (view.name === 'website') {
    screen = <WebsiteScreen perms={perms} onError={setError} onMessage={setMessage} />;
  } else if (view.name === 'admins') {
    screen = <AdminsScreen error={error} onError={setError} onMessage={setMessage} />;
  } else {
    screen = (
      <ProfileScreen
        email={email}
        displayName={displayName}
        nameDraft={nameDraft}
        setNameDraft={setNameDraft}
        editingName={editingName}
        setEditingName={setEditingName}
        onSaveName={handleSaveName}
        savingName={savingName}
        avatarUrl={avatarUrl}
        canEditProfile={canEditProfile}
        onAvatar={handleAvatar}
        adminRole={adminRole}
        isAdmin={isAdmin}
        canReview={isAdmin && perms.canManageShows}
        pendingCount={pendingRequests.length}
        onReview={() => go({ name: 'shows' })}
        myShows={myShows}
        onOpenShow={(show) => go({ name: 'show', showId: show.id, back: { name: 'home' } })}
        otherShows={otherShows}
        pendingShowIds={pendingShowIds}
        joinShowId={joinShowId}
        setJoinShowId={setJoinShowId}
        busyShowId={busyShowId}
        onJoin={handleJoin}
        onSignOut={async () => {
          await signOut();
          onSignedOut();
        }}
      />
    );
  }

  return (
    <>
      <AccountBar tabs={tabs} current={currentTab} onSelect={selectTab} name={displayName} avatarUrl={avatarUrl} />
      <div className="acct-main">
        <Notice error={error} message={message} onDismiss={() => setMessage('')} />
        {screen}
      </div>
    </>
  );
}
