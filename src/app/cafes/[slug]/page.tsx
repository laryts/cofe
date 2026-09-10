import { ExternalLink, MapPin, Clock, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DemoBadge } from "@/components/cafe/demo-badge";
import { ScoreBadge } from "@/components/cafe/score-badge";
import { ScoreBreakdown } from "@/components/cafe/score-breakdown";
import { WorkProfileGrid } from "@/components/cafe/work-profile-grid";
import { Button } from "@/components/ui/button";
import { formatUrlForDisplay, safeExternalUrl } from "@/domain/cafe";
import { confidenceExplanation, scoreBand, scoreBandLabel } from "@/domain/scoring";
import { formatRelativeDate, isStale } from "@/lib/format";
import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getCafeBySlug } from "@/server/services/cafe-service";

/**
 * Café detail page.
 *
 * Server-rendered and cached: this is the SEO surface for the whole product —
 * "café to work in Vila Mariana" is exactly the query worth winning.
 */
export const revalidate = 300;

export async function generateMetadata(props: PageProps<"/cafes/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const cafe = await getCafeBySlug(slug);

  if (!cafe) return { title: messages.cafe.notFound };

  const place = cafe.neighborhood ? `${cafe.neighborhood}, ${cafe.city}` : cafe.city;
  const score = cafe.profile.workFriendlyScore;

  const description =
    score === null
      ? `${cafe.name} in ${place}. Work conditions not yet rated — add what you know.`
      : `${cafe.name} in ${place} scores ${Math.round(score)}/100 for working. Wi-Fi, power, noise and seating, reported by the community.`;

  return {
    title: `${cafe.name} — ${place}`,
    description,
    alternates: { canonical: `/cafes/${cafe.slug}` },
    openGraph: { title: `${cafe.name} — ${place}`, description, type: "article" },
  };
}

export default async function CafePage(props: PageProps<"/cafes/[slug]">) {
  const { slug } = await props.params;
  const cafe = await getCafeBySlug(slug);

  if (!cafe) notFound();

  const { profile } = cafe;
  const band = scoreBand(profile.workFriendlyScore);
  const stale = isStale(profile.lastReportedAt);
  // Contributor-supplied, so it is validated before it reaches an href.
  const websiteUrl = safeExternalUrl(cafe.website);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/explore"
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center text-sm"
      >
        ← {messages.cafe.backToExplore}
      </Link>

      <header className="mt-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-foreground text-3xl leading-tight text-balance sm:text-4xl">
              {cafe.name}
            </h1>
            <DemoBadge source={cafe.source} />
          </div>

          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {cafe.neighborhood ? `${cafe.neighborhood}, ${cafe.city}` : cafe.city}
          </p>

          {cafe.description && (
            <p className="text-foreground/80 mt-4 text-balance">{cafe.description}</p>
          )}
        </div>

        <ScoreBadge
          score={profile.workFriendlyScore}
          confidence={profile.confidence}
          size="lg"
          className="mt-1"
        />
      </header>

      {/* Verdict line — the "can I work here?" answer, above everything else. */}
      <p
        className={cn(
          "font-display mt-6 text-xl",
          band === "high" && "text-score-high",
          band === "mid" && "text-score-mid",
          band === "low" && "text-score-low",
          band === "unknown" && "text-muted-foreground",
        )}
      >
        {scoreBandLabel(band)}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        {confidenceExplanation(profile.confidence, profile.reportCount)}
      </p>

      {profile.workFriendlyScore === null && (
        <p className="border-border bg-surface-sunken text-muted-foreground mt-4 flex gap-3 rounded-lg border p-4 text-sm">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {messages.cafe.notEnoughDataHint}
        </p>
      )}

      <Section title={messages.cafe.scoreBreakdown} className="mt-10">
        <ScoreBreakdown breakdown={cafe.scoreBreakdown} total={profile.workFriendlyScore} />
        <p className="text-subtle-foreground mt-3 text-xs">
          Points are weights renormalised across the dimensions that have ratings, so they add up to
          the score above.{" "}
          <Link href="/score" className="text-accent underline underline-offset-4">
            How the score works
          </Link>
        </p>
      </Section>

      <Section title={messages.cafe.amenities} className="mt-10">
        <WorkProfileGrid profile={profile} />
      </Section>

      <Section title="Details" className="mt-10">
        <dl className="border-border divide-border divide-y border-t text-sm">
          {cafe.address && <DetailRow label={messages.cafe.address} value={cafe.address} />}

          {cafe.openingHours && (
            <DetailRow
              label={messages.cafe.openingHours}
              value={
                <span className="inline-flex items-start gap-2">
                  <Clock aria-hidden="true" className="text-muted-foreground mt-0.5 size-4" />
                  <code className="font-mono text-xs">{cafe.openingHours}</code>
                </span>
              }
            />
          )}

          {websiteUrl && (
            <DetailRow
              label={messages.cafe.website}
              value={
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent inline-flex items-center gap-1.5 underline underline-offset-4"
                >
                  {formatUrlForDisplay(websiteUrl)}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              }
            />
          )}

          <DetailRow
            label={messages.cafe.lastUpdated}
            value={
              <span className={cn(stale && "text-score-mid")}>
                {formatRelativeDate(profile.lastReportedAt)}
                {stale && " — this may be out of date"}
              </span>
            }
          />

          <DetailRow
            label={messages.cafe.dataSource}
            value={cafe.source === "seed" ? "Demo data (not a real café)" : cafe.source}
          />
        </dl>
      </Section>

      {cafe.notes.length > 0 && (
        <Section title={messages.cafe.notes} className="mt-10">
          <ul className="flex flex-col gap-4">
            {cafe.notes.map((note) => (
              <li key={note.id} className="border-border border-l-2 pl-4">
                <p className="text-foreground/90 text-sm text-pretty">{note.comment}</p>
                <p className="text-subtle-foreground mt-1.5 text-xs">
                  {note.contributorHandle ?? "Anonymous"}
                  {" · "}
                  {formatRelativeDate(note.visitedAt ?? note.createdAt)}
                  {note.source === "seed" && ` · ${messages.demo.badge}`}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="border-border mt-12 border-t pt-8">
        <Button asChild variant="secondary">
          <Link href={`/contribute?cafe=${cafe.slug}`}>{messages.cafe.improveCta}</Link>
        </Button>
      </div>
    </article>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground min-w-0">{value}</dd>
    </div>
  );
}
