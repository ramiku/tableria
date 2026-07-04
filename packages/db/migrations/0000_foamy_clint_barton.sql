CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
CREATE TYPE "public"."match_state" AS ENUM('waiting', 'starting', 'in_game', 'finished', 'cancelled', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."presence" AS ENUM('online', 'away', 'in_game', 'offline');--> statement-breakpoint
CREATE TABLE "game_categories" (
	"slug" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_content" (
	"game_id" varchar(64) NOT NULL,
	"section_key" varchar(64) NOT NULL,
	"body" text NOT NULL,
	CONSTRAINT "game_content_game_id_section_key_pk" PRIMARY KEY("game_id","section_key")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_slug" varchar(64),
	"min_players" smallint DEFAULT 2 NOT NULL,
	"max_players" smallint DEFAULT 2 NOT NULL,
	"duration_min" smallint,
	"badge" varchar(32),
	"cover_bg" varchar(16),
	"cover_fg" varchar(16),
	"description" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"options" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_moves" (
	"match_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"player_seat" smallint NOT NULL,
	"move" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_moves_match_id_seq_pk" PRIMARY KEY("match_id","seq")
);
--> statement-breakpoint
CREATE TABLE "match_players" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"seat" smallint NOT NULL,
	"ready" boolean DEFAULT false NOT NULL,
	"placement" smallint,
	"rating_before" real,
	"rating_after" real,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disconnected_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	CONSTRAINT "match_players_match_id_user_id_pk" PRIMARY KEY("match_id","user_id"),
	CONSTRAINT "match_players_seat_uq" UNIQUE("match_id","seat")
);
--> statement-breakpoint
CREATE TABLE "match_spectators" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_spectators_match_id_user_id_pk" PRIMARY KEY("match_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"game_id" varchar(64) NOT NULL,
	"host_user_id" uuid,
	"state" "match_state" DEFAULT 'waiting' NOT NULL,
	"max_players" smallint NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"rated" boolean DEFAULT false NOT NULL,
	"turn_duration_s" integer,
	"options" jsonb,
	"rng_seed" text,
	"state_snapshot" jsonb,
	"snapshot_seq" integer DEFAULT 0 NOT NULL,
	"turn_deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "matches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" char(64) NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"two_factor_passed" boolean DEFAULT false NOT NULL,
	"persistent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" "citext" NOT NULL,
	"display_name" text NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text,
	"avatar_initial" varchar(4),
	"avatar_color" varchar(16),
	"status_message" text,
	"presence" "presence" DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"disabled_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "game_content" ADD CONSTRAINT "game_content_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_category_slug_game_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."game_categories"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_moves" ADD CONSTRAINT "match_moves_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_spectators" ADD CONSTRAINT "match_spectators_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_spectators" ADD CONSTRAINT "match_spectators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_players_user_idx" ON "match_players" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "matches_game_state_idx" ON "matches" USING btree ("game_id","state");--> statement-breakpoint
CREATE INDEX "matches_deadline_idx" ON "matches" USING btree ("turn_deadline_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");