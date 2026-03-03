"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
    const [state, formAction, isPending] = useActionState(loginAction, null);

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-brand-red">Аз</span>{" "}
                        <span className="text-brand-blue">мога</span>
                    </h1>
                    <h2 className="text-xl text-gray-600 font-bold uppercase tracking-wider">
                        Админ Панел
                    </h2>
                </div>

                <form action={formAction} className="space-y-6">
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-bold text-gray-700 mb-2"
                        >
                            Парола
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            disabled={isPending}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-brand-blue focus:ring-0 transition-colors disabled:bg-gray-100 disabled:text-gray-400 font-sans"
                            placeholder="Въведете парола..."
                        />
                    </div>

                    {state?.error && (
                        <div className="bg-red-50 text-brand-red p-3 rounded-lg text-sm text-center font-bold">
                            {state.error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? "Влизане..." : "Вход"}
                    </button>
                </form>
            </div>
        </div>
    );
}
