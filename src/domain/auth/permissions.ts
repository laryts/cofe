/**
 * Who may do what.
 *
 * ★ Pure, and deliberately so. Identity comes from Clerk, but the permission
 * model is ours: these rules can be read, reasoned about and unit-tested
 * without a network call or an SDK, and swapping auth providers would not take
 * the authorisation model with it.
 *
 * The guiding rule of this product: contributing is open, moderating is not.
 */

export const USER_ROLES = ["user", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** A signed-in person, as far as authorisation is concerned. */
export interface Principal {
  readonly id: string;
  readonly role: UserRole;
}

/** Anonymous visitors are represented by null, never by a fake principal. */
export type MaybePrincipal = Principal | null;

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Contributing never requires an account.
 *
 * This is the property that makes the project collaborative rather than
 * gated, and it is asserted here so that a future change has to delete a
 * documented rule rather than quietly add a guard somewhere.
 */
export function canSubmitContribution(_principal: MaybePrincipal): boolean {
  return true;
}

/** Reviewing other people's submissions requires a moderator or an admin. */
export function canModerate(principal: MaybePrincipal): boolean {
  if (!principal) return false;
  return principal.role === "moderator" || principal.role === "admin";
}

/** Changing someone else's role is an admin-only act. */
export function canManageRoles(principal: MaybePrincipal): boolean {
  return principal?.role === "admin";
}

/**
 * A contribution is attributed only when the contributor was signed in.
 *
 * Anonymous submissions stay anonymous — we never invent an author for them,
 * for the same reason the seed data attributes nothing to anybody.
 */
export function attributionFor(principal: MaybePrincipal): string | null {
  return principal?.id ?? null;
}

/**
 * Roles granted by configuration, for bootstrapping.
 *
 * A fresh deployment has no moderators and no way to appoint one, so the first
 * are named by environment variable. Matching is case-insensitive because email
 * capitalisation is not meaningful and getting locked out of your own
 * deployment over a capital letter would be a silly failure.
 */
export function roleFromModeratorList(
  email: string | null | undefined,
  moderatorEmails: readonly string[],
): UserRole | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const listed = moderatorEmails.some((entry) => entry.trim().toLowerCase() === normalized);
  return listed ? "moderator" : null;
}

/**
 * Resolve the role to store for a user on sync.
 *
 * A role already granted in the database wins over the configured list, so
 * promoting someone to admin is not undone on their next sign-in, and removing
 * an email from the list does not silently demote an existing moderator —
 * demotion should be a deliberate act, not a side effect of editing an env var.
 */
export function resolveRole(existing: UserRole | null, configured: UserRole | null): UserRole {
  if (existing && existing !== "user") return existing;
  return configured ?? existing ?? "user";
}

/** Split a comma-separated environment value into clean entries. */
export function parseModeratorEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
