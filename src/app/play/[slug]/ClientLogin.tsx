"use client";

import { useActionState } from "react";
import { joinQuizAsGuest } from "./actions";
import AzMogaTitle from "@/components/AzMogaTitle";

interface Quiz {
    id: number;
    slug: string;
    name: string;
}

export default function ClientLogin({ quiz }: { quiz: Quiz }) {
    const joinQuizWithArgs = joinQuizAsGuest.bind(null, quiz.id, quiz.slug);
    const [state, formAction, isPending] = useActionState(joinQuizWithArgs, null);

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden text-center">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brand-red via-brand-blue to-brand-green" />

                <h1 className="mb-2 mt-4 flex justify-center">
                    <AzMogaTitle />
                </h1>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{quiz.name}</h2>
                <p className="text-gray-500 text-sm mb-8">
                    Въведете вашите данни, за да се включите в играта.
                </p>

                <form action={formAction} className="space-y-6 text-left">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">
                            Вашето Име (и Фамилия)
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            disabled={isPending}
                            placeholder="напр. Иван Иванов"
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-brand-blue focus:ring-0 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                        />
                    </div>

                    <div>
                        <label htmlFor="externalId" className="block text-sm font-bold text-gray-700 mb-2">
                            Кой клас сте?
                        </label>
                        <select
                            id="externalId"
                            name="externalId"
                            required
                            disabled={isPending}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-brand-blue focus:ring-0 transition-colors disabled:bg-gray-100 disabled:text-gray-400 font-bold"
                        >
                            <option value="">-- Изберете --</option>
                            <option value="8_class">8. клас</option>
                            <option value="9_class">9. клас</option>
                            <option value="10_class">10. клас</option>
                            <option value="11_class">11. клас</option>
                            <option value="12_class">12. клас</option>
                            <option value="teacher">Учител / Ръководител</option>
                        </select>
                    </div>

                    {state?.error && (
                        <div className="bg-red-50 text-brand-red p-3 rounded-lg text-sm text-center font-bold">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-brand-green text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {isPending ? "Влизане..." : "Влез в играта"}
                    </button>
                </form>
            </div>
        </div>
    );
}
