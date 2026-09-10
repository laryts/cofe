/**
 * Seed the database with demo data.
 *
 * Idempotent: it clears existing seed-sourced cafés and reinserts them, so
 * running it twice is safe. It deliberately touches only `source = 'seed'`
 * rows — real community data is never destroyed by running the seed script.
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { recomputeWorkProfile } from "../profile-aggregation";
import { cafeReports, cafes } from "../schema";
import { SEED_CAFES } from "./data";

config({ path: ".env", quiet: true });

function daysAgoToDate(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema: { cafes, cafeReports } });

  try {
    // Only seed rows. Cascades take the reports and profiles with them.
    const removed = await db
      .delete(cafes)
      .where(eq(cafes.source, "seed"))
      .returning({ id: cafes.id });
    if (removed.length > 0) {
      console.warn(`  cleared ${removed.length} existing demo café(s)`);
    }

    for (const seed of SEED_CAFES) {
      const [inserted] = await db
        .insert(cafes)
        .values({
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
          latitude: seed.latitude,
          longitude: seed.longitude,
          address: seed.address,
          neighborhood: seed.neighborhood,
          city: seed.city,
          countryCode: seed.countryCode,
          openingHours: seed.openingHours,
          website: seed.website,
          source: "seed",
          status: "published",
        })
        .returning({ id: cafes.id });

      if (!inserted) {
        throw new Error(`Failed to insert demo café "${seed.slug}"`);
      }

      await db.insert(cafeReports).values(
        seed.reports.map((report) => ({
          cafeId: inserted.id,
          wifiRating: report.wifi ?? null,
          outletsRating: report.outlets ?? null,
          seatingRating: report.seating ?? null,
          longStayRating: report.longStay ?? null,
          noiseRating: report.noise ?? null,
          allowsCalls: report.allowsCalls ?? null,
          hasAirConditioning: report.hasAirConditioning ?? null,
          hasRestroom: report.hasRestroom ?? null,
          comment: report.comment ?? null,
          // Demo reports have no author. Attributing them to invented people
          // would be fabricating exactly the kind of social proof this project
          // must not fake. See docs/PLAN.md §16.
          contributorHandle: null,
          source: "seed" as const,
          visitedAt: daysAgoToDate(report.daysAgo),
          createdAt: daysAgoToDate(report.daysAgo),
        })),
      );

      await recomputeWorkProfile(db, inserted.id);
    }

    console.warn(`✓ Seeded ${SEED_CAFES.length} demo cafés (source = "seed")`);
    console.warn("  These are invented places for development. They are not real cafés.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("✗ Seed failed:", error);
  process.exitCode = 1;
});
