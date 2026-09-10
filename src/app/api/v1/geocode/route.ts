import { NextResponse, type NextRequest } from "next/server";

import { geocode } from "@/server/services/geocoding-service";

import { apiError } from "../_lib/responses";

/**
 * GET /api/v1/geocode?q=
 *
 * Server-side proxy so the geocoding provider is contacted from exactly one
 * place, with the right User-Agent, a throttle and a cache in front of it. The
 * browser never calls the provider directly. See docs/PLAN.md §9.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return apiError("bad_request", "Provide a search query of at least two characters.");
  }

  try {
    const results = await geocode(query, { signal: request.signal });

    return NextResponse.json(
      { data: results },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    console.error("GET /api/v1/geocode failed", error);
    return apiError("upstream_unavailable", "The geocoding service is unavailable right now.");
  }
}
