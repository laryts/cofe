import "server-only";

import { z } from "zod";

import { nominatimProvider } from "@/server/integrations/geocoding/nominatim";
import type { GeocodeResult } from "@/server/integrations/geocoding/types";

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
});

/**
 * Resolve a place name to coordinates.
 *
 * The provider is injected rather than imported at the call site so the search
 * flow can be tested, and so swapping Nominatim for a self-hosted instance is a
 * one-line change here.
 */
export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const parsed = geocodeQuerySchema.safeParse({ q: query });
  if (!parsed.success) return [];

  return nominatimProvider.search(parsed.data.q, signal);
}
