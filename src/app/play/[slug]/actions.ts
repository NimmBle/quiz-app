"use server";

import { db } from "@/db";
import { players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createPlayerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function joinQuizAsGuest(quizId: number, quizSlug: string, prevState: unknown, formData: FormData) {
    const name = formData.get("name") as string;
    const externalId = formData.get("externalId") as string;

    if (!name || name.trim().length < 2) {
        return { error: "Моля, въведете валидно име." };
    }

    if (!externalId) {
        return { error: "Моля, въведете клас (училище)." };
    }

    try {
        // Check name uniqueness in the current quiz
        const existingPlayer = await db.query.players.findFirst({
            where: and(eq(players.quizId, quizId), eq(players.name, name.trim())),
        });

        if (existingPlayer) {
            return { error: "Това име вече е заето в този куиз. Моля, изберете друго." };
        }

        // Insert player
        const [newPlayer] = await db.insert(players).values({
            quizId,
            name: name.trim(),
            externalId: externalId.trim(),
        }).returning();

        // Create session (Cookie)
        await createPlayerSession({
            playerId: newPlayer.id,
            quizId: newPlayer.quizId,
            teamId: null, // Not in a team yet
            isCaptain: false,
        });

    } catch (error) {
        console.error("Player join error:", error);
        return { error: "Грешка при профила. Опитайте отново." };
    }

    // Redirect to the Team Lobby / Selection screen
    redirect(`/play/${quizSlug}/teams`);
}
