ALTER TYPE "public"."tournament_format" ADD VALUE 'swiss';--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD COLUMN "points" real DEFAULT 0 NOT NULL;