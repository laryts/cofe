import { and, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { computeWorkFriendlyScore, type DimensionRatings } from "@/domain/scoring";

import { cafeReports, cafeWorkProfiles, type CafeReportRow } from "./schema";

/**
 * Recompute a cafe's derived work profile from its report log.
 *
 * `cafe_work_profiles` is a cache of an aggregate over `cafe_reports`. Every
 * write path that touches reports must call this in the same transaction, which
 * is what guarantees the cache cannot drift from its source.
 *
 * The scoring itself lives in domain/scoring and is pure: this function only
 * loads rows, hands them over, and stores the result.
 *
 * Takes the database as a parameter rather than importing the app singleton, so
 * the seed and migration scripts — which own their own connection — can reuse it
 * without pulling in the Next.js server runtime.
 */
export async function recomputeWorkProfile(
  db: PostgresJsDatabase<Record<string, unknown>>,
  cafeId: string,
): Promise<void> {
  /*
   * Only approved reports count. A pending submission must not move a score —
   * otherwise the moderation queue would be decorative, and anyone could shift
   * a café's rating just by submitting.
   */
  const reports = await db
    .select()
    .from(cafeReports)
    .where(
      and(
        eq(cafeReports.cafeId, cafeId),
        eq(cafeReports.status, "published"),
        isNull(cafeReports.retractedAt),
      ),
    );

  const ratings: DimensionRatings[] = reports.map((report) => ({
    wifi: report.wifiRating,
    outlets: report.outletsRating,
    seating: report.seatingRating,
    longStay: report.longStayRating,
    noise: report.noiseRating,
  }));

  const score = computeWorkFriendlyScore(ratings);
  const byDimension = new Map(score.breakdown.map((entry) => [entry.dimension, entry.score]));

  await db
    .insert(cafeWorkProfiles)
    .values({
      cafeId,
      wifiScore: byDimension.get("wifi") ?? null,
      outletsScore: byDimension.get("outlets") ?? null,
      seatingScore: byDimension.get("seating") ?? null,
      longStayScore: byDimension.get("longStay") ?? null,
      noiseScore: byDimension.get("noise") ?? null,
      workFriendlyScore: score.total,
      confidence: score.confidence,
      reportCount: score.reportCount,
      allowsCalls: majorityVote(reports, "allowsCalls"),
      hasAirConditioning: majorityVote(reports, "hasAirConditioning"),
      hasRestroom: majorityVote(reports, "hasRestroom"),
      lastReportedAt: mostRecentReportDate(reports),
      computedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: cafeWorkProfiles.cafeId,
      set: {
        wifiScore: byDimension.get("wifi") ?? null,
        outletsScore: byDimension.get("outlets") ?? null,
        seatingScore: byDimension.get("seating") ?? null,
        longStayScore: byDimension.get("longStay") ?? null,
        noiseScore: byDimension.get("noise") ?? null,
        workFriendlyScore: score.total,
        confidence: score.confidence,
        reportCount: score.reportCount,
        allowsCalls: majorityVote(reports, "allowsCalls"),
        hasAirConditioning: majorityVote(reports, "hasAirConditioning"),
        hasRestroom: majorityVote(reports, "hasRestroom"),
        lastReportedAt: mostRecentReportDate(reports),
        computedAt: new Date(),
      },
    });
}

type AmenityKey = "allowsCalls" | "hasAirConditioning" | "hasRestroom";

/**
 * Majority vote over an amenity.
 *
 * Returns null when nobody has said either way, and — importantly — also when
 * opinion is exactly split. "Unknown" is an honest answer; picking a side on a
 * tie would be inventing a fact.
 */
function majorityVote(reports: readonly CafeReportRow[], key: AmenityKey): boolean | null {
  let yes = 0;
  let no = 0;

  for (const report of reports) {
    const value = report[key];
    if (value === true) yes += 1;
    else if (value === false) no += 1;
  }

  if (yes === 0 && no === 0) return null;
  if (yes === no) return null;
  return yes > no;
}

/**
 * Freshness anchor: the most recent visit date, falling back to when the report
 * was filed for contributors who did not say when they were there.
 */
function mostRecentReportDate(reports: readonly CafeReportRow[]): Date | null {
  let latest: Date | null = null;

  for (const report of reports) {
    const candidate = report.visitedAt ?? report.createdAt;
    if (latest === null || candidate > latest) latest = candidate;
  }

  return latest;
}
