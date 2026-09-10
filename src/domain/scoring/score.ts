import {
  CONFIDENCE_THRESHOLDS,
  DIMENSION_WEIGHTS,
  MAX_RATING,
  MIN_RATING,
  MIN_REPORTS_FOR_SCORE,
  SCORE_PRIOR,
  SCORED_DIMENSIONS,
  SHRINKAGE_STRENGTH,
  type ScoredDimension,
} from "./weights";

/** One contributor's ratings. Every dimension is optional: people report what they observed. */
export type DimensionRatings = Partial<Record<ScoredDimension, number | null | undefined>>;

export type Confidence = "none" | "low" | "medium" | "high";

export interface DimensionBreakdown {
  readonly dimension: ScoredDimension;
  /** Shrunk score on a 0-100 scale, or null when nobody has rated this dimension. */
  readonly score: number | null;
  /** Percentage weight this dimension carries. */
  readonly weight: number;
  /** Points this dimension contributed to the total. */
  readonly contribution: number;
  /** How many reports included a rating for this dimension. */
  readonly ratingCount: number;
}

export interface WorkFriendlyScore {
  /** 0-100, or null when there is not enough evidence to publish a number. */
  readonly total: number | null;
  readonly confidence: Confidence;
  readonly reportCount: number;
  readonly breakdown: readonly DimensionBreakdown[];
}

/** Map a 1-5 rating onto 0-100. */
export function normalizeRating(rating: number): number {
  return ((rating - MIN_RATING) / (MAX_RATING - MIN_RATING)) * 100;
}

function isValidRating(value: number | null | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_RATING &&
    value <= MAX_RATING
  );
}

/**
 * Shrunk mean of a set of ratings.
 *
 *            Σ(normalised ratings) + m × PRIOR
 *   score = ───────────────────────────────────
 *                       n + m
 *
 * This is what stops one enthusiastic report producing a confident-looking 98.
 * The score earns its extremity as evidence accumulates.
 */
export function shrunkDimensionScore(ratings: readonly number[]): number | null {
  if (ratings.length === 0) return null;

  const sum = ratings.reduce((total, rating) => total + normalizeRating(rating), 0);
  return (sum + SHRINKAGE_STRENGTH * SCORE_PRIOR) / (ratings.length + SHRINKAGE_STRENGTH);
}

export function confidenceFor(reportCount: number): Confidence {
  if (reportCount >= CONFIDENCE_THRESHOLDS.high) return "high";
  if (reportCount >= CONFIDENCE_THRESHOLDS.medium) return "medium";
  if (reportCount >= CONFIDENCE_THRESHOLDS.low) return "low";
  return "none";
}

/**
 * Compute the Work Friendly Score from raw reports.
 *
 * Weights are renormalised across the dimensions that actually have ratings, so
 * a cafe nobody has rated for noise is not silently penalised for the gap.
 *
 * Confidence is returned alongside the number and never folded into it. Baking
 * uncertainty into the score would make the score unexplainable, which is the
 * one thing this product cannot afford.
 */
export function computeWorkFriendlyScore(reports: readonly DimensionRatings[]): WorkFriendlyScore {
  const collected = new Map<ScoredDimension, number[]>(
    SCORED_DIMENSIONS.map((dimension) => [dimension, []]),
  );

  for (const report of reports) {
    for (const dimension of SCORED_DIMENSIONS) {
      const rating = report[dimension];
      if (isValidRating(rating)) {
        collected.get(dimension)?.push(rating);
      }
    }
  }

  const scores = new Map<ScoredDimension, number | null>();
  let weightWithData = 0;
  let weightedSum = 0;

  for (const dimension of SCORED_DIMENSIONS) {
    const ratings = collected.get(dimension) ?? [];
    const score = shrunkDimensionScore(ratings);
    scores.set(dimension, score);

    if (score !== null) {
      const weight = DIMENSION_WEIGHTS[dimension];
      weightWithData += weight;
      weightedSum += weight * score;
    }
  }

  const reportCount = reports.length;
  const hasEnoughEvidence = reportCount >= MIN_REPORTS_FOR_SCORE && weightWithData > 0;
  const total = hasEnoughEvidence ? roundToOneDecimal(weightedSum / weightWithData) : null;

  const breakdown: DimensionBreakdown[] = SCORED_DIMENSIONS.map((dimension) => {
    const score = scores.get(dimension) ?? null;
    const weight = DIMENSION_WEIGHTS[dimension];

    return {
      dimension,
      score: score === null ? null : roundToOneDecimal(score),
      weight,
      // Contribution uses the renormalised weight, so the parts always sum to
      // the whole. A reader can add the column up and get the headline number.
      contribution:
        score === null || !hasEnoughEvidence
          ? 0
          : roundToOneDecimal((weight / weightWithData) * score),
      ratingCount: (collected.get(dimension) ?? []).length,
    };
  });

  return {
    total,
    confidence: confidenceFor(reportCount),
    reportCount,
    breakdown,
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Coarse band used for colour and wording. Never the only signal — always paired with the numeral. */
export type ScoreBand = "high" | "mid" | "low" | "unknown";

export function scoreBand(total: number | null): ScoreBand {
  if (total === null) return "unknown";
  if (total >= 70) return "high";
  if (total >= 45) return "mid";
  return "low";
}

export function scoreBandLabel(band: ScoreBand): string {
  switch (band) {
    case "high":
      return "Great for working";
    case "mid":
      return "Workable";
    case "low":
      return "Difficult to work in";
    case "unknown":
      return "Not enough data yet";
  }
}

export function confidenceLabel(confidence: Confidence): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
    case "none":
      return "Not enough reports";
  }
}

export function confidenceExplanation(confidence: Confidence, reportCount: number): string {
  const reports = `${reportCount} ${reportCount === 1 ? "report" : "reports"}`;
  switch (confidence) {
    case "high":
      return `Based on ${reports}. Consistent enough to rely on.`;
    case "medium":
      return `Based on ${reports}. A reasonable picture, still worth a sanity check.`;
    case "low":
      return `Based on ${reports}. Treat this as a hint, not a verdict.`;
    case "none":
      return `Only ${reports} so far — too few to publish a score.`;
  }
}
