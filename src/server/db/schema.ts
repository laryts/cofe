import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * co-fe schema.
 *
 * The shape follows one rule: reports are the source of truth, work profiles
 * are derived. Every rating is an immutable row in `cafe_reports`;
 * `cafe_work_profiles` is a deliberately denormalised cache recomputed in the
 * same transaction as an insert, so it cannot drift.
 *
 * That buys history, provenance and a moderation hook without extra tables, and
 * keeps the map query — score plus amenities for ~100 cafes in a viewport — a
 * single indexed read instead of an aggregate over the whole report log.
 *
 * No PostGIS: latitude/longitude are plain columns with a composite index, and
 * proximity is a bounding-box prefilter plus haversine. See docs/PLAN.md §9.
 */

export const cafeSourceEnum = pgEnum("cafe_source", ["seed", "community", "osm"]);
export const cafeStatusEnum = pgEnum("cafe_status", ["published", "pending", "hidden"]);
export const reportSourceEnum = pgEnum("report_source", ["seed", "community", "import"]);
/**
 * Moderation state for a community report.
 *
 * Anyone can submit; nothing reaches a visitor or moves a score until a
 * moderator approves it. `rejected` is kept rather than deleted so a decision
 * has a record and a repeat abuser is visible.
 */
export const reportStatusEnum = pgEnum("report_status", ["pending", "published", "rejected"]);
export const osmElementTypeEnum = pgEnum("osm_element_type", ["node", "way", "relation"]);
export const confidenceEnum = pgEnum("confidence", ["none", "low", "medium", "high"]);

export const cafes = pgTable(
  "cafes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),

    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),

    address: text("address"),
    neighborhood: text("neighborhood"),
    city: text("city").notNull(),
    countryCode: char("country_code", { length: 2 }).notNull(),

    website: text("website"),

    /**
     * OSM `opening_hours` syntax, stored verbatim, e.g.
     * "Mo-Fr 08:00-19:00; Sa 09:00-14:00".
     *
     * Not parsed into a day/open/close table: the OSM format is the de-facto
     * standard, round-trips losslessly with OSM, and handles the ugly real
     * cases (seasonal hours, holidays, `off`) that a naive table cannot.
     */
    openingHours: text("opening_hours"),

    /** Dedupe key for a future OSM import. Unique together when both present. */
    osmType: osmElementTypeEnum("osm_type"),
    osmId: bigint("osm_id", { mode: "number" }),

    source: cafeSourceEnum("source").notNull().default("community"),
    status: cafeStatusEnum("status").notNull().default("pending"),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    moderationNote: text("moderation_note"),

    /**
     * Coarse origin of a public submission, hashed.
     *
     * Never the raw address: it is enough to spot one source flooding the queue,
     * without keeping a log of who submitted what from where. See SECURITY.md.
     */
    submitterFingerprint: text("submitter_fingerprint"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cafes_slug_key").on(table.slug),
    // The bounding-box prefilter. Latitude leads because it is the more
    // selective of the two for the elongated boxes typical of a city viewport.
    index("cafes_lat_lng_idx").on(table.latitude, table.longitude),
    index("cafes_city_idx").on(table.city),
    index("cafes_status_idx").on(table.status),
    index("cafes_pending_idx").on(table.status, table.createdAt),
    uniqueIndex("cafes_osm_ref_key")
      .on(table.osmType, table.osmId)
      .where(sql`${table.osmType} is not null and ${table.osmId} is not null`),
  ],
);

export const cafeReports = pgTable(
  "cafe_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),

    /*
     * The five scored dimensions, each 1-5 and each nullable so a contributor
     * can rate only what they actually observed. Weights live in
     * src/domain/scoring/weights.ts — never in the database, so the scoring
     * model can be revised and replayed over the untouched report log.
     */
    wifiRating: smallint("wifi_rating"),
    outletsRating: smallint("outlets_rating"),
    seatingRating: smallint("seating_rating"),
    longStayRating: smallint("long_stay_rating"),
    noiseRating: smallint("noise_rating"),

    /* Fit attributes. Filter the result set; never move the score. */
    allowsCalls: boolean("allows_calls"),
    hasAirConditioning: boolean("has_air_conditioning"),
    hasRestroom: boolean("has_restroom"),

    comment: text("comment"),
    contributorHandle: text("contributor_handle"),
    source: reportSourceEnum("source").notNull().default("community"),

    /* Community submissions arrive pending. Seed and import data is published
       directly, since it does not come from the public form. */
    status: reportStatusEnum("status").notNull().default("pending"),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    moderationNote: text("moderation_note"),

    /** When the contributor was actually there — the basis for freshness. */
    visitedAt: date("visited_at", { mode: "date" }),

    /** Soft delete. Retracted reports are excluded from aggregation, not erased. */
    retractedAt: timestamp("retracted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("cafe_reports_cafe_idx").on(table.cafeId, table.status, table.retractedAt),
    // Drives the moderation queue: oldest pending first.
    index("cafe_reports_status_idx").on(table.status, table.createdAt),
  ],
);

export const cafeWorkProfiles = pgTable(
  "cafe_work_profiles",
  {
    cafeId: uuid("cafe_id")
      .primaryKey()
      .references(() => cafes.id, { onDelete: "cascade" }),

    /* Per-dimension shrunk scores, 0-100. Null when nobody has rated it. */
    wifiScore: real("wifi_score"),
    outletsScore: real("outlets_score"),
    seatingScore: real("seating_score"),
    longStayScore: real("long_stay_score"),
    noiseScore: real("noise_score"),

    /** Null when there is not enough evidence to publish a number at all. */
    workFriendlyScore: real("work_friendly_score"),
    confidence: confidenceEnum("confidence").notNull().default("none"),
    reportCount: integer("report_count").notNull().default(0),

    /* Majority vote across reports. Null means genuinely unknown, which the UI
       must keep distinct from a reported `false`. */
    allowsCalls: boolean("allows_calls"),
    hasAirConditioning: boolean("has_air_conditioning"),
    hasRestroom: boolean("has_restroom"),

    lastReportedAt: timestamp("last_reported_at", { withTimezone: true }),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("cafe_work_profiles_score_idx").on(sql`${table.workFriendlyScore} desc nulls last`),
    index("cafe_work_profiles_calls_idx").on(table.allowsCalls),
  ],
);

export type CafeRow = typeof cafes.$inferSelect;
export type NewCafeRow = typeof cafes.$inferInsert;
export type CafeReportRow = typeof cafeReports.$inferSelect;
export type NewCafeReportRow = typeof cafeReports.$inferInsert;
export type CafeWorkProfileRow = typeof cafeWorkProfiles.$inferSelect;
export type NewCafeWorkProfileRow = typeof cafeWorkProfiles.$inferInsert;
