import { db } from "@/db";
import { quizzes, questions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditorClient from "./EditorClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    return {
        title: `Редакция | ${slug} | Аз мога — тук и сега`,
    };
}

export default async function QuizEditPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.slug, slug),
    });

    if (!quiz) {
        notFound();
    }

    const quizQuestions = await db.query.questions.findMany({
        where: eq(questions.quizId, quiz.id),
        orderBy: [asc(questions.position)],
    });

    return <EditorClient quiz={quiz} initialQuestions={quizQuestions} />;
}
