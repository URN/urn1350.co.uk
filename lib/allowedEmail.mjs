export const ALLOWED_EMAIL_DOMAINS = ['nottingham.ac.uk', 'urn1350.co.uk'];

export function isAllowedEmail(email) {
  const lower = (email || '').toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((domain) => lower.endsWith(`@${domain}`));
}
