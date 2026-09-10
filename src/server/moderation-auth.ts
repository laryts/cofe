import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env";

/**
 * Moderator access.
 *
 * ⚠️ **Interim, and deliberately simple.** A shared token, held in an httpOnly
 * cookie, gates the moderation queue. It is appropriate for a project with a
 * handful of maintainers and it ships today; it is *not* a user system.
 *
 * What it does not give you: per-moderator identity, an audit trail of who
 * approved what, revoking one person's access without rotating the token, or
 * any notion of reputation. Those need real accounts, which is the V1 work
 * described in docs/PLAN.md §15.
 *
 * What it does give you: nothing reaches a visitor without a human deciding,
 * which is the property that makes the open submission form safe.
 *
 * Moderation is unavailable rather than open when no token is configured —
 * failing closed, so a missing environment variable cannot silently expose the
 * queue.
 */

const COOKIE_NAME = "cofe_moderator";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function configuredToken(): string | null {
  const token = getServerEnv().MODERATION_TOKEN;
  return token && token.length > 0 ? token : null;
}

/** Constant-time comparison, so a wrong guess reveals nothing through timing. */
function matches(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The cookie stores an HMAC of the token, not the token itself, so a leaked
 * cookie cannot be replayed anywhere the raw token would be accepted.
 */
function cookieValue(token: string): string {
  return createHmac("sha256", token).update(COOKIE_NAME).digest("hex");
}

export function isModerationConfigured(): boolean {
  try {
    return configuredToken() !== null;
  } catch {
    return false;
  }
}

export async function isModerator(): Promise<boolean> {
  const token = configuredToken();
  if (!token) return false;

  const store = await cookies();
  const present = store.get(COOKIE_NAME)?.value;
  if (!present) return false;

  return matches(present, cookieValue(token));
}

/** Returns false when the supplied token is wrong; sets the cookie when right. */
export async function signInModerator(candidate: string): Promise<boolean> {
  const token = configuredToken();
  if (!token || !matches(candidate, token)) return false;

  const store = await cookies();
  store.set(COOKIE_NAME, cookieValue(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return true;
}

export async function signOutModerator(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
