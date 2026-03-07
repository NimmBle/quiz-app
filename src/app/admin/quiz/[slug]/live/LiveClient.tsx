"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Clock, CheckCircle2, StopCircle, RefreshCw, Trophy, Activity, ArrowLeft, Timer, Target, Zap } from "lucide-react";
import { updateQuizStatus } from "../edit/actions";
import Link from "next/link";

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
    quiz, questions, initialTeams, initialLiveCount
}: {
    quiz: { id: number, slug: string, status: string, name: string },
    questions: QuestionSlim[],
    initialTeams: TeamRank[],
    initialLiveCount: number
}) {
    const router = useRouter();
    const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({});
    const [liveCount, setLiveCount] = useState(initialLiveCount);

    // SSE Refresh Sync
    useEffect(() => {
        const eventSource = new EventSource(`/api/quiz/${quiz.slug}/stream`);

        const handleUpdate = () => {
            router.refresh();
        };

        const handlePresenceUpdate = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            setLiveCount(data.count);
        };

        eventSource.addEventListener("team_advanced", handleUpdate);
        eventSource.addEventListener("hint_used", handleUpdate);
        eventSource.addEventListener("team_created", handleUpdate);
        eventSource.addEventListener("player_approved", handleUpdate);
        eventSource.addEventListener("player_left", handleUpdate);
        eventSource.addEventListener("presence_update", handlePresenceUpdate);

        return () => {
            eventSource.close();
        };
    }, [quiz.slug, router]);

    async function handleUpdateStatus(status: "draft" | "lobby" | "active" | "finished") {
        setLoadingObj(p => ({ ...p, status: true }));
        await updateQuizStatus(quiz.id, status);
        router.refresh();
        setLoadingObj(p => ({ ...p, status: false }));
    }

    async function handleStopQuiz() {
        if (!confirm("Сигурни ли сте, че искате да прекратите играта за всички?")) return;
        await handleUpdateStatus("finished");
    }

    const statusConfig: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
        draft: { label: "Чернова", color: "bg-orange-50 text-brand-orange border-orange-200", icon: <Clock size={14} /> },
        lobby: { label: "Лоби", color: "bg-blue-50 text-brand-blue border-blue-200", icon: <Clock size={14} /> },
        active: { label: "На живо", color: "bg-green-50 text-brand-green border-green-200", icon: <Activity size={14} /> },
        finished: { label: "Завършен", color: "bg-gray-50 text-gray-500 border-gray-200", icon: <StopCircle size={14} /> },
    };

    function formatTime(epoch: number) {
        if (epoch === 0) return "--:--:--";
        const date = new Date(epoch);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }

    const finishedTeams = initialTeams.filter(t => t.isFinished).length;

    return (
        <div className="space-y-10 pb-20">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-4">
                    <Link 
                        href="/admin/dashboard" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Обратно към таблото</span>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                                {quiz.name}
                            </h1>
                            <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Live</span>
                        </div>
                        <p className="text-gray-500 font-medium">Мониторинг на прогреса в реално време</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.refresh()}
                        className="flex items-center gap-2 p-3 text-gray-500 hover:text-brand-blue bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                        title="Презареждане"
                    >
                        <RefreshCw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                    
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig[quiz.status]?.color || statusConfig.draft.color} font-black text-[10px] uppercase tracking-widest`}>
                            {statusConfig[quiz.status]?.icon || statusConfig.draft.icon}
                            <span>{statusConfig[quiz.status]?.label || statusConfig.draft.label}</span>
                        </div>
                        <select
                            disabled={loadingObj.status}
                            value={quiz.status}
                            onChange={(e) => handleUpdateStatus(e.target.value as "draft" | "lobby" | "active" | "finished")}
                            className="bg-gray-50 border-none text-sm font-bold text-gray-700 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <option value="draft">Чернова</option>
                            <option value="lobby">Лоби (Очакване)</option>
                            <option value="active">Активен (Игра)</option>
                            <option value="finished">Завършен</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <LiveStatCard 
                    label="Онлайн" 
                    value={liveCount} 
                    icon={<Users className="text-brand-blue animate-pulse" />}
                    sublabel="Активни сесии"
                />
                <LiveStatCard 
                    label="Статус" 
                    value={quiz.status === 'active' ? 'Активен' : quiz.status === 'finished' ? 'Завършен' : 'Лоби'} 
                    icon={<Activity className={quiz.status === 'active' ? 'text-brand-green animate-pulse' : 'text-gray-400'} />}
                    sublabel={quiz.status === 'active' ? 'Играта тече' : 'В очакване'}
                />
                <LiveStatCard 
                    label="Отбори" 
                    value={initialTeams.length} 
                    icon={<Trophy className="text-brand-orange" />}
                    sublabel={`${finishedTeams} завършили`}
                />
                <LiveStatCard 
                    label="Въпроси" 
                    value={questions.length} 
                    icon={<Target className="text-brand-blue" />}
                    sublabel="Общо в куиза"
                />
                <LiveStatCard 
                    label="Активност" 
                    value={initialTeams.length > 0 ? formatTime(Math.max(...initialTeams.map(t => t.lastAnswerTime))) : '--:--'} 
                    icon={<Clock className="text-brand-red" />}
                    sublabel="Последен отговор"
                />
            </div>

            {/* Leaderboard Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left: Podium & Top Teams */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-brand-dark rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        {/* Decorative Background Icon */}
                        <Trophy size={160} className="absolute -right-8 -bottom-8 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <Trophy size={24} className="text-brand-orange" />
                                </div>
                                <h2 className="text-xl font-black">Топ 3 Отбора</h2>
                            </div>

                            <div className="space-y-4">
                                {initialTeams.slice(0, 3).map((team, idx) => (
                                    <div 
                                        key={team.id} 
                                        className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md flex justify-between items-center group/item hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg ${
                                                idx === 0 ? 'bg-brand-orange text-brand-dark rotate-3' :
                                                idx === 1 ? 'bg-gray-300 text-gray-800 -rotate-3' :
                                                'bg-[#cd7f32] text-white rotate-1'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="font-black text-lg group-hover/item:text-brand-orange transition-colors">{team.name}</div>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                        <Zap size={10} className="text-brand-orange" />
                                                        <span>{team.score} точки</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 mt-2 pl-1">
                                                        {team.members.map((name, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-white/50">
                                                                <div className="w-1 h-1 rounded-full bg-brand-orange/40" />
                                                                <span>{name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {team.isFinished && <CheckCircle2 className="w-6 h-6 text-brand-green" />}
                                    </div>
                                ))}
                                {initialTeams.length === 0 && (
                                    <div className="text-center py-10 opacity-30 font-bold uppercase tracking-widest text-sm">
                                        Няма отбори
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Full Leaderboard Table */}
                <div className="xl:col-span-8">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Пълен списък</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-widest">
                                <Timer size={14} />
                                <span>Обновява се на живо</span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
                                        <th className="px-8 py-5">Ранг</th>
                                        <th className="px-8 py-5">Отбор / Членове</th>
                                        <th className="px-8 py-5">Прогрес</th>
                                        <th className="px-8 py-5">Използвани жокери</th>
                                        <th className="px-8 py-5 text-right">Време</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {initialTeams.map((team, idx) => (
                                        <tr key={team.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                            <td className="px-8 py-6">
                                                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-500 text-xs group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                                    #{idx + 1}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-gray-900 text-lg group-hover:text-brand-blue transition-colors">{team.name}</div>
                                                <div className="flex flex-col gap-1 mt-2">
                                                    {team.members.map((name, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/20" />
                                                            <span>{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {team.isFinished ? (
                                                    <span className="inline-flex items-center gap-2 bg-green-50 text-brand-green px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                                        <CheckCircle2 size={12} />
                                                        <span>Завършил</span>
                                                    </span>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-brand-blue uppercase tracking-widest">
                                                            <span>Въпрос {team.currentQuestion} / {questions.length}</span>
                                                            <span>{Math.round((team.score / questions.length) * 100)}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-brand-blue transition-all duration-500 shadow-[0_0_10px_rgba(29,101,166,0.3)]"
                                                                style={{ width: `${Math.min(100, Math.max(0, (team.score / questions.length) * 100))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs ${
                                                    team.hintsUsed > 0 ? 'bg-orange-50 text-brand-orange border border-orange-100' : 'bg-gray-50 text-gray-300'
                                                }`}>
                                                    <Zap size={14} />
                                                    <span>{team.hintsUsed}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-sm font-bold text-gray-400">
                                                    <Clock size={14} className="text-gray-300" />
                                                    <span>{formatTime(team.lastAnswerTime)}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {initialTeams.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Activity size={40} className="text-gray-200" />
                                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">Няма активни отбори</span>
                                                </div>
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

function LiveStatCard({ label, value, icon, sublabel }: { label: string, value: string | number, icon: React.ReactNode, sublabel: string }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100/50">
                {icon}
            </div>
            <div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</div>
                <div className="text-2xl font-black text-gray-900 tracking-tight">{value}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{sublabel}</div>
            </div>
        </div>
    );
}
