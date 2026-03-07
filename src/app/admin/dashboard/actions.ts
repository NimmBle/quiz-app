"use server";

import { db } from "@/db";
import { quizzes, questions, teams, players } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Generate a URL-friendly slug
function generateSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") + "-" + Math.random().toString(36).substring(2, 6);
}

export async function createQuiz(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name) return { error: "Името е задължително" };

    try {
        const slug = generateSlug(name);
        await db.insert(quizzes).values({
            name,
            slug,
            status: "draft",
        });
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Create quiz error:", error);
        return { error: "Грешка при създаване на куиз" };
    }
}

export async function deleteQuiz(id: number) {
    try {
        await db.delete(quizzes).where(eq(quizzes.id, id));
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Delete quiz error:", error);
        return { error: "Грешка при изтриване" };
    }
}

export async function cloneQuiz(id: number) {
    try {
        // 1. Fetch original quiz
        const originalQuiz = await db.query.quizzes.findFirst({
            where: eq(quizzes.id, id),
        });

        if (!originalQuiz) return { error: "Куизът не е намерен" };

        // 2. Clone the quiz record
        const newName = `${originalQuiz.name} (Копие)`;
        const newSlug = generateSlug(newName);

        const [newQuiz] = await db
            .insert(quizzes)
            .values({
                name: newName,
                slug: newSlug,
                status: "draft",
                maxHints: originalQuiz.maxHints,
            })
            .returning();

        // 3. Fetch original questions
        const originalQuestions = await db.query.questions.findMany({
            where: eq(questions.quizId, id),
        });

        // 4. Clone questions
        for (const q of originalQuestions) {
            await db.insert(questions).values({
                quizId: newQuiz.id,
                position: q.position,
                text: q.text,
                hint: q.hint,
                imageUrl: q.imageUrl,
                answers: q.answers,
            });
        }

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Clone quiz error:", error);
        return { error: "Грешка при клониране" };
    }
}

// Data fetcher for Server Component
export async function getQuizzes() {
    return await db.query.quizzes.findMany({
        orderBy: [desc(quizzes.createdAt)],
    });
}

export async function getDashboardStats() {
    const [quizCount] = await db.select({ count: count() }).from(quizzes);
    const [teamCount] = await db.select({ count: count() }).from(teams);
    const [playerCount] = await db.select({ count: count() }).from(players);

    const [activeQuizzes] = await db
        .select({ count: count() })
        .from(quizzes)
        .where(eq(quizzes.status, "active"));

    return {
        totalQuizzes: quizCount.count,
        totalTeams: teamCount.count,
        totalPlayers: playerCount.count,
        activeQuizzes: activeQuizzes.count,
    };
}
