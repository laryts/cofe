import { NextResponse, type NextRequest } from "next/server";

import { parseCafeSearchParams, searchCafes } from "@/server/services/cafe-service";

import { apiError, toCafeSummaryDto } from "../_lib/responses";

/**
 * GET /api/v1/cafes
 *
 * Versioned from the first commit. The web UI mostly bypasses HTTP by calling
 * the service in-process from Server Components, but this endpoint serves the
 * identical DTO — which is what makes the future mobile client a real plan
 * rather than an aspiration. See docs/PLAN.md §10.
 */
export async function GET(request: NextRequest) {
  try {
    const input = parseCafeSearchParams(request.nextUrl.searchParams);
    const result = await searchCafes(input);

    return NextResponse.json(
      {
        data: result.cafes.map(toCafeSummaryDto),
        meta: {
          total: result.total,
          limit: input.limit ?? result.cafes.length,
          offset: input.offset ?? 0,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("GET /api/v1/cafes failed", error);
    return apiError("internal_error", "Could not load cafés.");
  }
}
