import { ArrowRight, MapPinPlus } from "lucide-react";
import Link from "next/link";

import { CafeListItem } from "@/components/cafe/cafe-list-item";
import { ScoreWeights } from "@/components/cafe/score-explainer";
import { HomeSearch } from "@/components/cafe/home-search";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/i18n";
import { getFeaturedCafes } from "@/server/services/cafe-service";

/**
 * Homepage.
 *
 * Static apart from the featured list. The hero is copy and a search field —
 * no illustration, no gradient mesh, no product screenshot. The proposition is
 * a sentence and the sentence does the work.
 */
export default async function HomePage() {
  const featured = await getFeaturedCafes(5);
  const hasDemoData = featured.some((cafe) => cafe.source === "seed");

  return (
    <>
      <section className="px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="font-display text-foreground text-4xl leading-[1.1] tracking-tight text-balance sm:text-5xl">
            {messages.home.heroTitle}
          </h1>

          <p className="text-muted-foreground mt-5 max-w-lg text-lg text-balance">
            {messages.home.heroSubtitle}
          </p>

          <HomeSearch className="mt-9 w-full" />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-4 pb-16 sm:px-6" aria-labelledby="nearby-heading">
          <div className="mx-auto w-full max-w-2xl">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <h2 id="nearby-heading" className="font-display text-foreground text-2xl">
                  {messages.home.nearbyTitle}
                </h2>
                {hasDemoData && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {messages.home.nearbySubtitle}
                  </p>
                )}
              </div>

              <Link
                href="/explore"
                className="text-accent hover:text-accent-hover shrink-0 text-sm font-medium underline-offset-4 hover:underline"
              >
                {messages.home.exploreCta}
              </Link>
            </div>

            <ul className="border-border mt-5 border-t">
              {featured.map((cafe) => (
                <CafeListItem key={cafe.id} cafe={cafe} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <section
        className="border-border bg-surface-sunken border-y px-4 py-16 sm:px-6"
        aria-labelledby="score-heading"
      >
        <div className="mx-auto grid w-full max-w-4xl gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <h2 id="score-heading" className="font-display text-foreground text-2xl text-balance">
              {messages.home.scoreTitle}
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              {messages.home.scoreSubtitle}
            </p>
            <p className="text-muted-foreground mt-3 text-sm">
              Below two reports we show no score at all, rather than a confident-looking number
              built on one person&apos;s opinion.
            </p>

            <Button asChild variant="secondary" size="sm" className="mt-6">
              <Link href="/score">
                {messages.home.scoreLink}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <ScoreWeights />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6" aria-labelledby="contribute-heading">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <h2 id="contribute-heading" className="font-display text-foreground text-2xl">
            {messages.home.contributeTitle}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md text-balance">
            {messages.home.contributeSubtitle}
          </p>

          <Button asChild className="mt-6">
            <Link href="/contribute">
              <MapPinPlus aria-hidden="true" />
              {messages.home.contributeCta}
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
