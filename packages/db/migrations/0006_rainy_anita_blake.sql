CREATE TYPE "public"."tournament_format" AS ENUM('single_elim');--> statement-breakpoint
CREATE TYPE "public"."tournament_match_state" AS ENUM('pending', 'finished');--> statement-breakpoint
CREATE TYPE "public"."tournament_participant_status" AS ENUM('registered', 'checked_in', 'eliminated');--> statement-breakpoint
CREATE TYPE "public"."tournament_state" AS ENUM('registration', 'running', 'finished', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'tournament_round_started';--> statement-breakpoint
ALTER TYPE "public"."activity_type" ADD VALUE 'tournament_eliminated';--> statement-breakpoint
CREATE TABLE "tournament_matches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"slot_index" integer NOT NULL,
	"participant_a_id" uuid,
	"participant_b_id" uuid,
	"match_id" uuid,
	"winner_user_id" uuid,
	"state" "tournament_match_state" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "tournament_matches_round_slot_uq" UNIQUE("round_id","slot_index")
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "tournament_participant_status" DEFAULT 'registered' NOT NULL,
	"seed" integer,
	"final_placement" integer,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_participants_tournament_id_user_id_pk" PRIMARY KEY("tournament_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tournament_rounds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round_number" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_rounds_tournament_round_uq" UNIQUE("tournament_id","round_number")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"game_id" varchar(64) NOT NULL,
	"format" "tournament_format" DEFAULT 'single_elim' NOT NULL,
	"state" "tournament_state" DEFAULT 'registration' NOT NULL,
	"host_user_id" uuid NOT NULL,
	"rated" boolean DEFAULT true NOT NULL,
	"turn_duration_s" integer,
	"total_rounds" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_round_id_tournament_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."tournament_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_participant_a_id_users_id_fk" FOREIGN KEY ("participant_a_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_participant_b_id_users_id_fk" FOREIGN KEY ("participant_b_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_user_id_users_id_fk" FOREIGN KEY ("winner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_rounds" ADD CONSTRAINT "tournament_rounds_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_matches_match_idx" ON "tournament_matches" USING btree ("match_id");