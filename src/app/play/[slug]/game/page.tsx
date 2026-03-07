import { db } from "@/db";
import { quizzes, teams, players, questions, usedHints } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getPlayerSession } from "@/lib/auth";
import GameClient from "./GameClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    return { title: `Игра | ${slug} | Аз мога` };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;

    // 1. Fetch Quiz
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.slug, slug)).limit(1);

    if (!quiz) notFound();

    // 2. Fetch Session & Player
    const session = await getPlayerSession(quiz.id);
    if (!session || !session.teamId) {
        redirect(`/play/${slug}`);
    }

    const [me] = await db.select().from(players).where(eq(players.id, session.playerId)).limit(1);

    if (!me || me.teamId !== session.teamId) {
        redirect(`/play/${slug}`);
    }

    const [teamDoc] = await db.select().from(teams).where(eq(teams.id, session.teamId)).limit(1);

    if (!teamDoc) {
        redirect(`/play/${slug}`);
    }

    const teamMembers = await db.select().from(players).where(eq(players.teamId, teamDoc.id));

    const joinRequests = await db.select().from(players).where(eq(players.requestedTeamId, teamDoc.id));

    const team = {
        ...teamDoc,
        members: teamMembers.map(m => ({ id: m.id, name: m.name })),
        joinRequests: joinRequests.map(r => ({ id: r.id, name: r.name }))
    };

    // 3. Quiz State Guards
    if (quiz.status === "draft" || quiz.status === "lobby") {
        redirect(`/play/${slug}/teams`);
    }

    // 4. Determine progression and total questions
    const allQuestions = await db.select()
        .from(questions)
        .where(eq(questions.quizId, quiz.id))
        .orderBy(questions.position);

    const isFinished = !!team.finishTime || quiz.status === "finished";

    // Find current question based on team's position
    const currentQuestionDoc = allQuestions.find(q => q.position === team.currentQuestion);

    if (!currentQuestionDoc && !isFinished) {
        return <GameClient quiz={quiz} me={me} team={team} isFinished={true} totalQuestions={allQuestions.length} />;
    }

    if (isFinished) {
        return <GameClient quiz={quiz} me={me} team={team} isFinished={true} totalQuestions={allQuestions.length} />;
    }

    // 5. Build Safe Question Payload
    const safeQuestion = {
        id: currentQuestionDoc!.id,
        position: currentQuestionDoc!.position,
        text: currentQuestionDoc!.text,
        imageUrl: currentQuestionDoc!.imageUrl,
    };

    // 6. Check if hint is already unlocked
    const [unlockedHint] = await db.select()
        .from(usedHints)
        .where(and(eq(usedHints.teamId, team.id), eq(usedHints.questionId, safeQuestion.id)))
        .limit(1);

    let initialHint = null;
    if (unlockedHint) {
        initialHint = currentQuestionDoc!.hint;
    }

    return (
        <GameClient
            quiz={quiz}
            me={me}
            team={team}
            isFinished={false}
            totalQuestions={allQuestions.length}
            currentQuestion={safeQuestion}
            initialHint={initialHint}
        />
    );
}
