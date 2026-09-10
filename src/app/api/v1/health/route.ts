import { NextResponse } from "next/server";

import { getCities } from "@/server/services/cafe-service";

/** GET /api/v1/health — liveness plus a real database round-trip. */
export async function GET() {
  try {
    await getCities();
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
