CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"display_name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cafe_reports" ADD COLUMN "moderated_by" uuid;--> statement-breakpoint
ALTER TABLE "cafe_reports" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "cafes" ADD COLUMN "moderated_by" uuid;--> statement-breakpoint
ALTER TABLE "cafes" ADD COLUMN "submitted_by" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");