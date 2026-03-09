"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAnswer, requestHint } from "./actions";
import { approvePlayer, rejectPlayer } from "../teams/actions";
import { HelpCircle, ChevronRight, CheckCircle, AlertCircle, Trophy, Target, Zap, Clock, Send, MessageSquareText, RefreshCw, UserPlus, X, Check } from "lucide-react";
import AzMogaTitle from "@/components/AzMogaTitle";

type SafeQuestion = {
    id: number;
    position: number;
    text: string | null;
    imageUrl: string | null;
};

type TeamWithDetails = {
    id: number;
    name: string;
    currentQuestion: number;
    hintsUsed: number;
    members: { id: number; name: string }[];
    joinRequests: { id: number; name: string }[];
};

export default function GameClient({
    quiz, me, team, isFinished, totalQuestions, currentQuestion, initialHint
}: {
    quiz: { id: number, slug: string, maxHints: number, name: string },
    me: { id: number, name: string, isCaptain: boolean },
    team: TeamWithDetails,
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
    const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({});

    const [prevQuestionId, setPrevQuestionId] = useState<number | undefined>(currentQuestion?.id);
    const [revealedHint, setRevealedHint] = useState<string | null>(initialHint || null);
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    if (currentQuestion?.id !== prevQuestionId) {
        setPrevQuestionId(currentQuestion?.id);
        setRevealedHint(initialHint || null);
        setAnswerText("");
        setErrorMsg("");
        setShowSuccessAnim(false);
    }

    useEffect(() => {
        const eventSource = new EventSource(`/api/quiz/${quiz.slug}/stream`);
        const handleUpdate = () => router.refresh();

        const handleTeamAdvanced = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === team.id) {
                setShowSuccessAnim(true);
                setTimeout(() => {
                    handleUpdate();
                }, 1200);
            }
        };

        const handleHintUsed = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === team.id && data.questionId === currentQuestion?.id) {
                setRevealedHint(data.hintText);
                handleUpdate();
            }
        };

        const handleJoinEvents = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === team.id) {
                handleUpdate();
            }
        };

        eventSource.addEventListener("quiz_finished", handleUpdate);
        eventSource.addEventListener("team_advanced", handleTeamAdvanced);
        eventSource.addEventListener("hint_used", handleHintUsed);
        eventSource.addEventListener("join_requested", handleJoinEvents);
        eventSource.addEventListener("join_cancelled", handleJoinEvents);
        eventSource.addEventListener("player_approved", handleJoinEvents);
        eventSource.addEventListener("player_rejected", handleJoinEvents);
        eventSource.addEventListener("player_left", handleJoinEvents);

        eventSource.addEventListener("team_deleted", (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === team.id) {
                window.location.href = `/play/${quiz.slug}`;
            }
        });

        eventSource.addEventListener("player_deleted", (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.playerId === me.id) {
                window.location.href = `/play/${quiz.slug}`;
            }
        });

        return () => eventSource.close();
    }, [quiz.slug, team.id, currentQuestion?.id, router, me.id]);

    async function handleAnswerSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!currentQuestion || !answerText.trim() || loading || showSuccessAnim) return;
        setErrorMsg("");
        setLoading(true);
        const res = await submitAnswer(quiz.id, currentQuestion.id, currentQuestion.position, answerText);
        if (res.error) {
            setErrorMsg(res.error);
        } else if (res.isCorrect) {
            setShowSuccessAnim(true);
            setTimeout(() => router.refresh(), 1200);
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
        if (res.error) alert(res.error);
        else if (res.success && res.hint) setRevealedHint(res.hint);
        setHintLoading(false);
    }

    async function handleApprove(playerId: number) {
        setLoadingObj(p => ({ ...p, [`app-${playerId}`]: true }));
        await approvePlayer(quiz.id, playerId);
        setLoadingObj(p => ({ ...p, [`app-${playerId}`]: false }));
        router.refresh();
    }

    async function handleReject(playerId: number) {
        setLoadingObj(p => ({ ...p, [`rej-${playerId}`]: true }));
        await rejectPlayer(quiz.id, playerId);
        setLoadingObj(p => ({ ...p, [`rej-${playerId}`]: false }));
        router.refresh();
    }

    const PageBackground = () => (
        <>
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand-blue/15 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[4000ms] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-brand-green/10 rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[5000ms] delay-700 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#0A1118]/80 pointer-events-none" />
        </>
    );

    if (isFinished) {
        const organicallyFinished = team.currentQuestion > totalQuestions;
        return (
            <div className="min-h-screen bg-[#0A1118] flex flex-col items-center p-4 sm:p-6 justify-center text-center relative overflow-hidden font-sans text-white">
                <PageBackground />

                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-10 sm:p-16 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] max-w-2xl w-full relative z-10 flex flex-col items-center">
                    {organicallyFinished ? (
                        <>
                            <div className="w-24 h-24 sm:w-36 sm:h-36 bg-brand-green/20 rounded-full border border-brand-green/30 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(44,150,68,0.2)] animate-pulse">
                                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-brand-green" />
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">Браво!</h1>
                            <p className="text-lg sm:text-xl font-medium text-white/70 mb-10">
                                Отбор <span className="text-white bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 ml-1 font-semibold">{team.name}</span> завърши успешно!
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-24 h-24 sm:w-36 sm:h-36 bg-brand-orange/20 rounded-full border border-brand-orange/30 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(241,146,32,0.2)]">
                                <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-brand-orange" />
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Играта Приключи</h1>
                            <p className="text-lg sm:text-xl font-medium text-white/70 mb-10 leading-relaxed">
                                Администраторът прекрати играта. <br />
                                Достигнахте до въпрос <span className="text-brand-orange font-bold">{team.currentQuestion}</span> от <span className="text-brand-blue font-bold">{totalQuestions}</span>.
                            </p>
                        </>
                    )}

                    <div className="mb-10 w-full">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-sm inline-block mx-auto">
                            <div className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2 px-8">Използвани Жокери</div>
                            <div className="text-3xl sm:text-4xl font-bold text-brand-orange">{team.hintsUsed} / {quiz.maxHints}</div>
                        </div>
                    </div>

                    <div className="p-5 w-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue/90 rounded-2xl font-medium uppercase tracking-widest text-xs sm:text-sm animate-pulse leading-tight">
                        Очаквайте крайното класиране!
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="flex flex-col h-[100dvh] bg-[#0A1118] overflow-hidden selection:bg-brand-blue selection:text-white font-sans text-white relative">
            <PageBackground />

            {/* Elegant Glass Topbar */}
            <div className="p-3 sm:p-6 flex flex-col sm:flex-row gap-4 z-30 relative">
                <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:p-5 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="transform scale-[0.6] xs:scale-[0.7] sm:scale-90 origin-left shrink-0">
                            <AzMogaTitle className="text-[24px]" />
                        </div>
                        <div className="h-6 w-px bg-white/20 hidden sm:block" />
                        <div className="hidden sm:flex flex-col min-w-0">
                            <span className="text-[9px] font-semibold text-white/70 uppercase tracking-[0.2em]">Вашият отбор</span>
                            <span className="font-bold text-white tracking-wide truncate max-w-[150px]">{team.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-10">
                        <div className="flex flex-col items-end sm:items-center">
                            <span className="text-[7px] sm:text-[10px] font-semibold text-white/70 uppercase tracking-[0.2em] mb-1 sm:mb-1.5">Жокери</span>
                            <div className={`px-3 py-0.5 sm:px-4 sm:py-1 rounded-lg border font-bold shadow-sm text-[10px] sm:text-base ${team.hintsUsed >= quiz.maxHints ? 'bg-white/10 text-white/40 border-white/20' : 'bg-brand-orange/30 text-white border-brand-orange/50'}`}>
                                {quiz.maxHints - team.hintsUsed}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Interactive Area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-48 sm:pb-80 relative z-20">
                <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:gap-8 pt-2 sm:pt-4">

                    {/* Question Card */}
                    <div className={`relative transition-all duration-700 pb-2 sm:pb-4 ${showSuccessAnim ? 'scale-95 opacity-0 -translate-y-8' : 'scale-100 opacity-100 translate-y-0'}`}>
                        <div className={`bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col ${!showSuccessAnim ? 'animate-in fade-in zoom-in-95 duration-500' : ''}`}>

                            {/* Image Asset Container */}
                            {currentQuestion.imageUrl ? (
                                <div className="p-4 sm:p-8 bg-black/40 border-b border-white/10 flex items-center justify-center">
                                    <div className="bg-white/5 border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner p-1 sm:p-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={currentQuestion.imageUrl}
                                            alt="Visual challenge"
                                            className="w-full h-auto max-h-[38vh] sm:max-h-[45vh] object-contain mx-auto rounded-lg sm:rounded-xl"
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {/* Question Text */}
                            <div className="p-6 sm:p-14 text-center relative overflow-hidden flex-1 flex items-center justify-center min-h-[140px] sm:min-h-[260px]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.03] pointer-events-none hidden sm:block">
                                    <MessageSquareText size={240} />
                                </div>
                                <h2 className="text-xl xs:text-2xl sm:text-5xl font-bold leading-snug tracking-tight relative z-10 text-white">
                                    {currentQuestion.text}
                                </h2>
                            </div>

                            {/* Hint Section */}
                            <div className="px-4 pb-4 sm:px-12 sm:pb-10 flex justify-center">
                                {revealedHint ? (
                                    <div className="bg-brand-orange/20 border border-brand-orange/30 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-inner w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-2 text-brand-orange font-bold text-[9px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-3">
                                            <Zap className="w-3 h-3 sm:w-4 h-4" /> Жокер:
                                        </div>
                                        <p className="text-white text-base sm:text-xl font-semibold leading-relaxed">
                                            {revealedHint}
                                        </p>
                                    </div>
                                ) : me.isCaptain ? (
                                    <button
                                        onClick={handleUseHint}
                                        disabled={hintLoading || (team.hintsUsed >= quiz.maxHints)}
                                        className="flex items-center justify-center w-full sm:w-auto gap-2 sm:gap-3 text-brand-orange hover:text-white bg-white/10 hover:bg-brand-orange/80 border border-brand-orange/50 px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:grayscale group shadow-[0_4px_14px_rgba(241,146,32,0.2)] hover:shadow-[0_6px_20px_rgba(241,146,32,0.4)] hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-sm"
                                    >
                                        <HelpCircle className="w-4 h-4 sm:w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        <span>{hintLoading ? "..." : "Искам жокер!"}</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 sm:gap-3 text-white/40 font-medium text-[9px] sm:text-xs uppercase tracking-widest bg-white/5 px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-white/5">
                                        <Zap className="w-3 h-3 sm:w-4 h-4 animate-pulse" />
                                        <span>Обсъдете жокер с капитана</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Captain's Admin Panel (During Game) */}
                    {me.isCaptain && team.joinRequests.length > 0 && (
                        <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-[10px] sm:text-sm font-bold text-brand-orange uppercase tracking-[0.2em] flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 sm:w-5 h-5" /> Нови заявки
                                </h3>
                                <span className="bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{team.joinRequests.length}</span>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {team.joinRequests.map(r => (
                                    <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5 gap-3 sm:gap-4 backdrop-blur-md">
                                        <span className="font-bold text-white text-sm sm:text-base break-words w-full sm:w-auto">{r.name}</span>
                                        <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                                            <button
                                                onClick={() => handleReject(r.id)}
                                                disabled={loadingObj[`app-${r.id}`] || loadingObj[`rej-${r.id}`]}
                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/20"
                                            >
                                                <X className="w-4 h-4 sm:w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(r.id)}
                                                disabled={loadingObj[`app-${r.id}`] || loadingObj[`rej-${r.id}`] || team.members.length >= 5}
                                                className="flex-1 sm:flex-none bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border border-brand-green/30 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <Check size={12} className="sm:w-[14px] sm:h-[14px]" /> Приеми
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Answer Action Bar - Glassmorphic Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-8 bg-gradient-to-t from-[#0A1118] via-[#0A1118]/95 to-transparent pt-12 sm:pt-32 z-40">
                <div className="max-w-4xl mx-auto">
                    {errorMsg && (
                        <div className="mb-2 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3 text-white font-bold bg-red-500/20 p-3 sm:p-4 rounded-xl border border-red-500/40 text-xs sm:text-base animate-shake backdrop-blur-md">
                            <AlertCircle className="w-4 h-4 sm:w-5 h-5 text-red-400" /> {errorMsg}
                        </div>
                    )}

                    <div className="relative">
                        {showSuccessAnim ? (
                            <div className="flex items-center justify-center gap-4 bg-brand-green/30 text-white border border-brand-green/50 p-4 sm:p-8 rounded-xl sm:rounded-2xl font-bold text-xl sm:text-4xl shadow-[0_0_40px_rgba(44,150,68,0.4)] animate-in zoom-in-95 duration-300 backdrop-blur-xl">
                                <CheckCircle className="w-6 h-6 sm:w-12 sm:h-12 text-brand-green" /> ПРАВИЛНО!
                            </div>
                        ) : me.isCaptain ? (
                            <form onSubmit={handleAnswerSubmit} className="flex flex-row gap-2 relative bg-white/10 p-1.5 sm:p-3 rounded-2xl sm:rounded-[2rem] border border-white/20 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={answerText}
                                        onChange={e => setAnswerText(e.target.value)}
                                        placeholder="Отговор..."
                                        className="w-full bg-transparent px-4 sm:px-8 py-3 sm:py-5 font-bold text-base sm:text-2xl outline-none transition-all text-white placeholder:text-white/50"
                                        disabled={loading}
                                        spellCheck="false"
                                        autoComplete="off"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !answerText.trim()}
                                    className="bg-brand-green hover:bg-green-500 text-white font-bold py-3 sm:py-5 px-5 sm:px-12 rounded-xl sm:rounded-[1.5rem] shadow-[0_4px_14px_0_rgba(44,150,68,0.5)] hover:shadow-[0_6px_20px_rgba(44,150,68,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-xl uppercase tracking-widest disabled:opacity-50 shrink-0"
                                >
                                    <span className="hidden xs:inline">{loading ? "..." : "ИЗПРАТИ"}</span>
                                    <span className="xs:hidden">{loading ? "..." : ""}</span>
                                    {!loading && <Send size={18} className="sm:w-6 sm:h-6" />}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-4 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-blue/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-pulse">
                                    <MessageSquareText className="w-5 h-5 sm:w-6 sm:h-6 text-brand-blue" />
                                </div>
                                <h3 className="text-base sm:text-xl font-bold text-white tracking-wide">
                                    Изчаква се отговор от капитана
                                </h3>
                                <p className="text-[10px] sm:text-sm text-white/60 mt-1 sm:mt-2 font-medium">
                                    Обсъждайте и помагайте на своя отбор.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-6px); }
                    75% { transform: translateX(6px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}
