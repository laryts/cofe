import "server-only";

import { z } from "zod";

import {
  CAFE_FILTER_KEYS,
  clampMinScore,
  shouldGeocodeFallback,
  type CafeFilters,
} from "@/domain/cafe";
import type { CafeDetail, CafeSummary } from "@/domain/cafe";

import { geocode } from "@/server/services/geocoding-service";
import {
  findAllPublishedSlugs,
  findCafeBySlug,
  findCafes,
  findCities,
  type FindCafesResult,
} from "@/server/repositories/cafe-repository";

/**
 * Use cases for café discovery.
 *
 * Everything above this layer — pages, route handlers, and eventually a mobile
 * client — goes through here. Input parsing lives here too, so a query string
 * from a URL and a JSON body from an API client are validated identically.
 */

const booleanFlag = z
  .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("1"), z.literal("0")])
  .transform((value) => value === true || value === "true" || value === "1");

const filtersSchema = z.object(
  Object.fromEntries(CAFE_FILTER_KEYS.map((key) => [key, booleanFlag.optional()])),
) as z.ZodType<CafeFilters>;

export const cafeSearchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(50).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  minScore: z.coerce.number().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  filters: filtersSchema.optional(),
});

export type CafeSearchInput = z.infer<typeof cafeSearchSchema>;

export interface CafeSearchResult extends FindCafesResult {
  /**
   * Set when a text query matched nothing in our data and was resolved to a real
   * place by the geocoder. Lets the UI say "no cafés in Berlin yet" rather than
   * a generic "no results", which is a very different message: one says we have
   * a gap, the other implies the user mistyped.
   */
  readonly resolvedPlace: { name: string; latitude: number; longitude: number } | null;
}

/** How far around a geocoded place to look, in km. */
const GEOCODED_SEARCH_RADIUS_KM = 8;

export async function searchCafes(input: CafeSearchInput): Promise<CafeSearchResult> {
  const hasOrigin = input.lat !== undefined && input.lng !== undefined;

  const baseOptions = {
    radiusKm: input.radius,
    filters: input.filters,
    minScore: input.minScore === undefined ? undefined : clampMinScore(input.minScore),
    limit: input.limit,
    offset: input.offset,
  };

  const direct = await findCafes({
    ...baseOptions,
    near: hasOrigin ? { latitude: input.lat as number, longitude: input.lng as number } : undefined,
    query: input.q,
  });

  /*
   * Text search runs against our own data first — it is fast, free, and covers
   * the common case of a neighbourhood or city we already know.
   *
   * Only when that finds nothing do we fall back to the geocoder, which keeps
   * external calls rare (and so keeps us comfortably inside Nominatim's usage
   * policy — see docs/PLAN.md §9). A user searching a city we have no data for
   * then gets "we found the place, we just have no cafés there" instead of
   * silence.
   */
  const query = input.q;
  const useGeocoder =
    query !== undefined &&
    shouldGeocodeFallback({
      query,
      hasOrigin,
      filters: input.filters,
      directResultCount: direct.total,
    });

  if (!useGeocoder) return { ...direct, resolvedPlace: null };

  const place = await resolvePlace(query);
  if (!place) return { ...direct, resolvedPlace: null };

  const nearby = await findCafes({
    ...baseOptions,
    near: { latitude: place.latitude, longitude: place.longitude },
    radiusKm: input.radius ?? GEOCODED_SEARCH_RADIUS_KM,
  });

  return { ...nearby, resolvedPlace: place };
}

/**
 * Resolve free text to a place.
 *
 * Geocoding is a nice-to-have on top of a search that already works, so an
 * unavailable or slow provider must degrade to "no results" rather than break
 * the page. Failures are logged, not thrown.
 */
async function resolvePlace(
  query: string,
): Promise<{ name: string; latitude: number; longitude: number } | null> {
  try {
    const [match] = await geocode(query);
    if (!match) return null;

    return {
      // Nominatim returns a long comma-separated display name; the leading
      // component is the part a human recognises.
      name: match.name.split(",")[0]?.trim() || match.name,
      latitude: match.latitude,
      longitude: match.longitude,
    };
  } catch (error) {
    console.error("Geocoding fallback failed", error);
    return null;
  }
}

export async function getCafeBySlug(slug: string): Promise<CafeDetail | null> {
  return findCafeBySlug(slug);
}

/** Highest-scoring cafés, for the homepage. */
export async function getFeaturedCafes(limit = 6): Promise<readonly CafeSummary[]> {
  const result = await findCafes({ limit });
  return result.cafes;
}

export async function getCities(): Promise<string[]> {
  return findCities();
}

/** Every published café, for the sitemap. */
export async function getAllCafeSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return findAllPublishedSlugs();
}

/**
 * Parse search parameters coming from a URL.
 *
 * Filters arrive as flat keys (`?wifi=true&calls=true`) because that is what a
 * shareable URL should look like, and are folded into the nested `filters`
 * object the service expects.
 */
export function parseCafeSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): CafeSearchInput {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters: Record<string, string | undefined> = {};
  for (const key of CAFE_FILTER_KEYS) {
    const value = get(key);
    if (value !== undefined) filters[key] = value;
  }

  const parsed = cafeSearchSchema.safeParse({
    lat: get("lat"),
    lng: get("lng"),
    radius: get("radius"),
    q: get("q"),
    minScore: get("minScore"),
    limit: get("limit"),
    offset: get("offset"),
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  });

  // A malformed query string should degrade to "show me everything", not a
  // crash. The URL is user-editable and shared around; it will be malformed.
  return parsed.success ? parsed.data : {};
}
