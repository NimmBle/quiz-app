"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { addQuestion, updateQuestion, deleteQuestion, updateQuizStatus, swapQuestionPositions } from "./actions";

type Question = {
    id: number;
    position: number;
    text: string | null;
    hint: string;
    imageUrl: string | null;
    answers: string[];
};

type Quiz = {
    id: number;
    name: string;
    slug: string;
    status: "draft" | "lobby" | "active" | "finished";
};

export default function QuizEditorClient({ quiz, initialQuestions }: { quiz: Quiz, initialQuestions: Question[] }) {
    const [questions] = useState(initialQuestions);
    const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({});
    const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, qId: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrls(prev => ({ ...prev, [qId]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrls(prev => {
                const newUrls = { ...prev };
                delete newUrls[qId];
                return newUrls;
            });
        }
    };

    async function handleAddQuestion() {
        setLoadingObj(p => ({ ...p, add: true }));
        await addQuestion(quiz.id);
        // In a real app we'd refresh the state here via router.refresh(), but we will rely on full reloads for simplicity
        window.location.reload();
    }

    async function handleDeleteQuestion(id: number) {
        if (!confirm("Сигурни ли сте, че искате да изтриете този въпрос?")) return;
        setLoadingObj(p => ({ ...p, [id]: true }));
        await deleteQuestion(id);
        window.location.reload();
    }

    async function handleUpdateStatus(status: "draft" | "lobby" | "active" | "finished") {
        setLoadingObj(p => ({ ...p, status: true }));
        await updateQuizStatus(quiz.id, status);
        window.location.reload();
    }

    async function handleSwap(q1Id: number, q2Id: number) {
        setLoadingObj(p => ({ ...p, swap: true }));
        await swapQuestionPositions(quiz.id, q1Id, q2Id);
        window.location.reload();
    }

    async function handleSaveQuestion(e: React.FormEvent<HTMLFormElement>, qId: number) {
        e.preventDefault();
        setLoadingObj(p => ({ ...p, [`save-${qId}`]: true }));
        const formData = new FormData(e.currentTarget);
        await updateQuestion(qId, formData);
        window.location.reload();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/dashboard" className="p-2 text-gray-500 hover:text-brand-blue bg-white rounded-full shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{quiz.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-500 text-sm">Статус:</span>
                        <select
                            disabled={loadingObj.status}
                            value={quiz.status}
                            onChange={(e) => handleUpdateStatus(e.target.value as "draft" | "lobby" | "active" | "finished")}
                            className={`text-sm font-bold border-none rounded-full px-3 py-1 outline-none cursor-pointer ${quiz.status === "active" ? "bg-green-100 text-green-800" :
                                quiz.status === "lobby" ? "bg-blue-100 text-brand-blue" :
                                    quiz.status === "draft" ? "bg-orange-100 text-orange-800" :
                                        "bg-gray-100 text-gray-800"
                                }`}
                        >
                            <option value="draft">Чернова</option>
                            <option value="lobby">Очакване на играчи (Лоби)</option>
                            <option value="active">Активен (Играта тече)</option>
                            <option value="finished">Завършен</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Editor Main Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Въпроси ({questions.length})</h2>
                    <button
                        onClick={handleAddQuestion}
                        disabled={loadingObj.add}
                        className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                        <Plus className="w-5 h-5" /> Добави Въпрос
                    </button>
                </div>

                <div className="space-y-8">
                    {questions.map((q, index) => (
                        <form
                            key={q.id}
                            onSubmit={(e) => handleSaveQuestion(e, q.id)}
                            className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative"
                        >
                            <div className="absolute top-4 right-4 flex gap-2 items-center">
                                <div className="flex bg-gray-200 rounded-lg overflow-hidden mr-2">
                                    <button
                                        type="button"
                                        onClick={() => handleSwap(q.id, questions[index - 1].id)}
                                        disabled={index === 0 || loadingObj.swap}
                                        className="p-1 px-2 text-gray-600 hover:bg-gray-300 transition disabled:opacity-30"
                                        title="Премести нагоре"
                                    >
                                        <ChevronUp className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwap(q.id, questions[index + 1].id)}
                                        disabled={index === questions.length - 1 || loadingObj.swap}
                                        className="p-1 px-2 text-gray-600 hover:bg-gray-300 transition border-l border-gray-300 disabled:opacity-30"
                                        title="Премести надолу"
                                    >
                                        <ChevronDown className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loadingObj[`save-${q.id}`]}
                                    className="flex items-center gap-1 text-white bg-brand-green px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700 transition"
                                >
                                    <Save className="w-4 h-4" /> Запази
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    disabled={loadingObj[q.id]}
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold mb-4 text-brand-dark">Въпрос #{index + 1}</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Текст на въпроса</label>
                                        <textarea
                                            name="text"
                                            defaultValue={q.text || ""}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-brand-blue h-24"
                                            placeholder="Напишете вашия въпрос тук..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Верни Отговори (разделени със запетая)</label>
                                        <input
                                            type="text"
                                            name="answers"
                                            defaultValue={q.answers.join(", ")}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-brand-blue"
                                            placeholder="напр. София, sofia"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Отговорите не са чувствителни към малки/главни букви по време на игра.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Жокер (Подсказка)</label>
                                        <input
                                            type="text"
                                            name="hint"
                                            defaultValue={q.hint}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-brand-blue"
                                            placeholder="Подсказка за отбора..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Изображение (Опционално)</label>

                                    {(previewUrls[q.id] || q.imageUrl) && (
                                        <div className="mb-3 border rounded-lg overflow-hidden bg-white max-h-48 flex justify-center items-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={previewUrls[q.id] || q.imageUrl || ""} alt="Превю" className="max-h-48 object-contain" />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="mb-2 text-sm text-gray-500 font-bold">Кликни за качване на ново изображение</p>
                                                <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
                                            </div>
                                            <input
                                                type="file"
                                                name="image"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(e, q.id)}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ))}
                </div>
            </div>
        </div>
    );
}
