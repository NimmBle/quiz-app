CREATE SCHEMA "quizzer";
--> statement-breakpoint
CREATE TYPE "quizzer"."quiz_status" AS ENUM('draft', 'lobby', 'active', 'finished');--> statement-breakpoint
CREATE TABLE "quizzer"."admin" (
	"id" serial PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzer"."players" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"team_id" integer,
	"requested_team_id" integer,
	"name" text NOT NULL,
	"external_id" text NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzer"."progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"question_position" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzer"."questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"position" integer NOT NULL,
	"text" text,
	"hint" text NOT NULL,
	"image_url" text,
	"answers" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzer"."quizzes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "quizzer"."quiz_status" DEFAULT 'draft' NOT NULL,
	"max_hints" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quizzes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "quizzer"."team_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzer"."teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"name" text NOT NULL,
	"captain_player_id" integer,
	"current_question" integer DEFAULT 1 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp with time zone,
	"finish_time" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quizzer"."used_hints" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"question_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quizzer"."players" ADD CONSTRAINT "players_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzer"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "quizzer"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."players" ADD CONSTRAINT "players_requested_team_id_teams_id_fk" FOREIGN KEY ("requested_team_id") REFERENCES "quizzer"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."progress" ADD CONSTRAINT "progress_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "quizzer"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."questions" ADD CONSTRAINT "questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzer"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."team_answers" ADD CONSTRAINT "team_answers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "quizzer"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."team_answers" ADD CONSTRAINT "team_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "quizzer"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."teams" ADD CONSTRAINT "teams_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "quizzer"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."used_hints" ADD CONSTRAINT "used_hints_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "quizzer"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quizzer"."used_hints" ADD CONSTRAINT "used_hints_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "quizzer"."questions"("id") ON DELETE cascade ON UPDATE no action;