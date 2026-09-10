import { SignInButton, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { messages } from "@/lib/i18n";

interface AuthControlsProps {
  /** False when this deployment has no Clerk configured at all. */
  enabled: boolean;
  signedIn: boolean;
}

/**
 * Sign in / account control.
 *
 * Presentational: the session is resolved in `app/` and handed down, per the
 * dependency rule in docs/ARCHITECTURE.md. Clerk's `<SignedIn>` and
 * `<SignedOut>` wrappers were removed in Core 3 — they exist only as stubs that
 * throw — so the branch is decided on the server anyway, which also avoids any
 * client-side flicker between the two states.
 *
 * ★ Note what is *not* here: nothing in the app is hidden behind a session.
 * Browsing and contributing both work signed out, on purpose — an account buys
 * attribution for what you add, not permission to add it. That is what makes
 * co-fe collaborative rather than gated, and it is the easiest property to lose
 * by reflex once an auth provider is wired in.
 */
export function AuthControls({ enabled, signedIn }: AuthControlsProps) {
  if (!enabled) return null;

  if (signedIn) {
    return (
      <span className="flex min-h-11 items-center pl-1">
        <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      </span>
    );
  }

  return (
    <SignInButton mode="modal">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground min-h-11"
      >
        {messages.nav.signIn}
      </Button>
    </SignInButton>
  );
}
