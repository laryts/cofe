import type { Metadata } from "next";
import Link from "next/link";

import { ScoreWeights } from "@/components/cafe/score-explainer";
import {
  CONFIDENCE_THRESHOLDS,
  MIN_REPORTS_FOR_SCORE,
  RATING_ANCHORS,
  SCORED_DIMENSIONS,
  SCORE_PRIOR,
  SHRINKAGE_STRENGTH,
  DIMENSION_LABELS,
} from "@/domain/scoring";
import { messages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: messages.score.title,
  description:
    "How co-fe's Work Friendly Score is calculated: five weighted dimensions, shrinkage toward a neutral prior, and a separate confidence level. No AI, no black boxes.",
  alternates: { canonical: "/score" },
};

/**
 * The method, in public.
 *
 * A score nobody can audit is a score nobody should trust, so the constants on
 * this page are imported from the same module the calculation uses — this
 * documentation cannot drift out of sync with the implementation.
 */
export default function ScorePage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-foreground text-3xl text-balance sm:text-4xl">
        {messages.score.title}
      </h1>
      <p className="text-muted-foreground mt-4 text-lg text-balance">{messages.score.subtitle}</p>

      <Prose>
        <h2>What it measures</h2>
        <p>
          One number from 0 to 100, answering a single question: <em>how well can someone actually
          work here?</em> Not how good the coffee is, not how nice the room looks — those are well
          covered elsewhere.
        </p>

        <p>Five things go into it, each rated 1–5 by people who have been there:</p>
      </Prose>

      <ScoreWeights className="mt-6" />

      <Prose>
        <h2>What is deliberately left out</h2>
        <p>
          <strong>Overall experience</strong> is not a component. A catch-all &ldquo;vibes&rdquo;
          term cannot be justified to anyone who asks why a café scored what it did, and that
          defeats the point of publishing a number at all.
        </p>
        <p>
          <strong>Whether calls are allowed</strong> is not a component either — it is a filter.
          People want opposite things from it: a silent café is perfect for a writer and useless for
          someone with back-to-back meetings. Folding it into one number would mean the same score
          meant &ldquo;good&rdquo; to one reader and &ldquo;bad&rdquo; to another. Air conditioning
          and restrooms are treated the same way: real needs, but not measures of work-friendliness.
        </p>

        <h2>How the arithmetic works</h2>
        <p>
          Each 1–5 rating is mapped onto 0–100. Then, rather than a plain average, each dimension is
          pulled toward a neutral prior of {SCORE_PRIOR}:
        </p>
      </Prose>

      <pre className="border-border bg-surface-sunken text-foreground mt-4 overflow-x-auto rounded-lg border p-4 text-xs">
        <code>{`             sum(ratings) + ${SHRINKAGE_STRENGTH} × ${SCORE_PRIOR}
score  =  ────────────────────────────
                  n + ${SHRINKAGE_STRENGTH}`}</code>
      </pre>

      <Prose>
        <p>
          This is what stops a single enthusiastic report producing a confident-looking 98. One 5★
          rating yields 62.5 — visibly positive, not authoritative. Ten consistent 5★ ratings reach
          88.5. The number earns its extremity as evidence accumulates.
        </p>
        <p>
          The five dimension scores are then combined using the weights above, renormalised across
          whichever dimensions actually have ratings — so a café nobody has rated for noise is not
          quietly penalised for the gap.
        </p>

        <h2>Confidence is shown separately</h2>
        <p>
          Uncertainty is never folded into the score itself, because that would make the score
          impossible to explain. It is reported alongside:
        </p>
        <ul>
          <li>
            <strong>Fewer than {MIN_REPORTS_FOR_SCORE} reports</strong> — no score is published at
            all. A confident-looking number built on one person&apos;s opinion is worse than
            silence.
          </li>
          <li>
            <strong>{CONFIDENCE_THRESHOLDS.low}–{CONFIDENCE_THRESHOLDS.medium - 1} reports</strong> —
            low confidence. A hint, not a verdict.
          </li>
          <li>
            <strong>
              {CONFIDENCE_THRESHOLDS.medium}–{CONFIDENCE_THRESHOLDS.high - 1} reports
            </strong>{" "}
            — medium confidence.
          </li>
          <li>
            <strong>{CONFIDENCE_THRESHOLDS.high}+ reports</strong> — high confidence.
          </li>
        </ul>

        <h2>What the ratings mean</h2>
        <p>
          Bare stars invite wildly inconsistent scoring, so every point on every scale has a written
          anchor:
        </p>
      </Prose>

      <div className="mt-6 flex flex-col gap-6">
        {SCORED_DIMENSIONS.map((dimension) => (
          <section key={dimension}>
            <h3 className="text-foreground text-sm font-semibold">{DIMENSION_LABELS[dimension]}</h3>
            <ol className="border-border divide-border mt-2 divide-y border-t text-sm">
              {[1, 2, 3, 4, 5].map((level) => (
                <li key={level} className="flex gap-3 py-2">
                  <span className="numeric text-subtle-foreground w-6 shrink-0">{level}★</span>
                  <span className="text-muted-foreground">{RATING_ANCHORS[dimension][level]}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <Prose>
        <h2>No AI, and no plans for it</h2>
        <p>
          Nothing on this page involves a model. The whole value of the score is that you can check
          it by hand: open any café page, read the breakdown table, and add up the points column. If
          the number could not be audited, there would be no reason to trust it.
        </p>

        <h2>This will change</h2>
        <p>
          The weights and constants are a first, argued proposal — not settled truth. They are worth
          revisiting once there is enough real data to test them against, and the reasoning is
          written down in the{" "}
          <Link href="https://github.com/laryts/cofe/blob/main/docs/PLAN.md">project plan</Link> so
          that changing them is a discussion rather than a guess.
        </p>
      </Prose>
    </article>
  );
}

/** Local typography wrapper. Avoids a plugin dependency for a handful of pages. */
function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "mt-8 flex flex-col gap-4 text-[0.9375rem] leading-relaxed",
        "[&_h2]:font-display [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:text-xl",
        "[&_p]:text-foreground/85 [&_p]:text-pretty",
        "[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_li]:list-disc [&_li]:text-foreground/85",
        "[&_strong]:text-foreground [&_strong]:font-semibold",
        "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
