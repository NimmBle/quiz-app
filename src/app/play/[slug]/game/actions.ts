"use server";

import { db } from "@/db";
import { quizzes, teams, questions, progress, usedHints, teamAnswers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getPlayerSession } from "@/lib/auth";
import { broadcastToQuiz } from "@/lib/sse";

export async function submitAnswer(quizId: number, questionId: number, position: number, answerText: string) {
    const session = await getPlayerSession(quizId);
    if (!session || !session.teamId) return { error: "Не сте в отбор." };

    try {
        const teamId = session.teamId;

        // 1. Validate team state
        const team = await db.query.teams.findFirst({
            where: eq(teams.id, teamId),
        });

        if (!team) return { error: "Отборът не е намерен." };
        if (team.currentQuestion !== position) {
            return { error: "Отборът вече не е на този въпрос. Моля, презаредете страницата." };
        }

        // 2. Load the question
        const question = await db.query.questions.findFirst({
            where: and(eq(questions.id, questionId), eq(questions.quizId, quizId)),
        });

        if (!question) return { error: "Въпросът не е намерен." };

        const trimmedAnswer = answerText.trim();
        if (!trimmedAnswer) return { error: "Моля, въведете отговор." };

        // 3. Log the answer attempt
        await db.insert(teamAnswers).values({
            teamId,
            questionId,
            answer: trimmedAnswer,
        });

        // 4. Check correctness (case-insensitive)
        const isCorrect = question.answers.some(
            validAns => validAns.toLowerCase().trim() === trimmedAnswer.toLowerCase()
        );

        if (isCorrect) {
            // Success! Advance the team.

            // Log progress for leaderboard sorting
            await db.insert(progress).values({
                teamId,
                questionPosition: position,
            });

            // Check if this is the last question
            const allQuestions = await db.query.questions.findMany({
                where: eq(questions.quizId, quizId),
            });
            const isLast = position >= allQuestions.length;

            if (isLast) {
                await db.update(teams).set({
                    finishTime: new Date(),
                    currentQuestion: position + 1, // Advance past the end
                }).where(eq(teams.id, teamId));
            } else {
                await db.update(teams).set({
                    currentQuestion: position + 1,
                }).where(eq(teams.id, teamId));
            }

            // Tell all clients in this team to refresh
            broadcastToQuiz(quizId, "team_advanced", { teamId, position: position + 1 });

            return { success: true, isCorrect: true };
        } else {
            return { success: true, isCorrect: false };
        }
    } catch (e) {
        console.error("Submit answer error:", e);
        return { error: "Системна грешка." };
    }
}

export async function requestHint(quizId: number, questionId: number) {
    const session = await getPlayerSession(quizId);
    if (!session || !session.teamId) return { error: "Не сте в отбор." };

    try {
        const teamId = session.teamId;

        // 1. Fetch quiz and team rules
        const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
        const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
        if (!quiz || !team) return { error: "Грешка при зареждане." };

        // 2. Have they already requested a hint for this question?
        const existingHint = await db.query.usedHints.findFirst({
            where: and(eq(usedHints.teamId, teamId), eq(usedHints.questionId, questionId))
        });

        const question = await db.query.questions.findFirst({ where: eq(questions.id, questionId) });
        if (!question) return { error: "Въпросът не е намерен." };

        if (existingHint) {
            // Already used, just return it without penalty
            return { success: true, hint: question.hint };
        }

        // 3. Do they have hints left?
        if (team.hintsUsed >= quiz.maxHints) {
            return { error: "Нямате останали жокери." };
        }

        // 4. Use a hint
        await db.insert(usedHints).values({ teamId, questionId });
        await db.update(teams)
            .set({ hintsUsed: team.hintsUsed + 1 })
            .where(eq(teams.id, teamId));

        // Tell all clients in this team to reveal the hint locally
        broadcastToQuiz(quizId, "hint_used", { teamId, questionId, hintText: question.hint });

        return { success: true, hint: question.hint };
    } catch (e) {
        console.error("Request hint error:", e);
        return { error: "Системна грешка." };
    }
}
