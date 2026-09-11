import "server-only";

import { and, asc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";

import type {
  CafeDetail,
  CafeFilters,
  CafeNote,
  CafeSource,
  CafeSummary,
  CafeWorkProfile,
} from "@/domain/cafe";
import { QUALITY_FILTER_THRESHOLD } from "@/domain/cafe";
import { boundingBoxAround, haversineDistanceKm, type Coordinates } from "@/domain/geo";
import type { Confidence, DimensionBreakdown } from "@/domain/scoring";
import { computeWorkFriendlyScore, type DimensionRatings } from "@/domain/scoring";
import { db } from "@/server/db";
import { cafeReports, cafeWorkProfiles, cafes } from "@/server/db/schema";

/**
 * Data access for cafés.
 *
 * ★ This module and domain/geo are the ONLY two places that know how proximity
 * is computed. Everything above the repository asks for "cafés near a point" and
 * is indifferent to whether that is answered by a bounding box, earthdistance or
 * PostGIS. Swapping strategies is a migration plus this file — see docs/PLAN.md §9.
 */

export interface FindCafesOptions {
  /** Origin for distance. When absent, results are ordered by score instead. */
  readonly near?: Coordinates;
  readonly radiusKm?: number;
  /** Free-text match against name, neighbourhood and city. */
  readonly query?: string;
  readonly filters?: CafeFilters;
  readonly minScore?: number;
  readonly limit?: number;
  readonly offset?: number;
}

export interface FindCafesResult {
  readonly cafes: readonly CafeSummary[];
  readonly total: number;
}

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 100;
const DEFAULT_RADIUS_KM = 5;

export async function findCafes(options: FindCafesOptions = {}): Promise<FindCafesResult> {
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit ?? DEFAULT_LIMIT));
  const offset = Math.max(0, options.offset ?? 0);
  const radiusKm = options.radiusKm ?? DEFAULT_RADIUS_KM;

  const conditions: SQL[] = [eq(cafes.status, "published")];

  /*
   * Bounding-box prefilter.
   *
   * The box is indexable — Postgres narrows using cafes_lat_lng_idx — and
   * over-selects slightly at the corners. The exact haversine filter below
   * removes the excess. This is the whole "geospatial layer" for the MVP.
   */
  if (options.near) {
    const box = boundingBoxAround(options.near, radiusKm);
    conditions.push(
      gte(cafes.latitude, box.minLatitude),
      lte(cafes.latitude, box.maxLatitude),
      gte(cafes.longitude, box.minLongitude),
      lte(cafes.longitude, box.maxLongitude),
    );
  }

  if (options.query) {
    const pattern = `%${escapeLike(options.query)}%`;
    const textMatch = or(
      ilike(cafes.name, pattern),
      ilike(cafes.neighborhood, pattern),
      ilike(cafes.city, pattern),
    );
    if (textMatch) conditions.push(textMatch);
  }

  conditions.push(...filterConditions(options.filters ?? {}));

  if (options.minScore !== undefined && options.minScore > 0) {
    conditions.push(gte(cafeWorkProfiles.workFriendlyScore, options.minScore));
  }

  const rows = await db
    .select({
      id: cafes.id,
      slug: cafes.slug,
      name: cafes.name,
      neighborhood: cafes.neighborhood,
      city: cafes.city,
      countryCode: cafes.countryCode,
      latitude: cafes.latitude,
      longitude: cafes.longitude,
      source: cafes.source,
      workFriendlyScore: cafeWorkProfiles.workFriendlyScore,
      confidence: cafeWorkProfiles.confidence,
      reportCount: cafeWorkProfiles.reportCount,
      allowsCalls: cafeWorkProfiles.allowsCalls,
      hasAirConditioning: cafeWorkProfiles.hasAirConditioning,
      hasRestroom: cafeWorkProfiles.hasRestroom,
      lastReportedAt: cafeWorkProfiles.lastReportedAt,
    })
    .from(cafes)
    // Left join: a café with no reports yet is still a café, and still belongs
    // on the map. It simply has no score.
    .leftJoin(cafeWorkProfiles, eq(cafeWorkProfiles.cafeId, cafes.id))
    .where(and(...conditions))
    .orderBy(sql`${cafeWorkProfiles.workFriendlyScore} desc nulls last`, asc(cafes.name));

  const summaries = rows.map((row) => toSummary(row, options.near));

  // Exact distance filter, applied after the indexable box narrowed the set.
  const withinRadius = options.near
    ? summaries.filter((cafe) => cafe.distanceKm !== null && cafe.distanceKm <= radiusKm)
    : summaries;

  const ordered = options.near
    ? [...withinRadius].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    : withinRadius;

  return {
    cafes: ordered.slice(offset, offset + limit),
    total: ordered.length,
  };
}

export async function findCafeBySlug(slug: string): Promise<CafeDetail | null> {
  const [row] = await db
    .select()
    .from(cafes)
    .leftJoin(cafeWorkProfiles, eq(cafeWorkProfiles.cafeId, cafes.id))
    .where(and(eq(cafes.slug, slug), eq(cafes.status, "published")))
    .limit(1);

  if (!row) return null;

  const cafe = row.cafes;
  const profile = row.cafe_work_profiles;

  const reports = await db
    .select()
    .from(cafeReports)
    .where(
      and(
        eq(cafeReports.cafeId, cafe.id),
        eq(cafeReports.status, "published"),
        sql`${cafeReports.retractedAt} is null`,
      ),
    )
    .orderBy(sql`coalesce(${cafeReports.visitedAt}, ${cafeReports.createdAt}) desc`);

  /*
   * The per-dimension breakdown is recomputed from the report log rather than
   * read from the profile cache. The cache stores the headline number for fast
   * list queries; the detail page needs weights and contributions too, and
   * recomputing keeps a single source of truth for that arithmetic.
   */
  const ratings: DimensionRatings[] = reports.map((report) => ({
    wifi: report.wifiRating,
    outlets: report.outletsRating,
    seating: report.seatingRating,
    longStay: report.longStayRating,
    noise: report.noiseRating,
  }));

  const score = computeWorkFriendlyScore(ratings);

  const notes: CafeNote[] = reports
    .filter((report) => report.comment !== null && report.comment.trim().length > 0)
    .map((report) => ({
      id: report.id,
      comment: report.comment ?? "",
      contributorHandle: report.contributorHandle,
      source: report.source,
      visitedAt: report.visitedAt,
      createdAt: report.createdAt,
    }));

  return {
    id: cafe.id,
    slug: cafe.slug,
    name: cafe.name,
    description: cafe.description,
    neighborhood: cafe.neighborhood,
    city: cafe.city,
    countryCode: cafe.countryCode,
    address: cafe.address,
    website: cafe.website,
    openingHours: cafe.openingHours,
    coordinates: { latitude: cafe.latitude, longitude: cafe.longitude },
    source: cafe.source,
    distanceKm: null,
    profile: buildProfile(profile, score.total, score.confidence, score.reportCount),
    scoreBreakdown: score.breakdown as readonly DimensionBreakdown[],
    notes,
    updatedAt: cafe.updatedAt,
  };
}

/** Slugs for the sitemap and static generation. */
export async function findAllPublishedSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return db
    .select({ slug: cafes.slug, updatedAt: cafes.updatedAt })
    .from(cafes)
    .where(eq(cafes.status, "published"));
}

/** Distinct cities present in the dataset, for empty-state guidance. */
export async function findCities(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ city: cafes.city })
    .from(cafes)
    .where(eq(cafes.status, "published"))
    .orderBy(asc(cafes.city));

  return rows.map((row) => row.city);
}

/* ── internals ─────────────────────────────────────────────────────────── */

/**
 * Translate filters into SQL.
 *
 * Amenity filters require an explicit `true`: a null (nobody has said) must
 * never satisfy "has a restroom". Quality filters require the dimension score to
 * clear a threshold set above the neutral prior, so an unrated café cannot pass
 * by default either. Both rules exist so a filtered list never over-promises.
 */
function filterConditions(filters: CafeFilters): SQL[] {
  const conditions: SQL[] = [];

  if (filters.wifi) conditions.push(gte(cafeWorkProfiles.wifiScore, QUALITY_FILTER_THRESHOLD));
  if (filters.outlets)
    conditions.push(gte(cafeWorkProfiles.outletsScore, QUALITY_FILTER_THRESHOLD));
  if (filters.quiet) conditions.push(gte(cafeWorkProfiles.noiseScore, QUALITY_FILTER_THRESHOLD));
  if (filters.laptopTables) {
    conditions.push(gte(cafeWorkProfiles.seatingScore, QUALITY_FILTER_THRESHOLD));
  }
  if (filters.longStay) {
    conditions.push(gte(cafeWorkProfiles.longStayScore, QUALITY_FILTER_THRESHOLD));
  }

  if (filters.calls) conditions.push(eq(cafeWorkProfiles.allowsCalls, true));
  if (filters.airConditioning) conditions.push(eq(cafeWorkProfiles.hasAirConditioning, true));
  if (filters.restroom) conditions.push(eq(cafeWorkProfiles.hasRestroom, true));

  return conditions;
}

interface SummaryRow {
  id: string;
  slug: string;
  name: string;
  neighborhood: string | null;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  source: CafeSource;
  workFriendlyScore: number | null;
  confidence: Confidence | null;
  reportCount: number | null;
  allowsCalls: boolean | null;
  hasAirConditioning: boolean | null;
  hasRestroom: boolean | null;
  lastReportedAt: Date | null;
}

function toSummary(row: SummaryRow, origin: Coordinates | undefined): CafeSummary {
  const coordinates = { latitude: row.latitude, longitude: row.longitude };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    neighborhood: row.neighborhood,
    city: row.city,
    countryCode: row.countryCode,
    coordinates,
    source: row.source,
    distanceKm: origin ? haversineDistanceKm(origin, coordinates) : null,
    profile: {
      workFriendlyScore: row.workFriendlyScore,
      confidence: row.confidence ?? "none",
      reportCount: row.reportCount ?? 0,
      allowsCalls: row.allowsCalls,
      hasAirConditioning: row.hasAirConditioning,
      hasRestroom: row.hasRestroom,
      lastReportedAt: row.lastReportedAt,
    },
  };
}

function buildProfile(
  profile: {
    allowsCalls: boolean | null;
    hasAirConditioning: boolean | null;
    hasRestroom: boolean | null;
    lastReportedAt: Date | null;
  } | null,
  total: number | null,
  confidence: Confidence,
  reportCount: number,
): CafeWorkProfile {
  return {
    workFriendlyScore: total,
    confidence,
    reportCount,
    allowsCalls: profile?.allowsCalls ?? null,
    hasAirConditioning: profile?.hasAirConditioning ?? null,
    hasRestroom: profile?.hasRestroom ?? null,
    lastReportedAt: profile?.lastReportedAt ?? null,
  };
}

/** Escape LIKE wildcards so a user searching for "100%" does not match everything. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
