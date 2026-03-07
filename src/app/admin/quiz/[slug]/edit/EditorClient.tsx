"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft, Image as ImageIcon, ChevronUp, ChevronDown, Clock, CheckCircle2, AlertCircle, ListTodo, Settings, Activity, RefreshCw, ChevronRight, Maximize2 } from "lucide-react";
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
    const [loadingObj, setLoadingObj] = useState<Record<string, boolean>>({});
    const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
    const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set(initialQuestions.map(q => q.id)));

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

    const toggleCollapse = (id: number) => {
        setCollapsedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setCollapsedIds(new Set());
    const collapseAll = () => setCollapsedIds(new Set(initialQuestions.map(q => q.id)));

    async function handleAddQuestion() {
        setLoadingObj(p => ({ ...p, add: true }));
        await addQuestion(quiz.id);
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

    const statusConfig = {
        draft: { label: "Чернова", color: "bg-orange-50 text-brand-orange border-orange-200", icon: <Settings size={14} /> },
        lobby: { label: "Лоби", color: "bg-blue-50 text-brand-blue border-blue-200", icon: <Clock size={14} /> },
        active: { label: "На живо", color: "bg-green-50 text-brand-green border-green-200", icon: <CheckCircle2 size={14} /> },
        finished: { label: "Завършен", color: "bg-gray-50 text-gray-500 border-gray-200", icon: <AlertCircle size={14} /> },
    };

    return (
        <div className="space-y-8 pb-20 max-w-[1400px] mx-auto">
            {/* Navigation & Title */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
                <div className="space-y-4">
                    <Link 
                        href="/admin/dashboard" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Обратно към таблото</span>
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                            {quiz.name}
                        </h1>
                        <p className="text-gray-500 font-medium">Управление на въпроси и статус</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig[quiz.status].color} font-black text-[10px] uppercase tracking-widest`}>
                        {statusConfig[quiz.status].icon}
                        <span>{statusConfig[quiz.status].label}</span>
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

            {/* Editor Main Area */}
            <div className="space-y-8">
                <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-6 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue">
                                <ListTodo size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Въпроси</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{initialQuestions.length} общо</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 mr-2">
                                <button 
                                    onClick={expandAll}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-blue transition-colors"
                                >
                                    Разпъни всички
                                </button>
                                <div className="w-px bg-gray-200 my-1" />
                                <button 
                                    onClick={collapseAll}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-blue transition-colors"
                                >
                                    Свий всички
                                </button>
                            </div>
                            <button
                                onClick={handleAddQuestion}
                                disabled={loadingObj.add}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-brand-green text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50"
                            >
                                <Plus size={18} />
                                <span>Добави нов въпрос</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {initialQuestions.map((q, index) => {
                            const isCollapsed = collapsedIds.has(q.id);
                            
                            if (isCollapsed) {
                                return (
                                    <div 
                                        key={q.id}
                                        onClick={() => toggleCollapse(q.id)}
                                        className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-blue hover:shadow-md transition-all flex items-center gap-6"
                                    >
                                        <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center font-black text-sm text-gray-400 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue transition-colors">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 font-bold text-gray-700 truncate text-lg">
                                            {q.text || <span className="text-gray-300 italic font-normal">Няма текст на въпроса...</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-gray-300 group-hover:text-brand-blue transition-colors">
                                            {q.imageUrl && <ImageIcon size={18} className="opacity-50" />}
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={q.id} className="relative">
                                    <form
                                        onSubmit={(e) => handleSaveQuestion(e, q.id)}
                                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-colors"
                                    >
                                        {/* Question Header Area */}
                                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span 
                                                    onClick={() => toggleCollapse(q.id)}
                                                    className="w-10 h-10 bg-brand-blue text-white rounded-lg flex items-center justify-center font-black text-lg cursor-pointer hover:bg-blue-700 transition-colors"
                                                    title="Свий въпроса"
                                                >
                                                    {index + 1}
                                                </span>
                                                <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSwap(q.id, initialQuestions[index - 1].id)}
                                                        disabled={index === 0 || loadingObj.swap}
                                                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition disabled:opacity-20"
                                                    >
                                                        <ChevronUp size={20} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSwap(q.id, initialQuestions[index + 1].id)}
                                                        disabled={index === initialQuestions.length - 1 || loadingObj.swap}
                                                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition border-l border-gray-200 disabled:opacity-20"
                                                    >
                                                        <ChevronDown size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCollapse(q.id)}
                                                    className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Свий въпроса"
                                                >
                                                    <Maximize2 size={20} className="rotate-45" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    disabled={loadingObj[q.id]}
                                                    className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                                                    title="Изтрий въпроса"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Main Form Body */}
                                        <div className="p-6 md:p-8">
                                            <div className="flex flex-col lg:flex-row gap-8">
                                                {/* Column 1: Question and Image */}
                                                <div className="flex-1 space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Текст на въпроса</label>
                                                        <textarea
                                                            name="text"
                                                            defaultValue={q.text || ""}
                                                            rows={4}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white outline-none transition-all font-medium text-lg resize-y"
                                                            placeholder="Напишете въпроса..."
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Изображение (Опционално)</label>
                                                        <div className="relative h-48 sm:h-64 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden hover:bg-white hover:border-gray-300 transition-all">
                                                            {(previewUrls[q.id] || q.imageUrl) ? (
                                                                <div className="relative w-full h-full group/img">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img 
                                                                        src={previewUrls[q.id] || q.imageUrl || ""} 
                                                                        alt="Превю" 
                                                                        className="w-full h-full object-contain p-2" 
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <div className="bg-white text-gray-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Смени снимката</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center p-4">
                                                                    <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Кликни за качване</p>
                                                                </div>
                                                            )}
                                                            <input
                                                                type="file"
                                                                name="image"
                                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                                accept="image/*"
                                                                onChange={(e) => handleImageChange(e, q.id)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Answers and Hint */}
                                                <div className="w-full lg:w-[400px] space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Верни отговори (разделени със запетая)</label>
                                                        <textarea
                                                            name="answers"
                                                            defaultValue={q.answers.join(", ")}
                                                            rows={3}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white outline-none transition-all font-bold resize-none"
                                                            placeholder="напр. София, sofia"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Жокер (Подсказка)</label>
                                                        <textarea
                                                            name="hint"
                                                            defaultValue={q.hint}
                                                            rows={3}
                                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white outline-none transition-all font-medium resize-none"
                                                            placeholder="Напишете подсказка тук..."
                                                        />
                                                    </div>

                                                    <div className="pt-4">
                                                        <button
                                                            type="submit"
                                                            disabled={loadingObj[`save-${q.id}`]}
                                                            className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
                                                        >
                                                            {loadingObj[`save-${q.id}`] ? (
                                                                <RefreshCw size={18} className="animate-spin" />
                                                            ) : (
                                                                <Save size={18} />
                                                            )}
                                                            <span>{loadingObj[`save-${q.id}`] ? "Запазване..." : "Запази въпроса"}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            );
                        })}

                        {initialQuestions.length === 0 && (
                            <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <ListTodo size={40} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Няма въпроси</h3>
                                <p className="text-gray-500 text-sm">Добавете първия въпрос, за да започнете.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Preview Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <Link 
                    href={`/admin/quiz/${quiz.slug}/live`}
                    className="flex items-center gap-3 bg-brand-dark text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                >
                    <Activity size={18} className="text-brand-orange" />
                    <span>Преглед на живо</span>
                </Link>
            </div>
        </div>
    );
}
