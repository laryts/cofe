import { NextResponse, type NextRequest } from "next/server";

import { newReportSubmissionSchema } from "@/domain/cafe/submission";
import { checkRateLimit, consumeRateLimit, fingerprint } from "@/server/rate-limit";
import { submitReport } from "@/server/services/submission-service";

import { apiError } from "../../../_lib/responses";

const REPORT_LIMIT = 10;
const REPORT_WINDOW_MS = 60 * 60 * 1000;

/**
 * POST /api/v1/cafes/{slug}/reports — report on an existing café.
 *
 * Addressed by slug, matching GET /api/v1/cafes/{slug}: the slug is the public
 * identifier a client already has, and Next.js requires one dynamic segment
 * name per path level anyway.
 *
 * Like café submission, this is open and moderated rather than gated: a pending
 * report changes nothing a visitor sees, and nothing about the score.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/v1/cafes/[slug]/reports">,
) {
  const client = fingerprint(request);
  const limit = checkRateLimit(`report:${client}`, REPORT_LIMIT, REPORT_WINDOW_MS);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Please slow down a little." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { slug } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("bad_request", "Expected a JSON body.");
  }

  const parsed = newReportSubmissionSchema.safeParse(payload);
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

  if (parsed.data.website_url) {
    return NextResponse.json({ data: { status: "pending" } }, { status: 202 });
  }

  try {
    const result = await submitReport(slug, parsed.data);

    if (!result.ok) {
      return result.reason === "unknown_cafe"
        ? apiError("not_found", "No café with that slug.")
        : apiError("bad_request", "Add at least one rating or a note.");
    }

    consumeRateLimit(`report:${client}`, REPORT_LIMIT, REPORT_WINDOW_MS);

    return NextResponse.json({ data: { id: result.id, status: "pending" } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/cafes/[slug]/reports failed", error);
    return apiError("internal_error", "Could not save that report.");
  }
}
