CREATE TYPE "public"."report_status" AS ENUM('pending', 'published', 'rejected');--> statement-breakpoint
DROP INDEX "cafe_reports_cafe_idx";--> statement-breakpoint
ALTER TABLE "cafes" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "cafe_reports" ADD COLUMN "status" "report_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- Backfill, added by hand to a generated migration.
-- Every report that existed before moderation was introduced was, by definition,
-- already live and already counted in a score. Without this they would all
-- default to 'pending' and silently zero every Work Friendly Score on an
-- existing deployment.
UPDATE "cafe_reports" SET "status" = 'published';--> statement-breakpoint
ALTER TABLE "cafe_reports" ADD COLUMN "moderated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cafe_reports" ADD COLUMN "moderation_note" text;--> statement-breakpoint
ALTER TABLE "cafes" ADD COLUMN "moderated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cafes" ADD COLUMN "moderation_note" text;--> statement-breakpoint
ALTER TABLE "cafes" ADD COLUMN "submitter_fingerprint" text;--> statement-breakpoint
CREATE INDEX "cafe_reports_status_idx" ON "cafe_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "cafes_pending_idx" ON "cafes" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "cafe_reports_cafe_idx" ON "cafe_reports" USING btree ("cafe_id","status","retracted_at");