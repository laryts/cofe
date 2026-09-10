/**
 * Work Friendly Score — dimensions, weights and constants.
 *
 * Every number in this file is a product decision, argued in docs/PLAN.md §8,
 * and surfaced to users at /score. Nothing here is arbitrary and nothing here is
 * hidden: a reader must always be able to reconstruct a score by hand.
 */

export const SCORED_DIMENSIONS = ["wifi", "outlets", "seating", "longStay", "noise"] as const;

export type ScoredDimension = (typeof SCORED_DIMENSIONS)[number];

/**
 * Weights sum to 100.
 *
 * Wi-Fi leads because it is the most common hard blocker. Long stay is weighted
 * equal to power and seating because being welcome to stay is the defining
 * property of a work-friendly cafe — perfect Wi-Fi is worthless if the staff
 * want the table back in 25 minutes. Noise sits lowest: it is the most
 * subjective dimension and the most easily mitigated with headphones.
 *
 * Deliberately absent: "overall experience" (unexplainable — a score you cannot
 * justify to a user defeats the point) and "calls allowed" (a fit attribute, not
 * a quality one; different users want opposite answers, so it filters the set
 * rather than moving the number).
 */
export const DIMENSION_WEIGHTS: Readonly<Record<ScoredDimension, number>> = {
  wifi: 25,
  outlets: 20,
  seating: 20,
  longStay: 20,
  noise: 15,
};

/** Rating scale used by contributors, inclusive. */
export const MIN_RATING = 1;
export const MAX_RATING = 5;

/**
 * Neutral prior, on the normalised 0-100 scale. Thin evidence is pulled towards
 * "unremarkable" rather than towards whatever the first contributor felt.
 */
export const SCORE_PRIOR = 50;

/**
 * Shrinkage strength, in units of "virtual ratings at the prior".
 *
 * m = 3 means a single 5-star report yields 62.5 rather than 100 — visibly
 * positive, not authoritative — while ten consistent reports reach 88.5. Worth
 * retuning once there is real data; it is a constant precisely so that retuning
 * is a one-line change with a test to prove the effect.
 */
export const SHRINKAGE_STRENGTH = 3;

/**
 * Below this many reports we show "not enough data" instead of a number.
 * A confident-looking 72 built on one person's opinion is worse than silence.
 */
export const MIN_REPORTS_FOR_SCORE = 2;

export const CONFIDENCE_THRESHOLDS = {
  low: 2,
  medium: 5,
  high: 15,
} as const;

export const DIMENSION_LABELS: Readonly<Record<ScoredDimension, string>> = {
  wifi: "Wi-Fi",
  outlets: "Power outlets",
  seating: "Seating & tables",
  longStay: "Long stay",
  noise: "Noise",
};

/** What each dimension actually measures, shown next to the breakdown. */
export const DIMENSION_DESCRIPTIONS: Readonly<Record<ScoredDimension, string>> = {
  wifi: "Whether the connection is reliable enough to work on, not just present.",
  outlets: "How easy it is to find a socket you can actually reach from a seat.",
  seating: "Whether tables and chairs suit a laptop for more than twenty minutes.",
  longStay: "Whether staying a few hours is welcomed rather than tolerated.",
  noise: "How easy it is to concentrate at a typical busy moment.",
};

/**
 * Anchored scale descriptions. Bare stars invite wildly inconsistent ratings;
 * written anchors are the cheapest available defence against that.
 */
export const RATING_ANCHORS: Readonly<Record<ScoredDimension, Readonly<Record<number, string>>>> = {
  wifi: {
    1: "No Wi-Fi, or unusable",
    2: "Drops often, or a painful captive portal",
    3: "Works for browsing and email",
    4: "Reliable for calls and large downloads",
    5: "Fast and rock solid all day",
  },
  outlets: {
    1: "None, or actively blocked off",
    2: "One or two, usually taken",
    3: "Some, if you pick your seat",
    4: "Easy to find at most tables",
    5: "At nearly every seat",
  },
  seating: {
    1: "Nowhere to put a laptop",
    2: "Small or wobbly tables, uncomfortable chairs",
    3: "Workable for an hour",
    4: "Comfortable tables at a good height",
    5: "Genuinely desk-like, comfortable for hours",
  },
  longStay: {
    1: "Time limits, or you are asked to leave",
    2: "Clearly discouraged at busy times",
    3: "Fine if you keep ordering",
    4: "Comfortable staying a few hours",
    5: "Explicitly welcomed, people work here all day",
  },
  noise: {
    1: "Too loud to think",
    2: "Often noisy, headphones essential",
    3: "Normal cafe hum",
    4: "Calm most of the time",
    5: "Consistently quiet, library-like",
  },
};
