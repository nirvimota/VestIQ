/**
 * Derives a human-readable display name and initials from profile or session user metadata.
 * Fallbacks gracefully when optional fields are absent.
 */
export function getFormattedUser(profile, user) {
  // Try profile full_name, user metadata full_name, or fallback to email local-part / Guest
  const name =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split('@')[0] ||
    'Guest Investor';

  // Generate 1-2 letter initials cleanly
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  const role = profile?.role || user?.user_metadata?.role || 'Investor';

  return { name, initials, role };
}
