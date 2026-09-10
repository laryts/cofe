import { NextResponse, type NextRequest } from "next/server";

import { getCafeBySlug } from "@/server/services/cafe-service";

import { apiError, toCafeDetailDto } from "../../_lib/responses";

/** GET /api/v1/cafes/{slug} */
export async function GET(_request: NextRequest, context: RouteContext<"/api/v1/cafes/[slug]">) {
  try {
    const { slug } = await context.params;
    const cafe = await getCafeBySlug(slug);

    if (!cafe) {
      return apiError("not_found", "No café with that slug.");
    }

    return NextResponse.json(
      { data: toCafeDetailDto(cafe) },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    console.error("GET /api/v1/cafes/[slug] failed", error);
    return apiError("internal_error", "Could not load that café.");
  }
}
