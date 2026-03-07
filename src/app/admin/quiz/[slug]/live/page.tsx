import { db } from "@/db";
import { quizzes, questions, teams, players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getLiveClientCount } from "@/lib/sse";
import LiveClient from "./LiveClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    return { title: `На живо | ${slug} | Админ Панел` };
}

export default async function LivePage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;

    // 1. Auth Guard
    const session = await getAdminSession();
    if (!session) {
        redirect("/admin/login");
    }

    // 2. Fetch Quiz
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.slug, slug),
    });

    if (!quiz) notFound();

    // 3. Status Guard 
    if (quiz.status === "draft") {
        redirect(`/admin/quiz/${slug}/edit`);
    }

    // 4. Fetch All Questions
    const allQuestions = await db.query.questions.findMany({
        where: eq(questions.quizId, quiz.id),
        orderBy: (q, { asc }) => [asc(q.position)],
    });

    // 5. Fetch Initial Live Client Count
    const initialLiveCount = getLiveClientCount(quiz.id);

    // 6. Fetch Database View of the Leaderboard
    const allTeamsRaw = await db.query.teams.findMany({
        where: eq(teams.quizId, quiz.id),
    });

    const allPlayers = await db.query.players.findMany({
        where: eq(players.quizId, quiz.id),
    });

    const allProgress = await db.query.progress.findMany({
        orderBy: (p, { asc }) => [asc(p.recordedAt)],
    });

    const teamsData = allTeamsRaw.map(t => {
        const teamMembers = allPlayers.filter(p => p.teamId === t.id);
        const teamProgress = allProgress.filter(p => p.teamId === t.id);

        let lastAnswerTime = new Date(0);
        if (teamProgress.length > 0) {
            lastAnswerTime = teamProgress[teamProgress.length - 1].recordedAt;
        }

        return {
            id: t.id,
            name: t.name,
            members: teamMembers.map(m => m.name),
            currentQuestion: t.currentQuestion,
            hintsUsed: t.hintsUsed,
            isFinished: !!t.finishTime,
            score: teamProgress.length,
            lastAnswerTime: lastAnswerTime.getTime(),
        };
    });

    teamsData.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.lastAnswerTime - b.lastAnswerTime;
    });

    return (
        <LiveClient
            quiz={quiz}
            questions={allQuestions.map(q => ({ id: q.id, position: q.position, text: q.text }))}
            initialTeams={teamsData}
            initialLiveCount={initialLiveCount}
        />
    );
}
