import { NextResponse, type NextRequest } from "next/server";

import { newCafeSubmissionSchema } from "@/domain/cafe/submission";
import { checkRateLimit, consumeRateLimit, fingerprint } from "@/server/rate-limit";
import { parseCafeSearchParams, searchCafes } from "@/server/services/cafe-service";
import { submitCafe } from "@/server/services/submission-service";

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
          // Present when the query matched nothing here and was resolved to a
          // real place by the geocoder.
          resolvedPlace: result.resolvedPlace,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("GET /api/v1/cafes failed", error);
    return apiError("internal_error", "Could not load cafés.");
  }
}

/** How many cafés one source may submit per hour. */
const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * POST /api/v1/cafes — propose a new café.
 *
 * Open to anyone, no account required. That is safe because the submission
 * lands as `pending`: it is invisible to visitors and contributes nothing to
 * any score until a moderator approves it.
 */
export async function POST(request: NextRequest) {
  const client = fingerprint(request);
  const limit = checkRateLimit(`cafe:${client}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "That is a lot of cafés at once. Please try again a bit later.",
        },
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("bad_request", "Expected a JSON body.");
  }

  const parsed = newCafeSubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "bad_request",
          message: "Some fields need attention.",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 400 },
    );
  }

  // Honeypot: a hidden field only a bot fills in. Answer as though it worked,
  // so a bot gets no signal about why it failed.
  if (parsed.data.website_url) {
    return NextResponse.json({ data: { status: "pending" } }, { status: 202 });
  }

  try {
    const result = await submitCafe(parsed.data, client);

    if (!result.ok) {
      return apiError(
        "bad_request",
        result.reason === "empty"
          ? "Add at least one rating or a note, so there is something to review."
          : "Could not accept that submission.",
      );
    }

    // Charged only now that something is actually stored.
    consumeRateLimit(`cafe:${client}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);

    return NextResponse.json({ data: { id: result.id, status: "pending" } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/cafes failed", error);
    return apiError("internal_error", "Could not save that café.");
  }
}
