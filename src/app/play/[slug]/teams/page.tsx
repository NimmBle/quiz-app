import { db } from "@/db";
import { quizzes, teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getPlayerSession } from "@/lib/auth";
import TeamsClient from "./TeamsClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    return { title: `Отбори | ${slug} | Аз мога` };
}

export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;

    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.slug, slug),
    });

    if (!quiz) notFound();

    if (quiz.status === "draft") {
        redirect(`/play/${slug}`); // Push back to gate
    }

    const session = await getPlayerSession(quiz.id);
    if (!session) {
        redirect(`/play/${slug}`); // Not logged in
    }

    // 1. Fetch current player database state
    const me = await db.query.players.findFirst({
        where: eq(players.id, session.playerId),
    });

    if (!me) {
        redirect(`/play/${slug}`);
    }

    // 2. Fetch all teams
    const allTeams = await db.query.teams.findMany({
        where: eq(teams.quizId, quiz.id),
        orderBy: (t, { asc }) => [asc(t.id)],
    });

    // 3. Fetch all assigned players
    const allPlayers = await db.query.players.findMany({
        where: eq(players.quizId, quiz.id),
    });

    // 4. Transform into easy-to-consume props
    const teamsData = allTeams.map(t => {
        const members = allPlayers.filter(p => p.teamId === t.id);
        const requests = allPlayers.filter(p => p.requestedTeamId === t.id);

        return {
            id: t.id,
            name: t.name,
            captainPlayerId: t.captainPlayerId,
            members: members.map(m => ({ id: m.id, name: m.name })),
            joinRequests: requests.map(r => ({ id: r.id, name: r.name })),
        };
    });

    return <TeamsClient quiz={quiz} me={me} initialTeams={teamsData} />;
}
