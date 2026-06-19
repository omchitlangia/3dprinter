/**
 * Human-facing display name for a user.
 *
 * Prefers the stored name (collected on the application form). When that's
 * absent — e.g. legacy rows created before names were captured — it falls back
 * to a readable form of the email's local part:
 *   - "firstname.lastname@…"  → "Firstname Lastname"  (dotted/underscored names)
 *   - "oc233@…"               → "oc233"               (roll-number style, kept as-is)
 *
 * Never returns an empty string.
 */
export function displayName(user: {
  name?: string | null;
  email: string;
}): string {
  const name = user.name?.trim();
  if (name) return name;

  const local = (user.email.split("@")[0] ?? "").trim();
  if (!local) return user.email;

  // A separator strongly suggests a real name (firstname.lastname); title-case
  // it. Otherwise (e.g. a roll number like "oc233") leave it untouched.
  if (/[._]/.test(local)) {
    return local
      .split(/[._]+/)
      .filter(Boolean)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(" ");
  }
  return local;
}
