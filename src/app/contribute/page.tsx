import { FileText, MapPinPlus, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const REPO_URL = "https://github.com/laryts/cofe";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Add a café, correct outdated information, or help build co-fe. Everything is open source and openly licensed.",
  alternates: { canonical: "/contribute" },
};

/**
 * Contribution routes.
 *
 * The MVP has no in-app submission form. That is a deliberate scoping decision,
 * argued in docs/PLAN.md §4: an unauthenticated public write endpoint is a spam
 * magnet, and shipping it safely means auth, rate limiting and a moderation
 * queue — more work than the entire rest of the MVP. Structured issue templates
 * capture the same fields, get human review for free, and leave a public audit
 * trail. In-app submission arrives in V1 alongside accounts.
 */
export default function ContributePage() {
  const routes = [
    {
      icon: MapPinPlus,
      title: "Add a café",
      body: "Know somewhere good? The form asks for the same fields the database stores — location, Wi-Fi, power, noise, seating and how welcome long stays are.",
      href: `${REPO_URL}/issues/new?template=add-cafe.yml`,
      cta: "Open the form",
    },
    {
      icon: PencilLine,
      title: "Correct something",
      body: "Cafés change. Wi-Fi gets better, sockets get taped over, a quiet room becomes a music venue. Outdated data is worse than none.",
      href: `${REPO_URL}/issues/new?template=update-cafe.yml`,
      cta: "Report a change",
    },
    {
      icon: FileText,
      title: "Contribute code",
      body: "It is a small Next.js and Postgres codebase with a documented architecture, and it runs locally in about five minutes.",
      href: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
      cta: "Read the guide",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-foreground text-3xl text-balance sm:text-4xl">
        Help build co-fe
      </h1>
      <p className="text-muted-foreground mt-4 text-lg text-balance">
        co-fe is only as good as the people who fill it in. There is no algorithm that knows whether
        the chairs are comfortable — someone has to have sat in them.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {routes.map((route) => (
          <section key={route.title} className="border-border border-t pt-6">
            <h2 className="text-foreground flex items-center gap-2.5 text-lg font-medium">
              <route.icon aria-hidden="true" className="text-accent size-5 shrink-0" />
              {route.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-pretty">{route.body}</p>
            <Button asChild variant="secondary" size="sm" className="mt-4">
              <a href={route.href} target="_blank" rel="noreferrer noopener">
                {route.cta}
              </a>
            </Button>
          </section>
        ))}
      </div>

      <aside className="border-border bg-surface-sunken mt-12 rounded-lg border p-5 text-sm">
        <h2 className="text-foreground font-medium">Why GitHub, and not a form on this site?</h2>
        <p className="text-muted-foreground mt-2 text-pretty">
          Honestly: because an open, unauthenticated submission form on a site with no accounts is a
          spam magnet, and building the moderation tooling to handle that properly would have
          delayed everything else. Submitting through GitHub means a person reviews each
          contribution and the history stays public. In-app submission is planned once accounts
          exist — see the{" "}
          <Link
            href={`${REPO_URL}/blob/main/docs/PLAN.md`}
            className="text-accent underline underline-offset-4"
          >
            project plan
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
