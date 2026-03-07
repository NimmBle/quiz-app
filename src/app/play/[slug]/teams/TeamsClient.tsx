"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTeam, requestToJoin, cancelJoinRequest, approvePlayer, rejectPlayer, refreshPlayerSession, leaveTeam } from "./actions";
import { Users, Shield, Clock, Check, X, Plus, LogOut, ArrowRight, UserPlus, Info } from "lucide-react";
import AzMogaTitle from "@/components/AzMogaTitle";

type TeamWithStats = {
    id: number;
    name: string;
    captainPlayerId: number | null;
    members: { id: number; name: string }[];
    joinRequests: { id: number; name: string }[];
};

type Me = {
    id: number;
    name: string;
    teamId: number | null;
    requestedTeamId: number | null;
    isCaptain: boolean;
};

export default function TeamsClient({ quiz, me, initialTeams }: { quiz: { id: number, slug: string }; me: Me; initialTeams: TeamWithStats[] }) {
    const router = useRouter();
    const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({});
    const [newTeamName, setNewTeamName] = useState("");
    const [errorLine, setErrorLine] = useState("");

    useEffect(() => {
        const eventSource = new EventSource(`/api/quiz/${quiz.slug}/stream`);
        const handleUpdate = async () => {
            if (!me.teamId && me.requestedTeamId) {
                await refreshPlayerSession(quiz.id);
            }
            if (me.teamId) {
                await refreshPlayerSession(quiz.id);
            }
            router.refresh();
        };
        eventSource.addEventListener("team_created", handleUpdate);
        eventSource.addEventListener("join_requested", handleUpdate);
        eventSource.addEventListener("join_cancelled", handleUpdate);
        eventSource.addEventListener("player_approved", handleUpdate);
        eventSource.addEventListener("player_rejected", handleUpdate);
        eventSource.addEventListener("player_left", handleUpdate);

        eventSource.addEventListener("team_deleted", (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.teamId === me.teamId || data.teamId === me.requestedTeamId) {
                handleUpdate();
            } else {
                router.refresh();
            }
        });

        eventSource.addEventListener("player_deleted", (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.playerId === me.id) {
                window.location.href = `/play/${quiz.slug}`;
            } else if (data.teamId === me.teamId) {
                handleUpdate();
            }
        });
        eventSource.addEventListener("quiz_started", () => {
            if (me.teamId) {
                router.push(`/play/${quiz.slug}/game`);
            } else {
                router.refresh();
            }
        });
        return () => {
            eventSource.close();
        };
    }, [quiz.slug, quiz.id, me.teamId, me.requestedTeamId, router]);

    async function handleCreateTeam(e: React.FormEvent) {
        e.preventDefault();
        setErrorLine("");
        setLoadingObj(p => ({ ...p, create: true }));
        const res = await createTeam(quiz.id, newTeamName);
        if (!res.success) {
            setErrorLine(res.error || "Възникна грешка при създаването на отбора.");
        } else {
            router.refresh();
        }
        setLoadingObj(p => ({ ...p, create: false }));
    }

    async function handleRequestJoin(teamId: number) {
        setErrorLine("");
        setLoadingObj(p => ({ ...p, [`req-${teamId}`]: true }));
        const res = await requestToJoin(quiz.id, teamId);
        if (!res.success) {
            setErrorLine(res.error || "Грешка при заявката.");
        } else {
            router.refresh();
        }
        setLoadingObj(p => ({ ...p, [`req-${teamId}`]: false }));
    }

    async function handleCancelRequest() {
        setErrorLine("");
        setLoadingObj(p => ({ ...p, cancel: true }));
        const res = await cancelJoinRequest(quiz.id);
        if (!res.success) {
            setErrorLine(res.error || "Грешка при отмяна.");
        } else {
            router.refresh();
        }
        setLoadingObj(p => ({ ...p, cancel: false }));
    }

    async function handleApprove(playerId: number) {
        setErrorLine("");
        setLoadingObj(p => ({ ...p, [`app-${playerId}`]: true }));
        const res = await approvePlayer(quiz.id, playerId);
        if (!res.success) {
            setErrorLine(res.error || "Грешка при одобряване.");
        } else {
            router.refresh();
        }
        setLoadingObj(p => ({ ...p, [`app-${playerId}`]: false }));
    }

    async function handleReject(playerId: number) {
        setErrorLine("");
        setLoadingObj(p => ({ ...p, [`rej-${playerId}`]: true }));
        const res = await rejectPlayer(quiz.id, playerId);
        if (!res.success) {
            setErrorLine(res.error || "Грешка при отхвърляне.");
        } else {
            router.refresh();
        }
        setLoadingObj(p => ({ ...p, [`rej-${playerId}`]: false }));
    }

    async function handleLeaveTeam() {
        if (!confirm("Сигурни ли сте, че искате да напуснете този отбор?")) return;
        setErrorLine("");
        setLoadingObj(p => ({ ...p, leave: true }));
        const res = await leaveTeam(quiz.id);
        if (!res.success) {
            setErrorLine(res.error || "Грешка при напускане.");
        } else {
            router.refresh();
        }
        setLoadingObj(p => ({ ...p, leave: false }));
    }

    const PageBackground = () => (
        <>
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[4000ms] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-green/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[5000ms] delay-700 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-[#0A1118]/80 to-[#0A1118] pointer-events-none" />
        </>
    );

    if (me.teamId) {
        const myTeam = initialTeams.find(t => t.id === me.teamId);
        return (
            <div className="min-h-screen bg-[#0A1118] p-4 sm:p-8 flex flex-col items-center relative overflow-hidden font-sans text-white">
                <PageBackground />

                <div className="mt-6 mb-10 relative z-10 flex justify-center w-full">
                    <AzMogaTitle className="text-[28px] sm:text-[40px] drop-shadow-xl" />
                </div>

                <div className="w-full max-w-3xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col">
                    <div className="p-8 sm:p-12 border-b border-white/10 flex flex-col items-center text-center relative bg-gradient-to-b from-white/[0.05] to-transparent">
                        <div className="absolute top-6 left-6 w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hidden sm:flex">
                            <Users className="text-white/70 w-5 h-5" />
                        </div>
                        <h2 className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-[0.3em] mb-3">Вашият Отбор</h2>
                        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight px-4">{myTeam?.name}</h1>
                        {me.isCaptain && (
                            <div className="mt-6 inline-flex items-center gap-2 bg-brand-orange/20 border border-brand-orange/40 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest text-brand-orange shadow-lg">
                                <Shield className="w-4 h-4" /> Капитан
                            </div>
                        )}
                    </div>

                    <div className="p-6 sm:p-10 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h3 className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wider">Членове на отбора</h3>
                                <span className="text-xs font-medium bg-white/20 px-4 py-1.5 rounded-full border border-white/20 text-white">{myTeam?.members.length} / 5</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {myTeam?.members.map((m, idx) => {
                                    const memberColors = [
                                        "bg-brand-blue shadow-brand-blue/20",
                                        "bg-brand-red shadow-brand-red/20",
                                        "bg-brand-orange shadow-brand-orange/20",
                                        "bg-purple-600 shadow-purple-500/20",
                                        "bg-brand-dark border border-white/10 shadow-black/40"
                                    ];
                                    const colorClass = memberColors[idx % memberColors.length];

                                    return (
                                        <div key={m.id} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all shadow-sm">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-lg ${colorClass}`}>
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-white text-base truncate">{m.name} {m.id === me.id && <span className="text-white/60 text-sm">(Ти)</span>}</div>
                                                {m.id === myTeam.captainPlayerId && <div className="text-[10px] font-semibold text-brand-orange uppercase tracking-widest mt-0.5">Лидер</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {Array.from({ length: 5 - (myTeam?.members.length || 0) }).map((_, i) => (
                                    <div key={`empty-${i}`} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-dashed border-white/20">
                                        <div className="w-12 h-12 rounded-xl border border-dashed border-white/30 flex items-center justify-center shrink-0">
                                            <UserPlus className="w-5 h-5 text-white/40" />
                                        </div>
                                        <div className="font-medium text-white/40 italic text-sm">Свободно място...</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {me.isCaptain && myTeam!.joinRequests.length > 0 && (
                            <div className="bg-brand-orange/10 border border-brand-orange/20 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                <h3 className="text-xs font-semibold text-brand-orange uppercase tracking-wider mb-5 flex items-center gap-2 relative z-10">
                                    <Clock className="w-4 h-4" /> Чакащи одобрение
                                </h3>
                                <div className="space-y-3 relative z-10">
                                    {myTeam?.joinRequests.map(r => (
                                        <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#0A1118]/50 p-4 rounded-xl border border-white/5 gap-4">
                                            <span className="font-medium text-white text-sm sm:text-base break-words w-full sm:w-auto">{r.name}</span>
                                            <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                                                <button
                                                    onClick={() => handleReject(r.id)}
                                                    disabled={loadingObj[`app-${r.id}`] || loadingObj[`rej-${r.id}`]}
                                                    className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/20"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(r.id)}
                                                    disabled={loadingObj[`app-${r.id}`] || loadingObj[`rej-${r.id}`] || myTeam.members.length >= 5}
                                                    className="flex-1 sm:flex-none bg-brand-green/20 hover:bg-brand-green/30 text-brand-green border border-brand-green/30 px-6 py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                                >
                                                    Приеми
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t border-white/5 space-y-6">
                            {me.isCaptain ? (
                                myTeam!.joinRequests.length > 0 ? (
                                    <div className="flex items-center justify-center gap-4 bg-brand-orange/10 border border-brand-orange/20 p-5 rounded-2xl">
                                        <div className="w-10 h-10 bg-brand-orange/20 rounded-full flex items-center justify-center animate-pulse shrink-0">
                                            <Users className="text-brand-orange w-5 h-5" />
                                        </div>
                                        <p className="font-medium text-brand-orange/90 text-sm">
                                            Прегледайте чакащите заявки...
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-4 bg-brand-green/10 border border-brand-green/20 p-5 rounded-2xl">
                                        <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center shrink-0">
                                            <Check className="text-brand-green w-5 h-5" />
                                        </div>
                                        <p className="font-medium text-brand-green/90 text-sm">
                                            Отборът е готов! Очаквайте старт.
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center justify-center gap-4 bg-brand-blue/10 border border-brand-blue/20 p-5 rounded-2xl">
                                    <div className="w-10 h-10 bg-brand-blue/20 rounded-full flex items-center justify-center animate-pulse shrink-0">
                                        <Clock className="text-brand-blue w-5 h-5" />
                                    </div>
                                    <p className="font-medium text-brand-blue/90 text-sm">
                                        Изчакване на останалите играчи...
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleLeaveTeam}
                                disabled={loadingObj.leave}
                                className="w-full flex items-center justify-center gap-2 py-4 text-white/40 font-medium text-xs uppercase tracking-wider rounded-xl hover:text-red-400 hover:bg-red-400/5 transition-all"
                            >
                                <LogOut size={16} /> Напусни отбора
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (me.requestedTeamId) {
        const requestedTeam = initialTeams.find(t => t.id === me.requestedTeamId);
        return (
            <div className="min-h-screen bg-[#0A1118] p-6 flex flex-col items-center justify-center relative overflow-hidden text-center font-sans text-white">
                <PageBackground />
                <div className="mb-12 relative z-10">
                    <AzMogaTitle className="text-[36px] sm:text-[48px] drop-shadow-xl" />
                </div>
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-10 sm:p-14 max-w-md w-full border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-orange/20 rounded-full border border-brand-orange/30 flex items-center justify-center mb-8 animate-pulse shadow-[0_0_40px_rgba(241,146,32,0.2)]">
                        <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-brand-orange" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">Очаквайте одобрение</h2>
                    <p className="text-white/50 font-medium mb-10 text-base leading-relaxed">
                        Изпратена заявка към: <br />
                        <span className="inline-block bg-white/10 text-white px-5 py-2 rounded-lg border border-white/10 mt-3 font-semibold shadow-inner">{requestedTeam?.name}</span>
                    </p>
                    <button
                        onClick={handleCancelRequest}
                        disabled={loadingObj.cancel}
                        className="w-full py-4 text-white/50 font-medium text-xs uppercase tracking-wider rounded-xl hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all"
                    >
                        {loadingObj.cancel ? "Отмяна..." : "Откажи заявката"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A1118] p-4 sm:p-8 flex flex-col items-center relative overflow-hidden font-sans text-white">
            <PageBackground />
            <div className="w-full max-w-6xl relative z-10">
                <div className="flex flex-col items-center mt-8 mb-12 sm:mb-16">
                    <div className="mb-8">
                        <AzMogaTitle className="text-[36px] sm:text-[56px] drop-shadow-2xl" />
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight text-center">
                        Избор на Отбор
                    </h1>
                    <p className="text-white/50 mt-4 text-sm sm:text-base max-w-lg text-center">Създайте нов отбор или се присъединете към вече съществуващ, за да участвате в играта.</p>
                </div>

                {errorLine && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-5 rounded-2xl mb-10 font-medium text-center shadow-lg text-sm sm:text-base animate-in fade-in max-w-2xl mx-auto">
                        {errorLine}
                    </div>
                )}

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] mb-12 sm:mb-16 max-w-3xl mx-auto">
                    <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-white/70 uppercase tracking-wider ml-1">
                                <Plus size={14} className="text-brand-blue" />
                                <span>Създай нов отбор</span>
                            </label>
                            <input
                                type="text"
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                placeholder="Въведете име на отбора..."
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:bg-white/10 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 outline-none transition-all font-medium text-lg placeholder:text-white/30 text-white"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loadingObj.create || !newTeamName.trim()}
                            className="bg-brand-blue hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl shadow-[0_4px_14px_0_rgba(29,101,166,0.39)] hover:shadow-[0_6px_20px_rgba(29,101,166,0.23)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 w-full sm:w-auto shrink-0"
                        >
                            <span>Създай</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-20">
                    {initialTeams.map(team => (
                        <div key={team.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all shadow-lg flex flex-col overflow-hidden group">
                            <div className="p-6 sm:p-8 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-6">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight truncate mr-4">{team.name}</h3>
                                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 group-hover:bg-brand-blue/20 group-hover:border-brand-blue/30 transition-colors shrink-0">
                                        <Users className="w-5 h-5 text-white/50 group-hover:text-brand-blue transition-colors" />
                                    </div>
                                </div>
                                
                                <div className="mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                                        <span className="text-white/50 text-xs font-medium uppercase tracking-wider">{team.members.length} / 5 играчи</span>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    {team.members.length >= 5 ? (
                                        <div className="w-full py-3.5 bg-white/5 text-white/30 font-medium text-xs uppercase tracking-wider rounded-xl border border-white/5 text-center">Отборът е пълен</div>
                                    ) : (
                                        <button
                                            onClick={() => handleRequestJoin(team.id)}
                                            disabled={loadingObj[`req-${team.id}`]}
                                            className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl border border-white/10 shadow-sm transition-all flex items-center justify-center gap-2 group-hover:border-white/30"
                                        >
                                            Присъедини се <ArrowRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {initialTeams.length === 0 && (
                        <div className="col-span-full py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 flex flex-col items-center text-center p-8 backdrop-blur-sm">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                                <Info size={32} className="text-white/30" />
                            </div>
                            <h3 className="text-xl font-semibold text-white/70 mb-2">Няма активни отбори</h3>
                            <p className="text-white/40 text-sm max-w-sm">Бъдете първият, който ще създаде отбор за тази сесия.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
