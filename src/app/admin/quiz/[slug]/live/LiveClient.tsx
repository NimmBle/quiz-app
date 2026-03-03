"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, CheckCircle, StopCircle, RefreshCw, Trophy } from "lucide-react";
import { updateQuizStatus } from "../edit/actions";

type TeamRank = {
    id: number;
    name: string;
    members: string[];
    currentQuestion: number;
    hintsUsed: number;
    isFinished: boolean;
    score: number;
    lastAnswerTime: number;
};

type QuestionSlim = {
    id: number;
    position: number;
    text: string | null;
};

export default function LiveClient({
    quiz, questions, initialTeams
}: {
    quiz: { id: number, slug: string, status: string, name: string },
    questions: QuestionSlim[],
    initialTeams: TeamRank[]
}) {
    const router = useRouter();
    const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({});

    // SSE Refresh Sync
    useEffect(() => {
        const eventSource = new EventSource(`/api/quiz/${quiz.slug}/stream`);

        const handleUpdate = () => {
            // When ANY team advances, requests a hint, joins, leaves, we refresh the dashboard
            router.refresh();
        };

        // We listen to everything relevant to progress
        eventSource.addEventListener("team_advanced", handleUpdate);
        eventSource.addEventListener("hint_used", handleUpdate);
        eventSource.addEventListener("team_created", handleUpdate);
        eventSource.addEventListener("player_approved", handleUpdate);
        eventSource.addEventListener("player_left", handleUpdate);

        return () => {
            eventSource.close();
        };
    }, [quiz.slug, router]);

    async function handleStopQuiz() {
        if (!confirm("Сигурни ли сте, че искате да прекратите играта за всички?")) return;
        setLoadingObj(p => ({ ...p, stop: true }));
        await updateQuizStatus(quiz.id, "finished");
        setLoadingObj(p => ({ ...p, stop: false }));
    }

    // Helper to format time (not usually needed for display, but useful for debugging)
    function formatTime(epoch: number) {
        if (epoch === 0) return "---";
        const date = new Date(epoch);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        Класиране на живо: {quiz.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${quiz.status === 'active' ? 'bg-green-100 text-green-700' :
                            quiz.status === 'finished' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${quiz.status === 'active' ? 'bg-green-500 animate-pulse' :
                                quiz.status === 'finished' ? 'bg-gray-500' :
                                    'bg-yellow-500'
                                }`} />
                            {quiz.status === 'active' ? 'Активен' : quiz.status === 'finished' ? 'Приключил' : 'В изчакване'}
                        </span>
                        <span className="text-gray-500 text-sm font-bold">
                            Въпроси: {questions.length} | Отбори: {initialTeams.length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.refresh()}
                        className="p-2 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition"
                        title="Ръчно презареждане"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    {quiz.status !== "finished" && (
                        <button
                            onClick={handleStopQuiz}
                            disabled={loadingObj.stop}
                            className="bg-brand-red text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <StopCircle className="w-5 h-5" />
                            {loadingObj.stop ? "Прекратяване..." : "Прекрати играта"}
                        </button>
                    )}
                </div>
            </div>

            {/* Leaderboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Side: Top 3 & Full List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-brand-blue to-blue-800 rounded-3xl p-6 shadow-xl text-white">
                        <div className="flex items-center gap-2 mb-6">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-xl font-bold">Топ Отбори</h2>
                        </div>

                        <div className="space-y-4">
                            {initialTeams.slice(0, 3).map((team, idx) => (
                                <div key={team.id} className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            idx === 1 ? 'bg-gray-300 text-gray-800' :
                                                'bg-orange-400 text-orange-900'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg leading-tight">{team.name}</div>
                                            <div className="text-xs text-blue-200">Точки: {team.score}</div>
                                        </div>
                                    </div>
                                    {team.isFinished && <span title="Завършил"><CheckCircle className="w-5 h-5 text-green-400" /></span>}
                                </div>
                            ))}
                            {initialTeams.length === 0 && (
                                <div className="text-center text-blue-200 py-4 opacity-80">
                                    Няма отбори в играта.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Progress Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                                        <th className="p-4 font-bold uppercase tracking-wider">Ранг</th>
                                        <th className="p-4 font-bold uppercase tracking-wider">Отбор</th>
                                        <th className="p-4 font-bold uppercase tracking-wider">Прогрес</th>
                                        <th className="p-4 font-bold uppercase tracking-wider">Жокери</th>
                                        <th className="p-4 font-bold uppercase tracking-wider">Последен Верeн</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {initialTeams.map((team, idx) => (
                                        <tr key={team.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">#{idx + 1}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 text-lg">{team.name}</div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Users className="w-3 h-3" /> {team.members.length} членове
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {team.isFinished ? (
                                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
                                                        <CheckCircle className="w-4 h-4" /> Завършил
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-bold text-brand-blue bg-blue-50 px-3 py-1 rounded-lg">
                                                            {team.currentQuestion} / {questions.length}
                                                        </div>
                                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                                                            <div
                                                                className="h-full bg-brand-blue"
                                                                style={{ width: `${Math.min(100, Math.max(0, (team.score / questions.length) * 100))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-brand-orange bg-orange-50 inline-block px-3 py-1 rounded-lg text-sm">
                                                    {team.hintsUsed}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                                                    <Clock className="w-4 h-4" /> {formatTime(team.lastAnswerTime)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {initialTeams.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500 font-bold">
                                                Все още няма отбори.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
