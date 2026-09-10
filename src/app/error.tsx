"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { messages } from "@/lib/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-foreground text-2xl text-balance">
        {messages.common.error}
      </h1>
      <p className="text-muted-foreground mt-2 text-balance">{messages.common.errorHint}</p>

      {error.digest && (
        <p className="text-subtle-foreground mt-3 font-mono text-xs">Reference: {error.digest}</p>
      )}

      <Button onClick={reset} className="mt-8">
        <RotateCw aria-hidden="true" />
        {messages.common.retry}
      </Button>
    </div>
  );
}
