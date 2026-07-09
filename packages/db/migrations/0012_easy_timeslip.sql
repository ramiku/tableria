CREATE TYPE "public"."match_end_reason" AS ENUM('completed', 'forfeit', 'abandoned');--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "end_reason" "match_end_reason";