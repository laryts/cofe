import type { Coordinates } from "../geo/coordinates";
import type { Confidence, DimensionBreakdown } from "../scoring/score";

/** Where a record came from. Always surfaced in the UI — provenance is not optional. */
export type CafeSource = "seed" | "community" | "osm";

/** Moderation state. Only `published` records are ever served to visitors. */
export type CafeStatus = "published" | "pending" | "hidden";

/**
 * Amenities are fit attributes, not quality signals: they filter the set of
 * cafes without moving the Work Friendly Score. See docs/PLAN.md §7.
 *
 * `null` means genuinely unknown, which is different from `false`. The UI must
 * keep that distinction — claiming "no restroom" when nobody has said either way
 * is exactly the kind of invented fact that erodes trust.
 */
export interface CafeAmenities {
  readonly allowsCalls: boolean | null;
  readonly hasAirConditioning: boolean | null;
  readonly hasRestroom: boolean | null;
}

export interface CafeWorkProfile extends CafeAmenities {
  readonly workFriendlyScore: number | null;
  readonly confidence: Confidence;
  readonly reportCount: number;
  readonly lastReportedAt: Date | null;
}

/** Lean shape powering both the map and the list. */
export interface CafeSummary {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly neighborhood: string | null;
  readonly city: string;
  readonly countryCode: string;
  readonly coordinates: Coordinates;
  readonly source: CafeSource;
  readonly profile: CafeWorkProfile;
  /** Present only when the query had an origin to measure from. */
  readonly distanceKm: number | null;
}

export interface CafeNote {
  readonly id: string;
  readonly comment: string;
  readonly contributorHandle: string | null;
  readonly source: "seed" | "community" | "import";
  readonly visitedAt: Date | null;
  readonly createdAt: Date;
}

export interface CafeDetail extends CafeSummary {
  readonly description: string | null;
  readonly address: string | null;
  readonly website: string | null;
  /** Raw OSM `opening_hours` syntax, e.g. "Mo-Fr 08:00-19:00; Sa 09:00-14:00". */
  readonly openingHours: string | null;
  readonly scoreBreakdown: readonly DimensionBreakdown[];
  readonly notes: readonly CafeNote[];
  readonly updatedAt: Date;
}
