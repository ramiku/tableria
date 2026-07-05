CREATE TABLE "rating_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" varchar(64) NOT NULL,
	"season_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"rating_before" real NOT NULL,
	"rating_after" real NOT NULL,
	"rd_before" real NOT NULL,
	"rd_after" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_game_ratings" (
	"user_id" uuid NOT NULL,
	"game_id" varchar(64) NOT NULL,
	"season_id" uuid NOT NULL,
	"rating" real DEFAULT 1500 NOT NULL,
	"rd" real DEFAULT 350 NOT NULL,
	"vol" real DEFAULT 0.06 NOT NULL,
	"wins" smallint DEFAULT 0 NOT NULL,
	"losses" smallint DEFAULT 0 NOT NULL,
	"draws" smallint DEFAULT 0 NOT NULL,
	"peak_rating" real DEFAULT 1500 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_game_ratings_user_id_game_id_season_id_pk" PRIMARY KEY("user_id","game_id","season_id")
);
--> statement-breakpoint
CREATE TABLE "user_game_stats" (
	"user_id" uuid NOT NULL,
	"game_id" varchar(64) NOT NULL,
	"played" smallint DEFAULT 0 NOT NULL,
	"wins" smallint DEFAULT 0 NOT NULL,
	"losses" smallint DEFAULT 0 NOT NULL,
	"draws" smallint DEFAULT 0 NOT NULL,
	"last_played_at" timestamp with time zone,
	CONSTRAINT "user_game_stats_user_id_game_id_pk" PRIMARY KEY("user_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_ratings" ADD CONSTRAINT "user_game_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_ratings" ADD CONSTRAINT "user_game_ratings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_ratings" ADD CONSTRAINT "user_game_ratings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_stats" ADD CONSTRAINT "user_game_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_stats" ADD CONSTRAINT "user_game_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rating_history_user_game_idx" ON "rating_history" USING btree ("user_id","game_id","created_at");--> statement-breakpoint
CREATE INDEX "user_game_ratings_leaderboard_idx" ON "user_game_ratings" USING btree ("game_id","season_id","rating" DESC NULLS LAST);