import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Clerk request handling.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`; Clerk's own docs
 * still describe `middleware.ts`, so the export name here follows Next while
 * the handler itself is Clerk's.
 *
 * ★ Clerk is engaged only when it is actually configured. `clerkMiddleware()`
 * throws "Missing publishableKey" on *every* request when it is not, which
 * would take the whole site down — browsing, contributing, the API — over an
 * optional feature. A fresh clone with no Clerk account has to work.
 *
 * The key is read from `process.env` directly rather than through lib/env,
 * because this file runs before the app's server modules and must stay free of
 * their imports.
 *
 * Deliberately no route protection lives here. Every privileged surface checks
 * authorisation where the work happens — the moderation page and each Server
 * Action call `canModerate` themselves — because a matcher is easy to get
 * subtly wrong, and a route that slipped through it would be left unguarded.
 * This attaches the session; it is not the gate.
 */
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const passThrough = () => NextResponse.next();

const handler: (request: NextRequest, event: never) => unknown = isClerkConfigured
  ? (clerkMiddleware() as unknown as (request: NextRequest, event: never) => unknown)
  : passThrough;

export default handler;

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
