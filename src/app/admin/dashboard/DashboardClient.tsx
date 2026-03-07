"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, Copy, Activity, Users, Trophy, PlayCircle, Clock, Search, Filter, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createQuiz, deleteQuiz, cloneQuiz } from "./actions";

// Type matching our Drizzle schema minus relationships
type Quiz = {
    id: number;
    name: string;
    slug: string;
    status: "draft" | "lobby" | "active" | "finished";
    createdAt: Date;
};

type Stats = {
    totalQuizzes: number;
    totalTeams: number;
    totalPlayers: number;
    activeQuizzes: number;
};

export default function AdminDashboard({ quizzes, stats }: { quizzes: Quiz[], stats: Stats }) {
    const [isCreating, setIsCreating] = useState(false);
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    async function handleCreate(formData: FormData) {
        setIsCreating(true);
        await createQuiz(formData);
        setIsCreating(false);
        (document.getElementById("create-quiz-form") as HTMLFormElement)?.reset();
    }

    async function handleDelete(id: number) {
        if (!confirm("Сигурни ли сте, че искате да изтриете този куиз?")) return;
        setLoadingId(id);
        await deleteQuiz(id);
        setLoadingId(null);
    }

    async function handleClone(id: number) {
        setLoadingId(id);
        await cloneQuiz(id);
        setLoadingId(null);
    }

    const filteredQuizzes = quizzes.filter(q => 
        q.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Общо Куизове" 
                    value={stats.totalQuizzes} 
                    icon={<Trophy className="text-brand-orange" />} 
                    color="bg-orange-50"
                />
                <StatCard 
                    title="Активни Игри" 
                    value={stats.activeQuizzes} 
                    icon={<PlayCircle className="text-brand-green" />} 
                    color="bg-green-50"
                />
                <StatCard 
                    title="Общо Отбори" 
                    value={stats.totalTeams} 
                    icon={<Users className="text-brand-blue" />} 
                    color="bg-blue-50"
                />
                <StatCard 
                    title="Участници" 
                    value={stats.totalPlayers} 
                    icon={<Activity className="text-brand-red" />} 
                    color="bg-red-50"
                />
            </div>

            {/* Header & Actions Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Вашите Куизове</h1>
                    <p className="text-gray-500 font-medium">Управлявайте игрите, въпросите и техния статус.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Търсене на куиз..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <form
                        id="create-quiz-form"
                        action={handleCreate}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            name="name"
                            placeholder="Име на нов куиз..."
                            required
                            className="flex-1 sm:w-48 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-medium"
                            disabled={isCreating}
                        />
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="flex items-center gap-2 bg-brand-green text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Създай</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* Quizzes Grid */}
            {filteredQuizzes.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border-2 border-gray-100 border-dashed">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Няма намерени куизове</h3>
                    <p className="text-gray-500 font-medium">Опитайте с друго име или създайте нов куиз.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredQuizzes.map((quiz) => (
                        <QuizCard 
                            key={quiz.id} 
                            quiz={quiz} 
                            loading={loadingId === quiz.id}
                            onDelete={() => handleDelete(quiz.id)}
                            onClone={() => handleClone(quiz.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${color}`}>
                    {icon}
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Live</span>
            </div>
            <div className="flex flex-col">
                <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
                <span className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wide">{title}</span>
            </div>
        </div>
    );
}

function QuizCard({ quiz, loading, onDelete, onClone }: { quiz: Quiz, loading: boolean, onDelete: () => void, onClone: () => void }) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/play/${quiz.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusStyles = {
        active: "bg-green-100 text-green-700 border-green-200",
        lobby: "bg-blue-100 text-brand-blue border-blue-200",
        draft: "bg-orange-100 text-brand-orange border-orange-200",
        finished: "bg-gray-100 text-gray-600 border-gray-200",
    };

    const statusLabels = {
        active: "На живо",
        lobby: "Лоби",
        draft: "Чернова",
        finished: "Завършен",
    };

    return (
        <div className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border ${statusStyles[quiz.status]}`}>
                        {statusLabels[quiz.status]}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={handleCopyLink}
                            className={`p-2 rounded-xl transition-all ${copied ? "text-brand-green bg-green-50" : "text-gray-400 hover:text-brand-blue hover:bg-blue-50"}`}
                            title="Копирай линк за игра"
                        >
                            {copied ? <CheckCircle2 size={18} /> : <LinkIcon size={18} />}
                        </button>
                        <button 
                            onClick={onClone}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-colors"
                            title="Клонирай"
                        >
                            <Copy size={18} />
                        </button>
                        <button 
                            onClick={onDelete}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-colors"
                            title="Изтрий"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 group-hover:text-brand-blue transition-colors line-clamp-2">
                    {quiz.name}
                </h3>

                <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <Clock size={14} className="text-gray-300" />
                        <span>{new Date(quiz.createdAt).toLocaleDateString("bg-BG")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <PlayCircle size={14} className="text-gray-300" />
                        <span className="truncate">/play/{quiz.slug}</span>
                    </div>
                </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4 mt-auto">
                <Link 
                    href={`/admin/quiz/${quiz.slug}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                >
                    <Edit size={16} />
                    <span>Редакция</span>
                </Link>
                <Link 
                    href={`/admin/quiz/${quiz.slug}/live`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-blue text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all"
                >
                    <Activity size={16} />
                    <span>На живо</span>
                </Link>
            </div>
        </div>
    );
}
