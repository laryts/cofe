"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { messages } from "@/lib/i18n";

interface AuthControlsProps {
  /** False when this deployment has no Clerk configured at all. */
  enabled: boolean;
}

/**
 * Sign in, sign up, and the account button.
 *
 * Uses Clerk's `<Show>` rather than resolving the session on the server. The
 * difference matters: `mode="modal"` signs you in without navigating, so a
 * server-rendered header would keep showing "Sign in" until the next request.
 * `<Show>` reacts to the session directly. (`<SignedIn>` and `<SignedOut>` were
 * removed in Core 3; `<Show when="...">` replaces both.)
 *
 * ★ Note what is *not* here: nothing in the app is hidden behind a session.
 * Browsing and contributing both work signed out, on purpose — an account buys
 * attribution for what you add, not permission to add it. That is what makes
 * co-fe collaborative rather than gated, and it is the easiest property to lose
 * by reflex once an auth provider is wired in.
 */
export function AuthControls({ enabled }: AuthControlsProps) {
  // Nothing to render, rather than a sign-in button that cannot work.
  if (!enabled) return null;

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground min-h-11"
          >
            {messages.nav.signIn}
          </Button>
        </SignInButton>

        <SignUpButton mode="modal">
          <Button variant="secondary" size="sm" className="min-h-11">
            {messages.nav.signUp}
          </Button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <span className="flex min-h-11 items-center pl-1">
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
        </span>
      </Show>
    </>
  );
}
