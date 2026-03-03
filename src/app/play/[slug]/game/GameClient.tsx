"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAnswer, requestHint } from "./actions";
import { HelpCircle, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import AzMogaTitle from "@/components/AzMogaTitle";

type SafeQuestion = {
    id: number;
    position: number;
    text: string | null;
    imageUrl: string | null;
};

export default function GameClient({
    quiz, team, isFinished, totalQuestions, currentQuestion, initialHint
}: {
    quiz: { id: number, slug: string, maxHints: number, name: string },
    me: { id: number, name: string, isCaptain: boolean },
    team: { id: number, name: string, currentQuestion: number, hintsUsed: number },
    isFinished: boolean,
    totalQuestions: number,
    currentQuestion?: SafeQuestion,
    initialHint?: string | null
}) {
    const router = useRouter();
    const [answerText, setAnswerText] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [hintLoading, setHintLoading] = useState(false);

    // Track which question we are currently displaying to know when to wipe local temporary state
    const [prevQuestionId, setPrevQuestionId] = useState<number | undefined>(currentQuestion?.id);

    const [revealedHint, setRevealedHint] = useState<string | null>(initialHint || null);
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    // Derived State pattern: if the question changed from the server, clear local inputs.
    if (currentQuestion?.id !== prevQuestionId) {
        setPrevQuestionId(currentQuestion?.id);
        setRevealedHint(initialHint || null);
        setAnswerText("");
        setErrorMsg("");
        setShowSuccessAnim(false);
    }

    // SSE Subscription
    useEffect(() => {
        const eventSource = new EventSource(`/api/quiz/${quiz.slug}/stream`);

        const handleUpdate = () => {
            // For safety, any time a broadcast hits, ask Next.js to pull the latest RSC payload
            router.refresh();
        };

        const handleTeamAdvanced = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === team.id) {
                // Another player on our team answered correctly
                setShowSuccessAnim(true);
                setTimeout(() => {
                    handleUpdate();
                }, 1000);
            }
        };

        const handleHintUsed = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === team.id && data.questionId === currentQuestion?.id) {
                setRevealedHint(data.hintText);
                handleUpdate(); // To sync the usage count in the topbar
            }
        };

        eventSource.addEventListener("quiz_finished", handleUpdate);
        eventSource.addEventListener("team_advanced", handleTeamAdvanced);
        eventSource.addEventListener("hint_used", handleHintUsed);

        return () => {
            eventSource.close();
        };
    }, [quiz.slug, team.id, currentQuestion?.id, router]);

    // Actions
    async function handleAnswerSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentQuestion || !answerText.trim() || loading || showSuccessAnim) return;

        setErrorMsg("");
        setLoading(true);

        const res = await submitAnswer(quiz.id, currentQuestion.id, currentQuestion.position, answerText);

        if (res.error) {
            setErrorMsg(res.error);
        } else if (res.isCorrect) {
            // Success! The SSE event 'team_advanced' will trigger the actual route refresh for everyone,
            // but since we initiated it, we can trigger the animation immediately
            setShowSuccessAnim(true);
            setTimeout(() => {
                router.refresh(); // Fetch next question
            }, 1000);
        } else {
            setErrorMsg("Грешен отговор. Опитайте пак!");
        }

        setLoading(false);
    }

    async function handleUseHint() {
        if (!currentQuestion || hintLoading || revealedHint) return;

        if (team.hintsUsed >= quiz.maxHints) {
            alert("Нямате повече жокери!");
            return;
        }

        if (!confirm(`Сигурни ли сте, че искате да използвате жокер? (Остават ви ${quiz.maxHints - team.hintsUsed})`)) {
            return;
        }

        setHintLoading(true);
        const res = await requestHint(quiz.id, currentQuestion.id);

        if (res.error) {
            alert(res.error);
        } else if (res.success && res.hint) {
            setRevealedHint(res.hint);
        }

        setHintLoading(false);
    }

    // --- Views ---

    if (isFinished) {
        const organicallyFinished = team.currentQuestion > totalQuestions;

        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center p-6 justify-center text-center">
                <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-2xl w-full">
                    {organicallyFinished ? (
                        <>
                            <CheckCircle className="w-24 h-24 text-brand-green mx-auto mb-6" />
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">Поздравления!</h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Отбор <strong className="text-brand-blue">{team.name}</strong> завърши всички въпроси успешно.
                            </p>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-24 h-24 text-brand-orange mx-auto mb-6" />
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">Играта приключи!</h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Администраторът прекрати играта. Вашият отбор достигна до въпрос {team.currentQuestion} от {totalQuestions}.
                            </p>
                        </>
                    )}
                    <p className="text-gray-500 font-bold mb-4">
                        Използвани жокери: {team.hintsUsed} / {quiz.maxHints}
                    </p>
                    <div className="p-4 bg-brand-orange/10 text-brand-orange rounded-xl font-bold">
                        Моля, изчакайте крайното класиране от администратора.
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) return null; // Fallback safety

    return (
        <div className="flex flex-col h-[100dvh] bg-brand-dark">
            {/* Top Navigation Bar */}
            <div className="bg-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center shadow-md z-10 gap-4">
                <div className="flex items-center gap-2">
                    <div className="scale-75 origin-left flex items-center">
                        <AzMogaTitle />
                    </div>
                    <span className="text-gray-400 font-bold hidden sm:inline -ml-4">|</span>
                    <span className="font-bold text-white bg-brand-blue px-3 py-1 rounded-full text-sm">
                        Отбор {team.name}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Прогрес</div>
                        <div className="text-xl font-bold text-brand-red">
                            {currentQuestion.position} / {totalQuestions}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Жокери</div>
                        <div className="text-xl font-bold text-brand-orange">
                            {quiz.maxHints - team.hintsUsed}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 overflow-y-auto p-4 flex justify-center pb-8">
                <div className="w-full max-w-4xl flex flex-col mt-4">

                    {/* Question Card */}
                    <div className={`bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-500 ${showSuccessAnim ? 'scale-95 opacity-50 blur-sm' : 'scale-100 opacity-100'}`}>

                        {/* Image Section */}
                        {currentQuestion.imageUrl && (
                            <div className="w-full bg-gray-50 border-b border-gray-100 p-4 flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={currentQuestion.imageUrl}
                                    alt="Изображение към въпроса"
                                    className="max-h-80 object-contain rounded-xl shadow-sm"
                                />
                            </div>
                        )}

                        {/* Text Section */}
                        <div className="p-8 md:p-12">
                            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-8">
                                {currentQuestion.text}
                            </h2>

                            {/* Hint Section */}
                            <div className="mt-8 border-t border-gray-100 pt-8">
                                {revealedHint ? (
                                    <div className="bg-orange-50 border-l-4 border-brand-orange p-4 rounded-r-xl">
                                        <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider mb-1">
                                            <HelpCircle className="w-4 h-4" /> Жокер
                                        </div>
                                        <p className="text-gray-800 text-lg leading-relaxed">
                                            {revealedHint}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleUseHint}
                                        disabled={hintLoading || (team.hintsUsed >= quiz.maxHints)}
                                        className="flex items-center gap-2 text-brand-orange font-bold hover:bg-orange-50 px-4 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        <HelpCircle className="w-5 h-5" />
                                        {hintLoading ? "Зареждане..." : "Използвай жокер"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Answer Input Bar */}
            <div className="bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-3 sm:p-6 z-20 shrink-0">
                <div className="max-w-4xl mx-auto">
                    {errorMsg && (
                        <div className="mb-3 sm:mb-4 flex items-center justify-center gap-2 text-brand-red font-bold bg-red-50 p-2 sm:p-3 rounded-xl animate-shake text-sm sm:text-base">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /> {errorMsg}
                        </div>
                    )}

                    {showSuccessAnim ? (
                        <div className="flex items-center justify-center gap-2 sm:gap-3 bg-brand-green text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl font-bold sm:text-xl h-14 sm:h-16 w-full shadow-inner">
                            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" /> Правилен отговор!
                        </div>
                    ) : (
                        <form onSubmit={handleAnswerSubmit} className="flex gap-2 sm:gap-4 h-14 sm:h-16 relative">
                            <input
                                type="text"
                                value={answerText}
                                onChange={e => setAnswerText(e.target.value)}
                                placeholder="Вашият отговор..."
                                className="flex-1 min-w-0 bg-gray-100 border-2 border-transparent focus:border-brand-blue focus:bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 font-bold text-lg sm:text-xl outline-none transition-all text-gray-800"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !answerText.trim()}
                                className="h-full px-4 sm:px-8 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl sm:rounded-2xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2 text-base sm:text-lg whitespace-nowrap"
                            >
                                {loading ? "..." : <span className="hidden sm:inline">Готово</span>} <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
