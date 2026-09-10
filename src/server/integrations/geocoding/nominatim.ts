import "server-only";

import { getServerEnv } from "@/lib/env";

import type { GeocodeResult, GeocodingProvider } from "./types";

/**
 * Nominatim (OpenStreetMap) geocoding.
 *
 * ★ Called from the server only, and only through this module. That single
 * choke point is what makes the usage policy enforceable: one descriptive
 * User-Agent, one cache, one throttle, one place to swap providers.
 *
 * ⚠️ Nominatim's usage policy (rate limits, User-Agent requirements, rules on
 * bulk geocoding) could not be verified from the environment this was written
 * in — see docs/PLAN.md §9. Confirm the current terms at
 * https://operations.osmfoundation.org/policies/nominatim/ before running this
 * against public traffic, and self-host if volume is non-trivial.
 */

const RESULT_LIMIT = 5;
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Minimum gap between upstream requests, enforced process-wide.
 *
 * Conservative on purpose. This is a single-process guard, not a distributed
 * rate limiter — a multi-instance deployment needs a shared limiter or a
 * self-hosted instance.
 */
const MIN_REQUEST_INTERVAL_MS = 1100;

/** Cache TTL. Place names essentially never move, so this can be generous. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  readonly results: GeocodeResult[];
  readonly expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
let lastRequestAt = 0;

interface NominatimResponse {
  display_name?: unknown;
  name?: unknown;
  lat?: unknown;
  lon?: unknown;
  type?: unknown;
}

export const nominatimProvider: GeocodingProvider = {
  async search(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) return [];

    const cached = cache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }

    await throttle();

    const env = getServerEnv();
    const url = new URL("/search", env.GEOCODING_BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(RESULT_LIMIT));
    url.searchParams.set("addressdetails", "0");

    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

    const response = await fetch(url, {
      headers: {
        // Required by the usage policy so our traffic is attributable.
        "User-Agent": env.GEOCODING_USER_AGENT,
        Accept: "application/json",
      },
      signal: combined,
    });

    if (!response.ok) {
      throw new GeocodingError(`Geocoding provider responded with ${response.status}`);
    }

    const payload: unknown = await response.json();
    const results = Array.isArray(payload) ? payload.map(toResult).filter(isResult) : [];

    remember(normalized, results);
    return results;
  },
};

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingError";
  }
}

function toResult(raw: unknown): GeocodeResult | null {
  if (typeof raw !== "object" || raw === null) return null;

  const item = raw as NominatimResponse;
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const displayName =
    typeof item.display_name === "string"
      ? item.display_name
      : typeof item.name === "string"
        ? item.name
        : null;

  if (!displayName) return null;

  return {
    name: displayName,
    latitude,
    longitude,
    type: typeof item.type === "string" ? item.type : null,
  };
}

function isResult(value: GeocodeResult | null): value is GeocodeResult {
  return value !== null;
}

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  const wait = MIN_REQUEST_INTERVAL_MS - elapsed;

  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  lastRequestAt = Date.now();
}

function remember(key: string, results: GeocodeResult[]): void {
  // Crude FIFO eviction. Sufficient for a bounded in-process cache; a real
  // deployment should put a shared cache in front of this.
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }

  cache.set(key, { results, expiresAt: Date.now() + CACHE_TTL_MS });
}
