"use client";

import { Lock } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messages } from "@/lib/i18n";

import { signIn } from "./actions";

/**
 * Moderator unlock.
 *
 * The token is posted to a Server Action and exchanged for an httpOnly cookie,
 * so it never lives in client state or localStorage where a script could read
 * it back.
 */
export function ModeratorSignIn() {
  const [state, formAction, pending] = useActionState(signIn, { error: null as string | null });

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-24 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <Lock aria-hidden="true" className="text-muted-foreground size-8" />
        <h1 className="font-display text-foreground mt-4 text-2xl">
          {messages.contribute.moderation.signIn}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm text-balance">
          {messages.contribute.moderation.signInHint}
        </p>
      </div>

      <form action={formAction} className="mt-8 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Moderation token</span>
          <Input
            type="password"
            name="token"
            autoComplete="off"
            required
            placeholder="Moderation token"
            aria-invalid={state.error ? true : undefined}
          />
        </label>

        {state.error && (
          <p role="alert" className="text-score-low text-sm">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Checking…" : messages.contribute.moderation.signInCta}
        </Button>
      </form>
    </div>
  );
}
