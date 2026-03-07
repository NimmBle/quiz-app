import { db } from "@/db";
import { quizzes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getPlayerSession } from "@/lib/auth";
import ClientLogin from "./ClientLogin";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;
    return {
        title: `Вход | ${slug} | Аз мога`,
    };
}

export default async function PlayerLoginPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug;

    // 1. Fetch Quiz
    const quiz = await db.query.quizzes.findFirst({
        where: eq(quizzes.slug, slug),
    });

    if (!quiz) {
        notFound();
    }

    // 2. Check Quiz Status
    if (quiz.status === "draft") {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
                    <h1 className="text-2xl font-bold text-brand-red mb-2">Куизът все още не е отворен!</h1>
                    <p className="text-gray-600">Очаквайте администраторът да позволи присъединяването.</p>
                </div>
            </div>
        );
    }

    if (quiz.status === "finished") {
        return (
            <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl">
                    <h1 className="text-2xl font-bold text-brand-red mb-2">Куизът е завършил!</h1>
                    <p className="text-gray-600">Благодарим за участието.</p>
                </div>
            </div>
        );
    }

    // 3. Check existing player session 
    const session = await getPlayerSession(quiz.id);
    if (session) {
        // If they already have a session for THIS exact quiz, route them strictly forward.
        // If they don't have a team yet, redirect to /teams. If they have a team, redirect to /teams (waiting area)
        if (!session.teamId) {
            redirect(`/play/${quiz.slug}/teams`);
        } else {
            redirect(`/play/${quiz.slug}/teams`);
        }
    }

    // 4. Render Login Form
    return <ClientLogin quiz={quiz} />;
}
