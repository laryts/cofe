import "server-only";

import { z } from "zod";

import { nominatimProvider } from "@/server/integrations/geocoding/nominatim";
import type { GeocodeResult, GeocodingProvider } from "@/server/integrations/geocoding/types";

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
});

/**
 * Resolve a place name to coordinates.
 *
 * The provider is a parameter with a default rather than a hard module
 * reference, so swapping Nominatim for a self-hosted instance is a one-line
 * change here, and callers can pass a stub without patching the module graph.
 */
export async function geocode(
  query: string,
  options: { signal?: AbortSignal; provider?: GeocodingProvider } = {},
): Promise<GeocodeResult[]> {
  const parsed = geocodeQuerySchema.safeParse({ q: query });
  if (!parsed.success) return [];

  const provider = options.provider ?? nominatimProvider;
  return provider.search(parsed.data.q, options.signal);
}
