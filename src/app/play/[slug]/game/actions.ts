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

        const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

        if (!team) return { error: "Отборът не е намерен." };
        if (team.currentQuestion !== position) {
            return { error: "Отборът вече не е на този въпрос. Моля, презаредете страницата." };
        }

        const [question] = await db.select().from(questions).where(and(eq(questions.id, questionId), eq(questions.quizId, quizId))).limit(1);

        if (!question) return { error: "Въпросът не е намерен." };

        const trimmedAnswer = answerText.trim();
        if (!trimmedAnswer) return { error: "Моля, въведете отговор." };

        await db.insert(teamAnswers).values({
            teamId,
            questionId,
            answer: trimmedAnswer,
        });

        const isCorrect = question.answers.some(
            validAns => validAns.toLowerCase().trim() === trimmedAnswer.toLowerCase()
        );

        if (isCorrect) {
            await db.insert(progress).values({
                teamId,
                questionPosition: position,
            });

            const allQuestions = await db.select().from(questions).where(eq(questions.quizId, quizId));
            const isLast = position >= allQuestions.length;

            if (isLast) {
                await db.update(teams).set({
                    finishTime: new Date(),
                    currentQuestion: position + 1,
                }).where(eq(teams.id, teamId));
            } else {
                await db.update(teams).set({
                    currentQuestion: position + 1,
                }).where(eq(teams.id, teamId));
            }

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

        const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
        const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
        if (!quiz || !team) return { error: "Грешка при зареждане." };

        const [existingHint] = await db.select().from(usedHints).where(and(eq(usedHints.teamId, teamId), eq(usedHints.questionId, questionId))).limit(1);

        const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
        if (!question) return { error: "Въпросът не е намерен." };

        if (existingHint) {
            return { success: true, hint: question.hint };
        }

        if (team.hintsUsed >= quiz.maxHints) {
            return { error: "Нямате останали жокери." };
        }

        await db.insert(usedHints).values({ teamId, questionId });
        await db.update(teams)
            .set({ hintsUsed: team.hintsUsed + 1 })
            .where(eq(teams.id, teamId));

        broadcastToQuiz(quizId, "hint_used", { teamId, questionId, hintText: question.hint });

        return { success: true, hint: question.hint };
    } catch (e) {
        console.error("Request hint error:", e);
        return { error: "Системна грешка." };
    }
}
