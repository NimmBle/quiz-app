"use client";

import { useActionState } from "react";
import { joinQuizAsGuest } from "./actions";
import AzMogaTitle from "@/components/AzMogaTitle";
import { ArrowRight, Sparkles, GraduationCap, User } from "lucide-react";

interface Quiz {
    id: number;
    slug: string;
    name: string;
}

export default function ClientLogin({ quiz }: { quiz: Quiz }) {
    const joinQuizWithArgs = joinQuizAsGuest.bind(null, quiz.id, quiz.slug);
    const [state, formAction, isPending] = useActionState(joinQuizWithArgs, null);

    return (
        <div className="min-h-screen bg-[#0A1118] flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans text-white">
            {/* Elegant Animated Background Glows */}
            <div className="absolute top-0 left-[-10%] w-[60%] h-[60%] bg-brand-blue/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[4000ms]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-orange/15 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[5000ms] delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-[#0A1118]/50 to-[#0A1118] pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
                {/* Logo Section */}
                <div className="text-center mb-10 w-fit">
                    <div className="px-8 py-5">
                        <AzMogaTitle className="text-[32px] sm:text-[44px] drop-shadow-2xl" />
                    </div>
                </div>

                {/* Professional Glassmorphic Card */}
                <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02]">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-wide line-clamp-1">
                                {quiz.name}
                            </h2>
                            <p className="text-white/50 text-sm mt-1">Присъединете се към сесията</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center border border-brand-orange/30 shrink-0">
                            <Sparkles className="text-brand-orange animate-pulse" size={18} />
                        </div>
                    </div>

                    <div className="p-8 sm:p-10">
                        <form action={formAction} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider ml-1">
                                    <User size={14} className="text-brand-blue" />
                                    <span>Име и Фамилия</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    disabled={isPending}
                                    placeholder="напр. Иван Иванов"
                                    className="w-full px-5 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium text-lg outline-none backdrop-blur-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="externalId" className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider ml-1">
                                    <GraduationCap size={14} className="text-brand-red" />
                                    <span>Ученик / Учител</span>
                                </label>
                                <div className="relative group">
                                    <select
                                        id="externalId"
                                        name="externalId"
                                        required
                                        disabled={isPending}
                                        className="w-full px-5 py-4 rounded-xl border border-white/20 bg-white/10 text-white focus:bg-[#1a2332] focus:border-brand-red focus:ring-1 focus:ring-brand-red appearance-none transition-all font-medium text-lg cursor-pointer outline-none backdrop-blur-sm"
                                    >
                                        <option value="" className="bg-brand-dark text-white">-- Изберете клас --</option>
                                        <option value="7_class" className="bg-brand-dark text-white">7. клас</option>
                                        <option value="8_class" className="bg-brand-dark text-white">8. клас</option>
                                        <option value="9_class" className="bg-brand-dark text-white">9. клас</option>
                                        <option value="10_class" className="bg-brand-dark text-white">10. клас</option>
                                        <option value="11_class" className="bg-brand-dark text-white">11. клас</option>
                                        <option value="12_class" className="bg-brand-dark text-white">12. клас</option>
                                        <option value="teacher" className="bg-brand-dark text-white">Учител / Ръководител</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:rotate-180 transition-transform duration-300">
                                        <ArrowRight size={18} className="rotate-90 text-white" />
                                    </div>
                                </div>
                            </div>

                            {state?.error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 font-medium text-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    {state.error}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="group w-full bg-brand-green hover:bg-green-500 text-white font-semibold py-4 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(44,150,68,0.39)] hover:shadow-[0_6px_20px_rgba(44,150,68,0.23)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    <span>{isPending ? "Свързване..." : "Искам да играя!"}</span>
                                    {!isPending && <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="mt-8 text-center text-white/30 font-medium text-xs tracking-widest">
                    AZ MOGA • ASSESSMENT PLATFORM • 2026
                </p>
            </div>
        </div>
    );
}
