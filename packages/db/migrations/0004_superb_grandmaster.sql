CREATE TYPE "public"."match_mode" AS ENUM('realtime', 'async');--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'your_turn';--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "mode" "match_mode" DEFAULT 'realtime' NOT NULL;