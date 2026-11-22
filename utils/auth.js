import { supabase } from './supabase';

export { ALLOWED_EMAIL_DOMAINS, isAllowedEmail } from '../lib/allowedEmail.mjs';

export function accountNameFromUser(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
}

/** Sends the browser to Microsoft, then back to /account. */
export async function signInWithMicrosoft() {
  const redirectTo = `${window.location.origin}/account`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo,
      scopes: 'openid profile email',
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
