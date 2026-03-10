import { pgSchema, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const quizzerSchema = pgSchema("quizzer");

// --- Enums ---

export const quizStatusEnum = quizzerSchema.enum("quiz_status", ["draft", "lobby", "active", "finished"]);

// --- Tables ---

export const admin = quizzerSchema.table("admin", {
    id: serial("id").primaryKey(),
    passwordHash: text("password_hash").notNull(),
});

export const quizzes = quizzerSchema.table("quizzes", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    status: quizStatusEnum("status").notNull().default("draft"),
    maxHints: integer("max_hints").notNull().default(3),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = quizzerSchema.table("questions", {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    text: text("text"),
    hint: text("hint").notNull(),
    imageUrl: text("image_url"),
    answers: jsonb("answers").notNull().$type<string[]>(),
});

export const teams = quizzerSchema.table("teams", {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    captainPlayerId: integer("captain_player_id"),
    currentQuestion: integer("current_question").notNull().default(1),
    hintsUsed: integer("hints_used").notNull().default(0),
    startTime: timestamp("start_time", { withTimezone: true }),
    finishTime: timestamp("finish_time", { withTimezone: true }),
});

export const players = quizzerSchema.table("players", {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
    requestedTeamId: integer("requested_team_id").references(() => teams.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    externalId: text("external_id").notNull(),
    isCaptain: boolean("is_captain").notNull().default(false),
});

export const progress = quizzerSchema.table("progress", {
    id: serial("id").primaryKey(),
    teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    questionPosition: integer("question_position").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usedHints = quizzerSchema.table("used_hints", {
    id: serial("id").primaryKey(),
    teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
});

export const teamAnswers = quizzerSchema.table("team_answers", {
    id: serial("id").primaryKey(),
    teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
});
