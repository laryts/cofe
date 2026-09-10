import type { CafeFilters } from "./filters";

/**
 * When to consult an external geocoder.
 *
 * This is a product rule, not plumbing, so it lives in the domain where it can
 * be read and tested on its own. It also encodes a mistake worth not repeating:
 * an earlier version fell back whenever a search came back empty, which meant a
 * filtered search reported "we have no data for this place" about places we hold
 * plenty of data for.
 */
export interface GeocodeFallbackContext {
  /** The free-text query, if any. */
  readonly query: string | undefined;
  /** True when the caller already supplied coordinates. */
  readonly hasOrigin: boolean;
  readonly filters: CafeFilters | undefined;
  /** How many cafés the direct search against our own data returned. */
  readonly directResultCount: number;
}

/**
 * All four conditions must hold:
 *
 * - **There is a query.** Nothing to geocode otherwise.
 * - **No coordinates already.** An origin means the caller knows where they are;
 *   resolving a place name would move them somewhere they did not ask for.
 * - **No active filters.** An empty filtered result means the filters excluded
 *   everything, not that we lack data for the place. Reporting the latter would
 *   be false, and it would spend an external call proving it.
 * - **Our own data returned nothing.** The local search is free and covers the
 *   common case; the geocoder is the exception, which keeps external traffic low
 *   enough to sit comfortably inside a shared provider's usage policy.
 */
export function shouldGeocodeFallback(context: GeocodeFallbackContext): boolean {
  if (!context.query) return false;
  if (context.hasOrigin) return false;
  if (context.directResultCount > 0) return false;

  return !hasActiveFilters(context.filters);
}

export function hasActiveFilters(filters: CafeFilters | undefined): boolean {
  return Object.values(filters ?? {}).some(Boolean);
}
