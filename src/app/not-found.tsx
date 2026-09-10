import Link from "next/link";

import { Button } from "@/components/ui/button";
import { messages } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-display text-accent text-5xl">404</p>
      <h1 className="font-display text-foreground mt-4 text-2xl text-balance">
        {messages.cafe.notFound}
      </h1>
      <p className="text-muted-foreground mt-2 text-balance">{messages.cafe.notFoundHint}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/explore">{messages.home.exploreCta}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
