"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, Copy } from "lucide-react";
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

export default function AdminDashboard({ quizzes }: { quizzes: Quiz[] }) {
    const [isCreating, setIsCreating] = useState(false);
    const [loadingId, setLoadingId] = useState<number | null>(null);

    async function handleCreate(formData: FormData) {
        setIsCreating(true);
        await createQuiz(formData);
        setIsCreating(false);
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

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Вашите Куизове</h1>
                    <p className="text-gray-500 mt-1">
                        Управлявайте игрите, въпросите и техния статус.
                    </p>
                </div>

                {/* Create New Quiz Form */}
                <form
                    action={handleCreate}
                    className="flex items-center gap-2 w-full sm:w-auto bg-white p-2 rounded-lg shadow-sm border border-gray-200"
                >
                    <input
                        type="text"
                        name="name"
                        placeholder="Име на новия куиз..."
                        required
                        className="flex-1 sm:w-64 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-brand-blue"
                        disabled={isCreating}
                    />
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="flex items-center gap-1 bg-brand-green text-white px-4 py-2 rounded-md font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        Създай
                    </button>
                </form>
            </div>

            {/* Quizzes Grid */}
            {quizzes.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-200 border-dashed">
                    <p className="text-gray-500 font-bold">Нямате създадени куизове все още.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                        >
                            {/* Card Header (Status Color Top Border) */}
                            <div
                                className={`h-2 w-full ${quiz.status === "active"
                                    ? "bg-brand-green"
                                    : quiz.status === "lobby"
                                        ? "bg-brand-blue"
                                        : quiz.status === "draft"
                                            ? "bg-brand-orange"
                                            : "bg-gray-400"
                                    }`}
                            />

                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                                        {quiz.name}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 text-xs font-bold uppercase rounded-full whitespace-nowrap ${quiz.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : quiz.status === "lobby"
                                                ? "bg-blue-100 text-brand-blue"
                                                : quiz.status === "draft"
                                                    ? "bg-orange-100 text-orange-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {quiz.status === "active" ? "Активен" : quiz.status === "lobby" ? "ЛОБИ (Чака)" : quiz.status === "draft" ? "Чернова" : "Завършен"}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-500 mb-6 flex-1">
                                    <p>
                                        <span className="font-semibold">Линк:</span> /play/{quiz.slug}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Създаден:</span>{" "}
                                        {new Date(quiz.createdAt).toLocaleDateString("bg-BG")}
                                    </p>
                                </div>

                                {/* Card Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <Link
                                        href={`/admin/quiz/${quiz.slug}/edit`}
                                        className="flex items-center gap-1 text-brand-blue hover:text-blue-800 font-bold text-sm px-2 py-1 rounded hover:bg-blue-50 transition"
                                    >
                                        <Edit className="w-4 h-4" /> Редакция
                                    </Link>

                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleClone(quiz.id)}
                                            disabled={loadingId === quiz.id}
                                            title="Клонирай"
                                            className="p-2 text-gray-500 hover:text-brand-orange hover:bg-orange-50 rounded transition disabled:opacity-50"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(quiz.id)}
                                            disabled={loadingId === quiz.id}
                                            title="Изтрий"
                                            className="p-2 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded transition disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
