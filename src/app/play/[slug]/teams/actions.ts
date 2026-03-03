"use server";

import { db } from "@/db";
import { teams, players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getPlayerSession, createPlayerSession } from "@/lib/auth";
import { broadcastToQuiz } from "@/lib/sse";

export async function createTeam(quizId: number, teamName: string) {
    const session = await getPlayerSession(quizId);
    if (!session) return { error: "Невалидна сесия" };

    try {
        // 1. Check if name is taken
        const existingTeam = await db.query.teams.findFirst({
            where: and(eq(teams.quizId, quizId), eq(teams.name, teamName.trim())),
        });

        if (existingTeam) {
            return { error: "Отбор с това име вече съществува." };
        }

        // 2. Create the team
        const [newTeam] = await db.insert(teams).values({
            quizId,
            name: teamName.trim(),
            captainPlayerId: session.playerId,
        }).returning();

        // 3. Update the player
        await db.update(players).set({
            teamId: newTeam.id,
            isCaptain: true,
            requestedTeamId: null,
        }).where(eq(players.id, session.playerId));

        // 4. Update the session cookie
        await createPlayerSession({
            ...session,
            teamId: newTeam.id,
            isCaptain: true,
        });

        // 5. Broadcast so others see the new team
        broadcastToQuiz(quizId, "team_created", { teamId: newTeam.id });

        return { success: true };
    } catch (error) {
        console.error("Create team error:", error);
        return { error: "Грешка при създаване на отбор." };
    }
}

export async function requestToJoin(quizId: number, teamId: number) {
    const session = await getPlayerSession(quizId);
    if (!session) return { error: "Невалидна сесия" };

    try {
        // Determine player's current limits
        await db.update(players)
            .set({ requestedTeamId: teamId })
            .where(eq(players.id, session.playerId));

        broadcastToQuiz(quizId, "join_requested", { teamId });
        return { success: true };
    } catch {
        return { error: "Грешка при заявката." };
    }
}

export async function cancelJoinRequest(quizId: number) {
    const session = await getPlayerSession(quizId);
    if (!session) return { error: "Невалидна сесия" };

    try {
        await db.update(players).set({ requestedTeamId: null }).where(eq(players.id, session.playerId));
        broadcastToQuiz(quizId, "join_cancelled", { playerId: session.playerId });
        return { success: true };
    } catch {
        return { error: "Грешка при отмяна." };
    }
}

export async function approvePlayer(quizId: number, playerId: number) {
    const session = await getPlayerSession(quizId);
    if (!session || !session.isCaptain || !session.teamId) {
        return { error: "Нямате права на капитан." };
    }

    try {
        // Check team size (max 5)
        const currentMembers = await db.query.players.findMany({
            where: eq(players.teamId, session.teamId),
        });

        if (currentMembers.length >= 5) {
            return { error: "Отборът е пълен (макс. 5 човека)." };
        }

        // Update the player
        await db.update(players)
            .set({ teamId: session.teamId, requestedTeamId: null })
            .where(eq(players.id, playerId));

        broadcastToQuiz(quizId, "player_approved", { playerId, teamId: session.teamId });
        return { success: true };
    } catch {
        return { error: "Грешка при одобряване." };
    }
}

export async function rejectPlayer(quizId: number, playerId: number) {
    const session = await getPlayerSession(quizId);
    if (!session || !session.isCaptain || !session.teamId) {
        return { error: "Нямате права на капитан." };
    }

    try {
        await db.update(players)
            .set({ requestedTeamId: null })
            .where(eq(players.id, playerId));

        broadcastToQuiz(quizId, "player_rejected", { playerId });
        return { success: true };
    } catch {
        return { error: "Грешка при отхвърляне." };
    }
}

export async function refreshPlayerSession(quizId: number) {
    // A utility for a client to call when they receive SSE that they were approved,
    // prompting the server to mint a new cookie with their updated teamId.
    const session = await getPlayerSession(quizId);
    if (!session) return { success: false };

    const player = await db.query.players.findFirst({
        where: eq(players.id, session.playerId),
    });

    if (player && (player.teamId !== session.teamId || player.isCaptain !== session.isCaptain)) {
        await createPlayerSession({
            ...session,
            teamId: player.teamId,
            isCaptain: player.isCaptain,
        });
        return { success: true, teamId: player.teamId };
    }
    return { success: false };
}

export async function leaveTeam(quizId: number) {
    const session = await getPlayerSession(quizId);
    if (!session || !session.teamId) return { error: "Не сте в отбор." };

    try {
        const teamId = session.teamId;

        // 1. Update the leaving player
        await db.update(players).set({
            teamId: null,
            isCaptain: false,
        }).where(eq(players.id, session.playerId));

        // 2. Handle Captaincy Reassignment
        if (session.isCaptain) {
            const remainingMembers = await db.query.players.findMany({
                where: eq(players.teamId, teamId),
                orderBy: (p, { asc }) => [asc(p.id)],
            });

            if (remainingMembers.length > 0) {
                const newCaptain = remainingMembers[0];
                await db.update(players).set({ isCaptain: true }).where(eq(players.id, newCaptain.id));
                await db.update(teams).set({ captainPlayerId: newCaptain.id }).where(eq(teams.id, teamId));
            } else {
                await db.update(teams).set({ captainPlayerId: null }).where(eq(teams.id, teamId));
            }
        }

        // 3. Update session cookie
        await createPlayerSession({
            ...session,
            teamId: null,
            isCaptain: false,
        });

        broadcastToQuiz(quizId, "player_left", { teamId, playerId: session.playerId });
        return { success: true };
    } catch {
        return { error: "Грешка при напускане на отбора." };
    }
}
