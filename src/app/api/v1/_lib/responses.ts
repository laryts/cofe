import { NextResponse } from "next/server";

import type { CafeDetail, CafeSummary } from "@/domain/cafe";

/**
 * API response envelope and DTOs.
 *
 * Every endpoint returns an explicit DTO rather than a raw database row. That
 * costs a mapping function and buys two things: a schema change cannot silently
 * alter the public API, and a column added to a table cannot silently leak.
 */

export type ApiErrorCode = "bad_request" | "not_found" | "upstream_unavailable" | "internal_error";

export interface ApiError {
  readonly error: { readonly code: ApiErrorCode; readonly message: string };
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  not_found: 404,
  upstream_unavailable: 502,
  internal_error: 500,
};

export function apiError(code: ApiErrorCode, message: string): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message } }, { status: STATUS_BY_CODE[code] });
}

export interface CafeSummaryDto {
  id: string;
  slug: string;
  name: string;
  neighborhood: string | null;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  source: string;
  distanceKm: number | null;
  workFriendlyScore: number | null;
  confidence: string;
  reportCount: number;
  allowsCalls: boolean | null;
  hasAirConditioning: boolean | null;
  hasRestroom: boolean | null;
  lastReportedAt: string | null;
}

export function toCafeSummaryDto(cafe: CafeSummary): CafeSummaryDto {
  return {
    id: cafe.id,
    slug: cafe.slug,
    name: cafe.name,
    neighborhood: cafe.neighborhood,
    city: cafe.city,
    countryCode: cafe.countryCode,
    latitude: cafe.coordinates.latitude,
    longitude: cafe.coordinates.longitude,
    source: cafe.source,
    distanceKm: cafe.distanceKm === null ? null : Number(cafe.distanceKm.toFixed(3)),
    workFriendlyScore: cafe.profile.workFriendlyScore,
    confidence: cafe.profile.confidence,
    reportCount: cafe.profile.reportCount,
    allowsCalls: cafe.profile.allowsCalls,
    hasAirConditioning: cafe.profile.hasAirConditioning,
    hasRestroom: cafe.profile.hasRestroom,
    lastReportedAt: cafe.profile.lastReportedAt?.toISOString() ?? null,
  };
}

export interface CafeDetailDto extends CafeSummaryDto {
  description: string | null;
  address: string | null;
  website: string | null;
  openingHours: string | null;
  scoreBreakdown: {
    dimension: string;
    score: number | null;
    weight: number;
    contribution: number;
    ratingCount: number;
  }[];
  notes: {
    id: string;
    comment: string;
    contributorHandle: string | null;
    source: string;
    visitedAt: string | null;
    createdAt: string;
  }[];
  updatedAt: string;
}

export function toCafeDetailDto(cafe: CafeDetail): CafeDetailDto {
  return {
    ...toCafeSummaryDto(cafe),
    description: cafe.description,
    address: cafe.address,
    website: cafe.website,
    openingHours: cafe.openingHours,
    scoreBreakdown: cafe.scoreBreakdown.map((entry) => ({
      dimension: entry.dimension,
      score: entry.score,
      weight: entry.weight,
      contribution: entry.contribution,
      ratingCount: entry.ratingCount,
    })),
    notes: cafe.notes.map((note) => ({
      id: note.id,
      comment: note.comment,
      contributorHandle: note.contributorHandle,
      source: note.source,
      visitedAt: note.visitedAt?.toISOString() ?? null,
      createdAt: note.createdAt.toISOString(),
    })),
    updatedAt: cafe.updatedAt.toISOString(),
  };
}
