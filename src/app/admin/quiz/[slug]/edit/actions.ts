"use server";

import { db } from "@/db";
import { questions, quizzes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function addQuestion(quizId: number) {
    try {
        // Find highest position
        const existingQuestions = await db.query.questions.findMany({
            where: eq(questions.quizId, quizId),
        });
        const nextPosition = existingQuestions.length + 1;

        await db.insert(questions).values({
            quizId,
            position: nextPosition,
            text: "",
            hint: "",
            answers: [],
        });

        // Revalidate the edit page
        const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
        if (quiz) revalidatePath(`/admin/quiz/${quiz.slug}/edit`);

        return { success: true };
    } catch (error) {
        console.error("Failed to add question:", error);
        return { error: "Грешка при добавяне на въпрос" };
    }
}

export async function updateQuestion(questionId: number, formData: FormData) {
    try {
        const text = formData.get("text") as string;
        const hint = formData.get("hint") as string;
        const answersString = formData.get("answers") as string;

        // Parse answers by comma and trim
        const answersArray = answersString
            .split(",")
            .map(a => a.trim().toLowerCase())
            .filter(a => a.length > 0);

        const imageFile = formData.get("image") as File;
        let imageUrl = undefined;

        // Handle Image Upload to local volume
        if (imageFile && imageFile.size > 0) {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const ext = path.extname(imageFile.name);
            // Generate unique name
            const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            const filePath = path.join(uploadDir, filename);

            await writeFile(filePath, buffer);
            imageUrl = `/uploads/${filename}`;
        }

        const updateData: Partial<typeof questions.$inferInsert> = {
            text,
            hint,
            answers: answersArray,
        };

        if (imageUrl) {
            updateData.imageUrl = imageUrl;
        }

        await db.update(questions).set(updateData).where(eq(questions.id, questionId));

        return { success: true };
    } catch (error) {
        console.error("Failed to update question:", error);
        return { error: "Грешка при запазване" };
    }
}

export async function deleteQuestion(questionId: number) {
    try {
        await db.delete(questions).where(eq(questions.id, questionId));
        return { success: true };
    } catch (error) {
        console.error("Failed to delete question:", error);
        return { error: "Грешка при изтриване" };
    }
}

export async function updateQuizStatus(quizId: number, status: "draft" | "lobby" | "active" | "finished") {
    try {
        await db.update(quizzes).set({ status }).where(eq(quizzes.id, quizId));
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { error: "Грешка при смяна на статуса" };
    }
}

export async function swapQuestionPositions(quizId: number, q1Id: number, q2Id: number) {
    try {
        const q1 = await db.query.questions.findFirst({ where: eq(questions.id, q1Id) });
        const q2 = await db.query.questions.findFirst({ where: eq(questions.id, q2Id) });

        if (!q1 || !q2) return { error: "Въпросите не са намерени" };

        await db.update(questions).set({ position: q2.position }).where(eq(questions.id, q1Id));
        await db.update(questions).set({ position: q1.position }).where(eq(questions.id, q2Id));

        const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
        if (quiz) revalidatePath(`/admin/quiz/${quiz.slug}/edit`);

        return { success: true };
    } catch (error) {
        console.error("Swap error:", error);
        return { error: "Грешка при смяна на позицията" };
    }
}

