"use client";

import { useState } from "react";
import { deletePlayerAction, deleteTeamAction } from "./actions";
import { Search, ShieldAlert, Trash2, Shield, User, Users } from "lucide-react";

type Quiz = { id: number; name: string; status: string; createdAt: Date; slug: string; maxHints: number };
type Team = { id: number; quizId: number; name: string; captainPlayerId: number | null; currentQuestion: number; hintsUsed: number; startTime: Date | null; finishTime: Date | null };
type Player = { id: number; quizId: number; teamId: number | null; requestedTeamId: number | null; name: string; externalId: string; isCaptain: boolean };

export default function ParticipantsClient({
    quizzes,
    teams,
    players,
}: {
    quizzes: Quiz[];
    teams: Team[];
    players: Player[];
}) {
    const [selectedQuizId, setSelectedQuizId] = useState<number | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSelectQuiz = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedQuizId(val === "all" ? "all" : parseInt(val, 10));
    };

    const handleDeletePlayer = async (player: Player) => {
        if (!confirm(`Сигурни ли сте, че искате да изтриете играч "${player.name}"?`)) return;
        setIsDeleting(true);
        await deletePlayerAction(player.id, player.quizId, player.teamId);
        setIsDeleting(false);
    };

    const handleDeleteTeam = async (team: Team) => {
        if (!confirm(`ВНИМАНИЕ: Изтриването на отбор "${team.name}" е необратимо.\n\nСигурни ли сте?`)) return;
        setIsDeleting(true);
        await deleteTeamAction(team.id, team.quizId);
        setIsDeleting(false);
    };

    // Filter logic
    const filteredTeams = teams.filter(t => {
        if (selectedQuizId !== "all" && t.quizId !== selectedQuizId) return false;
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const filteredPlayers = players.filter(p => {
        if (selectedQuizId !== "all" && p.quizId !== selectedQuizId) return false;
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Търсене по име..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                    />
                </div>
                <div className="w-full md:w-64 shrink-0">
                    <select
                        value={selectedQuizId}
                        onChange={handleSelectQuiz}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue font-semibold text-gray-700 appearance-none cursor-pointer"
                    >
                        <option value="all">Всички куизове</option>
                        {quizzes.map(q => (
                            <option key={q.id} value={q.id}>
                                {q.name} ({q.status})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* TEAMS COLUMN */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="text-brand-blue" />
                            Отбори <span className="text-sm font-normal text-gray-400">({filteredTeams.length})</span>
                        </h2>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto max-h-[600px] space-y-3">
                        {filteredTeams.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">Няма намерени отбори.</div>
                        ) : (
                            filteredTeams.map((team) => {
                                const quizName = quizzes.find(q => q.id === team.quizId)?.name || "Неизвестен";
                                const teamPlayers = players.filter(p => p.teamId === team.id || p.requestedTeamId === team.id);
                                return (
                                    <div key={team.id} className="border border-gray-100 rounded-xl p-4 hover:border-brand-blue/30 transition-colors flex justify-between items-start group">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{team.name}</h3>
                                            <div className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">{quizName}</div>
                                            <div className="text-sm text-gray-500 mt-2 flex items-center gap-4">
                                                <span>{teamPlayers.length} играчи</span>
                                                <span>Въпрос {team.currentQuestion}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTeam(team)}
                                            disabled={isDeleting}
                                            className="text-gray-300 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                            title="Изтрий отбор"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* PLAYERS COLUMN */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="text-brand-orange" />
                            Играчи <span className="text-sm font-normal text-gray-400">({filteredPlayers.length})</span>
                        </h2>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto max-h-[600px] space-y-3">
                        {filteredPlayers.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">Няма намерени играчи.</div>
                        ) : (
                            filteredPlayers.map((player) => {
                                const teamName = teams.find(t => t.id === player.teamId)?.name;
                                const reqTeamName = teams.find(t => t.id === player.requestedTeamId)?.name;
                                const quizName = quizzes.find(q => q.id === player.quizId)?.name || "Неизвестен";

                                return (
                                    <div key={player.id} className="border border-gray-100 rounded-xl p-3 hover:border-brand-orange/30 transition-colors flex justify-between items-center group">
                                        <div>
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                {player.name}
                                                {player.isCaptain && <span title="Капитан"><Shield className="w-4 h-4 text-brand-orange" /></span>}
                                            </h3>
                                            <div className="text-xs text-brand-blue/80 mt-1">
                                                {teamName ? (
                                                    <span className="bg-brand-blue/10 px-2 py-0.5 rounded font-semibold text-brand-blue">Отбор: {teamName}</span>
                                                ) : reqTeamName ? (
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">Чака за: {reqTeamName}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Без отбор</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-wider">{quizName}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePlayer(player)}
                                            disabled={isDeleting}
                                            className="text-gray-300 hover:text-brand-red p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                            title="Изтрий играч"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
