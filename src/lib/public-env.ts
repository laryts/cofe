/**
 * Browser-safe configuration.
 *
 * Next.js inlines `NEXT_PUBLIC_*` at build time, so these must be referenced as
 * full literal property accesses rather than looked up dynamically.
 */

/**
 * MapLibre style descriptor. Defaults to a key-free demo style so that a fresh
 * clone renders a working map with no signup — see docs/PLAN.md §9. Production
 * deployments should point this at a properly licensed tile source.
 */
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json";

/** Canonical origin, used for absolute URLs in metadata. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Attribution shown on every map, regardless of tile provider. */
export const MAP_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>';
