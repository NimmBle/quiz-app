"use server";

import { db } from "@/db";
import { players, teams, quizzes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { broadcastToQuiz } from "@/lib/sse";
import { revalidatePath } from "next/cache";

export async function deletePlayerAction(playerId: number, quizId: number, teamId: number | null) {
    try {
        await db.delete(players).where(eq(players.id, playerId));

        // Broadcast event so client resets
        broadcastToQuiz(quizId, "player_deleted", { playerId, teamId });

        revalidatePath("/admin/participants");
        return { success: true };
    } catch (e) {
        console.error("Failed to delete player:", e);
        return { error: "Failed to delete player" };
    }
}

export async function deleteTeamAction(teamId: number, quizId: number) {
    try {
        await db.delete(teams).where(eq(teams.id, teamId));

        // Broadcast event so that clients on this team can reset or show an alert
        broadcastToQuiz(quizId, "team_deleted", { teamId });

        revalidatePath("/admin/participants");
        return { success: true };
    } catch (e) {
        console.error("Failed to delete team:", e);
        return { error: "Failed to delete team" };
    }
}
