import { SignInButton, UserButton } from "@clerk/nextjs";
import { Check, Lock, MapPin, ShieldAlert, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIMENSION_LABELS, SCORED_DIMENSIONS } from "@/domain/scoring";
import { formatRelativeDate } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { canModerate } from "@/domain/auth";
import { getPrincipal, isAuthConfigured } from "@/server/auth";
import {
  listPendingCafes,
  listPendingReports,
  type PendingCafe,
  type PendingReport,
} from "@/server/services/submission-service";

import {
  approveCafeAction,
  approveReportAction,
  rejectCafeAction,
  rejectReportAction,
} from "./actions";

export const metadata: Metadata = {
  title: messages.contribute.moderation.title,
  // Never index the moderation queue, and do not follow from it either.
  robots: { index: false, follow: false },
};

// The queue must always reflect the current database, never a cached snapshot.
export const dynamic = "force-dynamic";

/**
 * The moderation queue.
 *
 * Every submission lands here before it is visible anywhere else. Approving a
 * café publishes it together with the report it arrived with, and recomputes
 * its score; rejecting hides it without deleting it, so a decision leaves a
 * record and a repeat abuser stays visible.
 */
export default async function ModeratePage() {
  if (!isAuthConfigured()) return <NotConfigured />;

  const principal = await getPrincipal();
  if (!principal) return <SignInRequired />;
  if (!canModerate(principal)) return <NotAModeratorNotice />;

  const [pendingCafes, pendingReports] = await Promise.all([
    listPendingCafes(),
    listPendingReports(),
  ]);

  const total = pendingCafes.length + pendingReports.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-foreground text-3xl">
            {messages.contribute.moderation.title}
          </h1>
          <p className="text-muted-foreground numeric mt-1 text-sm">
            {total === 0
              ? messages.contribute.moderation.empty
              : `${total} item${total === 1 ? "" : "s"} waiting`}
          </p>
        </div>

        <UserButton />
      </div>

      {pendingCafes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {messages.contribute.moderation.pendingCafes}
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pendingCafes.map((cafe) => (
              <PendingCafeCard key={cafe.id} cafe={cafe} />
            ))}
          </ul>
        </section>
      )}

      {pendingReports.length > 0 && (
        <section className="mt-10">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {messages.contribute.moderation.pendingReports}
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {pendingReports.map((report) => (
              <PendingReportCard key={report.id} report={report} />
            ))}
          </ul>
        </section>
      )}

      {total === 0 && (
        <p className="text-muted-foreground border-border mt-10 rounded-lg border border-dashed px-6 py-16 text-center">
          {messages.contribute.moderation.empty}
        </p>
      )}
    </div>
  );
}

function PendingCafeCard({ cafe }: { cafe: PendingCafe }) {
  return (
    <li className="border-border bg-surface rounded-lg border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-foreground text-lg">{cafe.name}</p>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
            {[cafe.address, cafe.neighborhood, cafe.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <Badge variant="outline">{formatRelativeDate(cafe.createdAt)}</Badge>
      </div>

      <p className="text-subtle-foreground numeric mt-3 text-xs">
        {cafe.latitude.toFixed(5)}, {cafe.longitude.toFixed(5)}
        {" · "}
        <a
          href={`https://www.openstreetmap.org/?mlat=${cafe.latitude}&mlon=${cafe.longitude}#map=18/${cafe.latitude}/${cafe.longitude}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent underline underline-offset-2"
        >
          check on OpenStreetMap
        </a>
      </p>

      {cafe.website && (
        <p className="text-subtle-foreground mt-1 truncate text-xs">{cafe.website}</p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {SCORED_DIMENSIONS.map((dimension) => (
          <div key={dimension} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{DIMENSION_LABELS[dimension]}</dt>
            <dd className="numeric text-foreground">{cafe.ratings[dimension] ?? "—"}</dd>
          </div>
        ))}
      </dl>

      {cafe.comment && (
        <p className="border-border text-foreground/90 mt-3 border-l-2 pl-3 text-sm text-pretty">
          {cafe.comment}
        </p>
      )}

      {cafe.contributorHandle && (
        <p className="text-subtle-foreground mt-2 text-xs">— {cafe.contributorHandle}</p>
      )}

      <div className="border-border mt-4 flex flex-wrap gap-2 border-t pt-4">
        <form action={approveCafeAction}>
          <input type="hidden" name="id" value={cafe.id} />
          <Button type="submit" size="sm">
            <Check aria-hidden="true" />
            {messages.contribute.moderation.approve}
          </Button>
        </form>

        <form action={rejectCafeAction} className="flex flex-1 gap-2">
          <input type="hidden" name="id" value={cafe.id} />
          <Input
            name="note"
            placeholder="Reason (optional)"
            className="h-11 flex-1 text-sm"
            maxLength={200}
          />
          <Button type="submit" variant="secondary" size="sm">
            <X aria-hidden="true" />
            {messages.contribute.moderation.reject}
          </Button>
        </form>
      </div>
    </li>
  );
}

function PendingReportCard({ report }: { report: PendingReport }) {
  return (
    <li className="border-border bg-surface rounded-lg border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href={`/cafes/${report.cafeSlug}`}
          className="text-foreground hover:text-accent font-medium underline-offset-4 hover:underline"
        >
          {report.cafeName}
        </Link>
        <Badge variant="outline">{formatRelativeDate(report.createdAt)}</Badge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {SCORED_DIMENSIONS.map((dimension) => (
          <div key={dimension} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{DIMENSION_LABELS[dimension]}</dt>
            <dd className="numeric text-foreground">{report.ratings[dimension] ?? "—"}</dd>
          </div>
        ))}
      </dl>

      {report.comment && (
        <p className="border-border text-foreground/90 mt-3 border-l-2 pl-3 text-sm text-pretty">
          {report.comment}
        </p>
      )}

      {report.contributorHandle && (
        <p className="text-subtle-foreground mt-2 text-xs">— {report.contributorHandle}</p>
      )}

      <div className="border-border mt-4 flex flex-wrap gap-2 border-t pt-4">
        <form action={approveReportAction}>
          <input type="hidden" name="id" value={report.id} />
          <Button type="submit" size="sm">
            <Check aria-hidden="true" />
            {messages.contribute.moderation.approve}
          </Button>
        </form>

        <form action={rejectReportAction} className="flex flex-1 gap-2">
          <input type="hidden" name="id" value={report.id} />
          <Input
            name="note"
            placeholder="Reason (optional)"
            className="h-11 flex-1 text-sm"
            maxLength={200}
          />
          <Button type="submit" variant="secondary" size="sm">
            <X aria-hidden="true" />
            {messages.contribute.moderation.reject}
          </Button>
        </form>
      </div>
    </li>
  );
}

function NotConfigured() {
  return (
    <Notice
      icon={<Lock aria-hidden="true" className="text-muted-foreground mx-auto size-8" />}
      title="Moderation is not configured"
    >
      Set <code className="font-mono text-sm">CLERK_SECRET_KEY</code> and{" "}
      <code className="font-mono text-sm">MODERATOR_EMAILS</code> to enable the queue. Submissions
      are still being collected in the meantime — they simply cannot be approved yet.
    </Notice>
  );
}

function SignInRequired() {
  return (
    <Notice
      icon={<Lock aria-hidden="true" className="text-muted-foreground mx-auto size-8" />}
      title={messages.contribute.moderation.signIn}
    >
      <span className="mb-6 block">{messages.contribute.moderation.signInHint}</span>
      <SignInButton mode="modal">
        <Button>{messages.contribute.moderation.signInCta}</Button>
      </SignInButton>
    </Notice>
  );
}

/**
 * Signed in, but not a moderator.
 *
 * Says so plainly rather than pretending the page does not exist: an ordinary
 * member landing here has done nothing wrong, and a blank 404 would just be
 * confusing. The queue itself is never rendered, which is what matters.
 */
function NotAModeratorNotice() {
  return (
    <Notice
      icon={<ShieldAlert aria-hidden="true" className="text-score-mid mx-auto size-8" />}
      title="You are signed in, but not a moderator"
    >
      Moderation is limited to reviewers. If you think you should have access, ask a maintainer to
      add you.
    </Notice>
  );
}

function Notice({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-24 text-center sm:px-6">
      {icon}
      <h1 className="font-display text-foreground mt-4 text-2xl text-balance">{title}</h1>
      <p className="text-muted-foreground mt-2 text-balance">{children}</p>
    </div>
  );
}
