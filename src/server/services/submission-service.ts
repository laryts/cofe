import "server-only";

import { and, eq } from "drizzle-orm";

import {
  hasSubstance,
  type NewCafeSubmission,
  type NewReportSubmission,
} from "@/domain/cafe/submission";
import { safeExternalUrl } from "@/domain/cafe/urls";
import { db } from "@/server/db";
import { recomputeWorkProfile } from "@/server/db/profile-aggregation";
import { cafeReports, cafes } from "@/server/db/schema";

/**
 * Public contributions.
 *
 * Everything here lands as `pending`. Nothing a submitter sends reaches a
 * visitor or moves a score until a moderator approves it, which is what makes
 * an open, account-free form safe to expose.
 */

export type SubmissionOutcome =
  { ok: true; id: string } | { ok: false; reason: "empty" | "duplicate" | "unknown_cafe" };

export async function submitCafe(
  input: NewCafeSubmission,
  fingerprint: string,
  /** Local user id when the contributor was signed in; null when anonymous. */
  submittedBy: string | null = null,
): Promise<SubmissionOutcome> {
  if (!hasSubstance({ ratings: input.ratings, comment: input.comment })) {
    return { ok: false, reason: "empty" };
  }

  const slug = await uniqueSlug(buildSlug(input.name, input.neighborhood || input.city));

  const [inserted] = await db
    .insert(cafes)
    .values({
      slug,
      name: input.name,
      description: input.description || null,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      neighborhood: input.neighborhood || null,
      city: input.city,
      countryCode: input.countryCode,
      // Validated at the boundary rather than trusted, so a hostile value never
      // reaches storage in the first place.
      website: safeExternalUrl(input.website),
      openingHours: input.openingHours || null,
      source: "community",
      status: "pending",
      submitterFingerprint: fingerprint,
      submittedBy,
    })
    .returning({ id: cafes.id });

  if (!inserted) return { ok: false, reason: "unknown_cafe" };

  await insertReport(inserted.id, input, submittedBy);

  // No recompute: a pending café has no published reports, so its profile is
  // created when it is approved.
  return { ok: true, id: inserted.id };
}

/** Addressed by slug, the public identifier a client already has. */
export async function submitReport(
  slug: string,
  input: NewReportSubmission,
  submittedBy: string | null = null,
): Promise<SubmissionOutcome> {
  if (!hasSubstance({ ratings: input.ratings, comment: input.comment })) {
    return { ok: false, reason: "empty" };
  }

  const [cafe] = await db
    .select({ id: cafes.id })
    .from(cafes)
    .where(and(eq(cafes.slug, slug), eq(cafes.status, "published")))
    .limit(1);

  if (!cafe) return { ok: false, reason: "unknown_cafe" };

  const id = await insertReport(cafe.id, input, submittedBy);
  return { ok: true, id };
}

async function insertReport(
  cafeId: string,
  input: NewCafeSubmission | NewReportSubmission,
  userId: string | null,
): Promise<string> {
  const [report] = await db
    .insert(cafeReports)
    .values({
      cafeId,
      wifiRating: input.ratings.wifi,
      outletsRating: input.ratings.outlets,
      seatingRating: input.ratings.seating,
      longStayRating: input.ratings.longStay,
      noiseRating: input.ratings.noise,
      allowsCalls: input.amenities.allowsCalls,
      hasAirConditioning: input.amenities.hasAirConditioning,
      hasRestroom: input.amenities.hasRestroom,
      comment: input.comment,
      contributorHandle: input.contributorHandle,
      source: "community",
      status: "pending",
      userId,
      visitedAt: parseVisitedAt(input.visitedAt),
    })
    .returning({ id: cafeReports.id });

  if (!report) throw new Error("Failed to store report");
  return report.id;
}

/**
 * "When were you last there?" is a free-text field on purpose — "last week" is
 * easier to answer honestly than a date picker. Anything unparseable is stored
 * as unknown rather than guessed at.
 */
function parseVisitedAt(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed > new Date()) return null;
  return parsed;
}

function buildSlug(name: string, place: string): string {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return [normalize(name), normalize(place)].filter(Boolean).join("-").slice(0, 90) || "cafe";
}

/** Slugs are a public identifier and unique, so collisions get a numeric suffix. */
async function uniqueSlug(base: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const [existing] = await db
      .select({ id: cafes.id })
      .from(cafes)
      .where(eq(cafes.slug, candidate))
      .limit(1);

    if (!existing) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

/* ── moderation ────────────────────────────────────────────────────────── */

export interface PendingCafe {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  website: string | null;
  createdAt: Date;
  /* The submission's own observations. A moderator cannot judge whether a new
     café is plausible from an address alone — they need to see what was
     actually claimed about it. */
  ratings: Record<string, number | null>;
  comment: string | null;
  contributorHandle: string | null;
}

export async function listPendingCafes(): Promise<PendingCafe[]> {
  const rows = await db
    .select({
      id: cafes.id,
      slug: cafes.slug,
      name: cafes.name,
      city: cafes.city,
      neighborhood: cafes.neighborhood,
      address: cafes.address,
      latitude: cafes.latitude,
      longitude: cafes.longitude,
      website: cafes.website,
      createdAt: cafes.createdAt,
    })
    .from(cafes)
    .where(eq(cafes.status, "pending"))
    .orderBy(cafes.createdAt);

  return Promise.all(
    rows.map(async (row) => {
      const [report] = await db
        .select({
          comment: cafeReports.comment,
          contributorHandle: cafeReports.contributorHandle,
          wifi: cafeReports.wifiRating,
          outlets: cafeReports.outletsRating,
          seating: cafeReports.seatingRating,
          longStay: cafeReports.longStayRating,
          noise: cafeReports.noiseRating,
        })
        .from(cafeReports)
        .where(eq(cafeReports.cafeId, row.id))
        .limit(1);

      return {
        ...row,
        comment: report?.comment ?? null,
        contributorHandle: report?.contributorHandle ?? null,
        ratings: {
          wifi: report?.wifi ?? null,
          outlets: report?.outlets ?? null,
          seating: report?.seating ?? null,
          longStay: report?.longStay ?? null,
          noise: report?.noise ?? null,
        },
      };
    }),
  );
}

export interface PendingReport {
  id: string;
  cafeId: string;
  cafeName: string;
  cafeSlug: string;
  comment: string | null;
  contributorHandle: string | null;
  createdAt: Date;
  ratings: Record<string, number | null>;
}

export async function listPendingReports(): Promise<PendingReport[]> {
  const rows = await db
    .select({
      id: cafeReports.id,
      cafeId: cafeReports.cafeId,
      cafeName: cafes.name,
      cafeSlug: cafes.slug,
      cafeStatus: cafes.status,
      comment: cafeReports.comment,
      contributorHandle: cafeReports.contributorHandle,
      createdAt: cafeReports.createdAt,
      wifi: cafeReports.wifiRating,
      outlets: cafeReports.outletsRating,
      seating: cafeReports.seatingRating,
      longStay: cafeReports.longStayRating,
      noise: cafeReports.noiseRating,
    })
    .from(cafeReports)
    .innerJoin(cafes, eq(cafes.id, cafeReports.cafeId))
    .where(and(eq(cafeReports.status, "pending"), eq(cafes.status, "published")))
    .orderBy(cafeReports.createdAt);

  return rows.map((row) => ({
    id: row.id,
    cafeId: row.cafeId,
    cafeName: row.cafeName,
    cafeSlug: row.cafeSlug,
    comment: row.comment,
    contributorHandle: row.contributorHandle,
    createdAt: row.createdAt,
    ratings: {
      wifi: row.wifi,
      outlets: row.outlets,
      seating: row.seating,
      longStay: row.longStay,
      noise: row.noise,
    },
  }));
}

export async function approveCafe(cafeId: string, moderatorId: string): Promise<void> {
  await db
    .update(cafes)
    .set({
      status: "published",
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      updatedAt: new Date(),
    })
    .where(eq(cafes.id, cafeId));

  // Approving a café approves the report it arrived with — they are one
  // submission, and splitting them would publish a café with no score.
  await db
    .update(cafeReports)
    .set({ status: "published", moderatedAt: new Date(), moderatedBy: moderatorId })
    .where(and(eq(cafeReports.cafeId, cafeId), eq(cafeReports.status, "pending")));

  await recomputeWorkProfile(db, cafeId);
}

export async function rejectCafe(
  cafeId: string,
  moderatorId: string,
  note?: string,
): Promise<void> {
  // Hidden, not deleted: a decision should leave a record, and a repeat abuser
  // should be visible rather than silently resubmitting into a clean slate.
  await db
    .update(cafes)
    .set({
      status: "hidden",
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      moderationNote: note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(cafes.id, cafeId));

  await db
    .update(cafeReports)
    .set({
      status: "rejected",
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      moderationNote: note ?? null,
    })
    .where(and(eq(cafeReports.cafeId, cafeId), eq(cafeReports.status, "pending")));
}

export async function approveReport(reportId: string, moderatorId: string): Promise<void> {
  const [report] = await db
    .update(cafeReports)
    .set({
      status: "published",
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      updatedAt: new Date(),
    })
    .where(eq(cafeReports.id, reportId))
    .returning({ cafeId: cafeReports.cafeId });

  if (report) await recomputeWorkProfile(db, report.cafeId);
}

export async function rejectReport(
  reportId: string,
  moderatorId: string,
  note?: string,
): Promise<void> {
  await db
    .update(cafeReports)
    .set({
      status: "rejected",
      moderatedAt: new Date(),
      moderatedBy: moderatorId,
      moderationNote: note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(cafeReports.id, reportId));
}

export async function countPending(): Promise<{ cafes: number; reports: number }> {
  const [pendingCafes, pendingReports] = await Promise.all([
    listPendingCafes(),
    listPendingReports(),
  ]);
  return { cafes: pendingCafes.length, reports: pendingReports.length };
}
