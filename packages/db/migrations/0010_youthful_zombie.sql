CREATE TYPE "public"."reputation_reason" AS ENUM('match_abandoned', 'match_forfeit_timeout', 'match_completed_clean', 'chat_blocked_profanity', 'user_report', 'passive_recovery');--> statement-breakpoint
CREATE TYPE "public"."user_report_reason" AS ENUM('abusive_language', 'unsportsmanlike', 'cheating', 'other');--> statement-breakpoint
CREATE TABLE "reputation_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" "reputation_reason" NOT NULL,
	"delta" smallint NOT NULL,
	"reputation_before" smallint NOT NULL,
	"reputation_after" smallint NOT NULL,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"reason" "user_report_reason" NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_reports_unique" UNIQUE("reporter_id","reported_user_id","match_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reputation" smallint DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reputation_events_user_created_idx" ON "reputation_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_reports_reported_idx" ON "user_reports" USING btree ("reported_user_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reputation_range" CHECK ("users"."reputation" between 1 and 100);