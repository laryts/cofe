import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import {
  parseModeratorEmails,
  resolveRole,
  roleFromModeratorList,
  type MaybePrincipal,
  type UserRole,
} from "@/domain/auth";
import { getServerEnv } from "@/lib/env";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

/**
 * Bridge between Clerk's identity and this application's permission model.
 *
 * ★ The split is the point. Clerk answers "who is this person"; every question
 * of "what may they do" is answered from our own `users` table by the pure
 * rules in domain/auth. That keeps authorisation testable without a network
 * call, and means changing auth provider would not drag the permission model
 * along with it.
 *
 * When Clerk is not configured, everyone is anonymous. Browsing and
 * contributing still work — neither needs an account — and moderation is
 * unavailable rather than open.
 */

function clerkConfigured(): boolean {
  try {
    return Boolean(getServerEnv().CLERK_SECRET_KEY);
  } catch {
    return false;
  }
}

export function isAuthConfigured(): boolean {
  return clerkConfigured();
}

/**
 * Just enough for the layout to render the header, without loading a profile
 * or touching the database on every page view.
 */
export async function getSessionState(): Promise<{ enabled: boolean; signedIn: boolean }> {
  if (!clerkConfigured()) return { enabled: false, signedIn: false };

  try {
    const session = await auth();
    return { enabled: true, signedIn: Boolean(session.userId) };
  } catch {
    // A misconfigured Clerk costs the header its buttons, not the page.
    return { enabled: false, signedIn: false };
  }
}

/**
 * The current visitor, as a principal, or null.
 *
 * Also the sync point: a signed-in person's local row is created or refreshed
 * here on first use. Lazy rather than webhook-driven — no public URL, no
 * signing secret, and no "the webhook never fired" failure mode. A profile
 * change at Clerk lands on the person's next visit, which is plenty here.
 */
export async function getPrincipal(): Promise<MaybePrincipal> {
  if (!clerkConfigured()) return null;

  let clerkUserId: string | null = null;
  try {
    const session = await auth();
    clerkUserId = session.userId ?? null;
  } catch (error) {
    // A misconfigured or unreachable Clerk must not take the whole page down.
    // Treating the visitor as anonymous fails closed for anything privileged.
    console.error("Could not resolve the Clerk session", error);
    return null;
  }

  if (!clerkUserId) return null;

  try {
    return await syncUser(clerkUserId);
  } catch (error) {
    console.error("Could not sync the signed-in user", error);
    return null;
  }
}

async function syncUser(clerkUserId: string): Promise<MaybePrincipal> {
  const [existing] = await db
    .select({ id: users.id, role: users.role, email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  const profile = await loadClerkProfile();
  const email = profile?.email ?? existing?.email ?? null;

  const configuredRole = roleFromModeratorList(
    email,
    parseModeratorEmails(getServerEnv().MODERATOR_EMAILS),
  );
  const role: UserRole = resolveRole(existing?.role ?? null, configuredRole);

  if (existing) {
    // Only write when something actually changed, so an ordinary page view is
    // a read rather than a write.
    const changed =
      existing.role !== role ||
      (profile !== null && (existing.email !== profile.email || profile.displayName !== undefined));

    if (changed) {
      await db
        .update(users)
        .set({
          role,
          email,
          displayName: profile?.displayName ?? undefined,
          avatarUrl: profile?.avatarUrl ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
    }

    return { id: existing.id, role };
  }

  const [created] = await db
    .insert(users)
    .values({
      clerkUserId,
      email,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      role,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email, updatedAt: new Date() },
    })
    .returning({ id: users.id, role: users.role });

  return created ? { id: created.id, role: created.role } : null;
}

interface ClerkProfile {
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Profile details are a nice-to-have: a failure here must not stop someone
 * signing in, so it degrades to nulls rather than throwing.
 */
async function loadClerkProfile(): Promise<ClerkProfile | null> {
  try {
    const user = await currentUser();
    if (!user) return null;

    const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

    return {
      email: email ?? null,
      displayName: name || user.username || null,
      avatarUrl: user.imageUrl || null,
    };
  } catch (error) {
    console.error("Could not load the Clerk profile", error);
    return null;
  }
}
