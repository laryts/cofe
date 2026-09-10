CREATE TYPE "public"."cafe_source" AS ENUM('seed', 'community', 'osm');--> statement-breakpoint
CREATE TYPE "public"."cafe_status" AS ENUM('published', 'pending', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('none', 'low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."osm_element_type" AS ENUM('node', 'way', 'relation');--> statement-breakpoint
CREATE TYPE "public"."report_source" AS ENUM('seed', 'community', 'import');--> statement-breakpoint
CREATE TABLE "cafe_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"wifi_rating" smallint,
	"outlets_rating" smallint,
	"seating_rating" smallint,
	"long_stay_rating" smallint,
	"noise_rating" smallint,
	"allows_calls" boolean,
	"has_air_conditioning" boolean,
	"has_restroom" boolean,
	"comment" text,
	"contributor_handle" text,
	"source" "report_source" DEFAULT 'community' NOT NULL,
	"visited_at" date,
	"retracted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafe_work_profiles" (
	"cafe_id" uuid PRIMARY KEY NOT NULL,
	"wifi_score" real,
	"outlets_score" real,
	"seating_score" real,
	"long_stay_score" real,
	"noise_score" real,
	"work_friendly_score" real,
	"confidence" "confidence" DEFAULT 'none' NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"allows_calls" boolean,
	"has_air_conditioning" boolean,
	"has_restroom" boolean,
	"last_reported_at" timestamp with time zone,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"address" text,
	"neighborhood" text,
	"city" text NOT NULL,
	"country_code" char(2) NOT NULL,
	"website" text,
	"opening_hours" text,
	"osm_type" "osm_element_type",
	"osm_id" bigint,
	"source" "cafe_source" DEFAULT 'community' NOT NULL,
	"status" "cafe_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cafe_reports" ADD CONSTRAINT "cafe_reports_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_work_profiles" ADD CONSTRAINT "cafe_work_profiles_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cafe_reports_cafe_idx" ON "cafe_reports" USING btree ("cafe_id","retracted_at");--> statement-breakpoint
CREATE INDEX "cafe_work_profiles_score_idx" ON "cafe_work_profiles" USING btree ("work_friendly_score" desc nulls last);--> statement-breakpoint
CREATE INDEX "cafe_work_profiles_calls_idx" ON "cafe_work_profiles" USING btree ("allows_calls");--> statement-breakpoint
CREATE UNIQUE INDEX "cafes_slug_key" ON "cafes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cafes_lat_lng_idx" ON "cafes" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "cafes_city_idx" ON "cafes" USING btree ("city");--> statement-breakpoint
CREATE INDEX "cafes_status_idx" ON "cafes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cafes_osm_ref_key" ON "cafes" USING btree ("osm_type","osm_id") WHERE "cafes"."osm_type" is not null and "cafes"."osm_id" is not null;