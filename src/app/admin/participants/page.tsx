import { db } from "@/db";
import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParticipantsClient from "./ParticipantsClient";

export default async function ParticipantsPage() {
    const session = await getAdminSession();
    if (!session) {
        redirect("/admin/login");
    }

    // Fetch all active/lobby quizzes (or all quizzes) and their teams/players
    const allQuizzes = await db.query.quizzes.findMany({
        orderBy: (quizzes, { desc }) => [desc(quizzes.createdAt)],
    });

    const allTeams = await db.query.teams.findMany();
    const allPlayers = await db.query.players.findMany();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-brand-blue uppercase tracking-tight">Участници</h1>
            <p className="text-gray-500">
                Управление на отбори и играчи. Използвайте филтъра, за да разгледате конкретен куиз.
            </p>
            <ParticipantsClient
                quizzes={allQuizzes}
                teams={allTeams}
                players={allPlayers}
            />
        </div>
    );
}
