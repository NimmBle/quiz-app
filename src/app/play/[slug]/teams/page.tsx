import { db } from "@/db";
import { quizzes, teams, players } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getPlayerSession } from "@/lib/auth";
import TeamsClient from "./TeamsClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    return { title: `Отбори | ${slug} | Аз мога` };
}

export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.slug, slug)).limit(1);

    if (!quiz) notFound();

    if (quiz.status === "draft") {
        redirect(`/play/${slug}`);
    }

    const session = await getPlayerSession(quiz.id);
    if (!session) {
        redirect(`/play/${slug}`);
    }

    const [me] = await db.select().from(players).where(eq(players.id, session.playerId)).limit(1);

    if (!me) {
        redirect(`/play/${slug}`);
    }

    if (quiz.status === "active" && me.teamId) {
        redirect(`/play/${slug}/game`);
    }

    const allTeams = await db.select().from(teams).where(eq(teams.quizId, quiz.id)).orderBy(teams.id);

    const allPlayers = await db.select().from(players).where(eq(players.quizId, quiz.id));

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
