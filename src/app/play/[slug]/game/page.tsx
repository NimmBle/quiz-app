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
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.slug, slug),
    });

    if (!quiz) notFound();

    // 2. Fetch Session & Player
    const session = await getPlayerSession(quiz.id);
    if (!session || !session.teamId) {
        redirect(`/play/${slug}`);
    }

    const me = await db.query.players.findFirst({
        where: eq(players.id, session.playerId),
    });

    if (!me || me.teamId !== session.teamId) {
        redirect(`/play/${slug}`);
    }

    const team = await db.query.teams.findFirst({
        where: eq(teams.id, session.teamId),
    });

    if (!team) {
        redirect(`/play/${slug}`);
    }

    // 3. Quiz State Guards
    if (quiz.status === "draft" || quiz.status === "lobby") {
        redirect(`/play/${slug}/teams`);
    }

    // 4. Determine progression and total questions
    const allQuestions = await db.query.questions.findMany({
        where: eq(questions.quizId, quiz.id),
        orderBy: (q, { asc }) => [asc(q.position)],
    });

    const isFinished = !!team.finishTime || quiz.status === "finished";

    // Find current question based on team's position
    const currentQuestionDoc = allQuestions.find(q => q.position === team.currentQuestion);

    // If no current question found and not explicitly marked finished (edge case fallback),
    // we consider them finished.
    if (!currentQuestionDoc && !isFinished) {
        // Technically team finishTime should be set by the action, 
        // but this safely guards rendering out-of-bounds questions.
        return <GameClient quiz={quiz} me={me} team={team} isFinished={true} totalQuestions={allQuestions.length} />;
    }

    if (isFinished) {
        return <GameClient quiz={quiz} me={me} team={team} isFinished={true} totalQuestions={allQuestions.length} />;
    }

    // 5. Build Safe Question Payload (No Answers Array!)
    const safeQuestion = {
        id: currentQuestionDoc!.id,
        position: currentQuestionDoc!.position,
        text: currentQuestionDoc!.text,
        imageUrl: currentQuestionDoc!.imageUrl,
        // We only send the hint if they already unlocked it.
    };

    // 6. Check if hint is already unlocked
    const unlockedHint = await db.query.usedHints.findFirst({
        where: and(eq(usedHints.teamId, team.id), eq(usedHints.questionId, safeQuestion.id))
    });

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
