"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTeam, requestToJoin, cancelJoinRequest, approvePlayer, rejectPlayer, refreshPlayerSession, leaveTeam } from "./actions";
import { Users, Shield, Clock, Check, X, Plus, LogOut } from "lucide-react";
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

    // 1. Subscribe to SSE
    useEffect(() => {
        const eventSource = new EventSource(`/api/quiz/${quiz.slug}/stream`);

        const handleUpdate = async () => {
            // If we were just a pending player and got approved, we need our HttpOnly cookie updated
            // before router.refresh() fetches the new Server Component state.
            if (!me.teamId && me.requestedTeamId) {
                await refreshPlayerSession(quiz.id);
            }

            // If we are in a team, we should check if our captaincy changed (captain left)
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

    // --- Handlers ---

    async function handleCreateTeam(e: React.FormEvent) {
        e.preventDefault();
        setErrorLine("");
        setLoadingObj(p => ({ ...p, create: true }));

        const res = await createTeam(quiz.id, newTeamName);
        if (!res.success) setErrorLine(res.error || "Грешка");
        setLoadingObj(p => ({ ...p, create: false }));
    }

    async function handleRequestJoin(teamId: number) {
        setLoadingObj(p => ({ ...p, [`req-${teamId}`]: true }));
        await requestToJoin(quiz.id, teamId);
        setLoadingObj(p => ({ ...p, [`req-${teamId}`]: false }));
    }

    async function handleCancelRequest() {
        setLoadingObj(p => ({ ...p, cancel: true }));
        await cancelJoinRequest(quiz.id);
        setLoadingObj(p => ({ ...p, cancel: false }));
    }

    async function handleApprove(playerId: number) {
        setLoadingObj(p => ({ ...p, [`app-${playerId}`]: true }));
        await approvePlayer(quiz.id, playerId);
        setLoadingObj(p => ({ ...p, [`app-${playerId}`]: false }));
    }

    async function handleReject(playerId: number) {
        setLoadingObj(p => ({ ...p, [`rej-${playerId}`]: true }));
        await rejectPlayer(quiz.id, playerId);
        setLoadingObj(p => ({ ...p, [`rej-${playerId}`]: false }));
    }

    async function handleLeaveTeam() {
        if (!confirm("Сигурни ли сте, че искате да напуснете отбора?")) return;
        setLoadingObj(p => ({ ...p, leave: true }));
        await leaveTeam(quiz.id);
        setLoadingObj(p => ({ ...p, leave: false }));
    }

    // --- Views ---

    // VIEW A: I am in a Team
    if (me.teamId) {
        const myTeam = initialTeams.find(t => t.id === me.teamId);

        return (
            <div className="min-h-screen bg-brand-dark p-4 flex flex-col items-center">
                <div className="mt-8 mb-4 scale-75 origin-center">
                    <AzMogaTitle />
                </div>
                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="bg-brand-blue p-6 text-white text-center relative">
                        <h2 className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Вашият Отбор</h2>
                        <h1 className="text-3xl font-bold">{myTeam?.name}</h1>
                        {me.isCaptain && (
                            <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                                <Shield className="w-4 h-4" /> Вие сте капитан
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {/* Members List */}
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Членове ({myTeam?.members.length}/5)</h3>
                        <ul className="space-y-3 mb-8">
                            {myTeam?.members.map(m => (
                                <li key={m.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${m.id === myTeam.captainPlayerId ? "bg-brand-orange" : "bg-brand-blue"}`}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-gray-700">
                                        {m.name} {m.id === me.id && "(Ти)"}
                                    </span>
                                    {m.id === myTeam.captainPlayerId && <span title="Капитан" className="ml-auto flex"><Shield className="w-4 h-4 text-brand-orange" /></span>}
                                </li>
                            ))}
                        </ul>

                        {/* Captain view: Join Requests */}
                        {me.isCaptain && myTeam!.joinRequests.length > 0 && (
                            <>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Чакащи одобрение</h3>
                                <ul className="space-y-3">
                                    {myTeam?.joinRequests.map(r => (
                                        <li key={r.id} className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                                            <span className="font-bold text-gray-700">{r.name}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReject(r.id)}
                                                    disabled={loadingObj[`app-${r.id}`] || loadingObj[`rej-${r.id}`]}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                    title="Отхвърли"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(r.id)}
                                                    disabled={loadingObj[`app-${r.id}`] || loadingObj[`rej-${r.id}`] || myTeam.members.length >= 5}
                                                    className="bg-brand-green text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    <Check className="w-4 h-4" /> Приеми
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        {/* General Waiting Message */}
                        {!me.isCaptain && (
                            <div className="bg-blue-50 text-brand-blue p-4 rounded-xl flex items-center justify-center gap-2 font-bold mb-4">
                                <Clock className="w-5 h-5 animate-pulse" />
                                Изчакване на останалите участници...
                            </div>
                        )}

                        <button
                            onClick={handleLeaveTeam}
                            disabled={loadingObj.leave}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 transition"
                        >
                            <LogOut className="w-5 h-5" /> Напусни отбора
                        </button>

                        <div className="bg-gray-100 text-gray-500 p-4 rounded-xl text-center text-sm font-bold mt-4">
                            Очаквайте администраторът да стартира играта.
                        </div>

                    </div>

                </div>
            </div>
        );
    }

    // VIEW B: I requested to join a team, waiting for approval
    if (me.requestedTeamId) {
        const requestedTeam = initialTeams.find(t => t.id === me.requestedTeamId);
        return (
            <div className="min-h-screen bg-brand-dark p-4 flex flex-col items-center justify-center">
                <div className="scale-75 mb-6 origin-center">
                    <AzMogaTitle />
                </div>
                <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center shadow-xl">
                    <Clock className="w-16 h-16 text-brand-orange mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Изчакване на одобрение</h2>
                    <p className="text-gray-600 mb-8">
                        Изпратихте заявка за присъединяване към отбор <br />
                        <strong className="text-brand-blue text-lg">{requestedTeam?.name}</strong>.
                    </p>
                    <button
                        onClick={handleCancelRequest}
                        disabled={loadingObj.cancel}
                        className="text-red-500 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition"
                    >
                        {loadingObj.cancel ? "Отмяна..." : "Откажи заявката"}
                    </button>
                </div>
            </div>
        );
    }

    // VIEW C: Unassigned, selecting or creating a team
    return (
        <div className="min-h-screen bg-brand-dark p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl mt-4">
                <div className="scale-75 origin-center flex justify-center mb-6">
                    <AzMogaTitle />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 text-center">Избор на Отбор</h1>
                <p className="text-gray-300 text-center mb-8">Създайте нов отбор или изпратете заявка за присъединяване.</p>

                {errorLine && (
                    <div className="bg-brand-red text-white p-4 rounded-xl mb-6 font-bold text-center">
                        {errorLine}
                    </div>
                )}

                {/* Create Team Form */}
                <form onSubmit={handleCreateTeam} className="bg-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Име на нов отбор</label>
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            placeholder="напр. Непобедимите"
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-brand-blue outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loadingObj.create || !newTeamName.trim()}
                        className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" /> Създай
                    </button>
                </form>

                {/* List of Teams */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialTeams.map(team => (
                        <div key={team.id} className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{team.name}</h3>
                            <div className="flex items-center gap-1 text-gray-500 text-sm font-bold mb-6">
                                <Users className="w-4 h-4" /> {team.members.length} / 5 играчи
                            </div>

                            <div className="mt-auto">
                                {team.members.length >= 5 ? (
                                    <button disabled className="w-full py-2 bg-gray-100 text-gray-400 font-bold rounded-lg cursor-not-allowed">
                                        Отборът е пълен
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleRequestJoin(team.id)}
                                        disabled={loadingObj[`req-${team.id}`]}
                                        className="w-full py-2 bg-brand-green text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                    >
                                        Поискай присъединяване
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {initialTeams.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white/5 rounded-2xl border border-white/10 text-gray-300">
                            Все още няма създадени отбори. Бъдете първи!
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
