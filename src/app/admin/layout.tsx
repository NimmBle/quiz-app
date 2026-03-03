import { destroyAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navbar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="text-2xl font-bold">
                            <span className="text-brand-red">Аз</span>{" "}
                            <span className="text-brand-blue">мога</span>
                        </Link>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
                            Админ
                        </span>
                    </div>

                    <form
                        action={async () => {
                            "use server";
                            await destroyAdminSession();
                            redirect("/admin/login");
                        }}
                    >
                        <button
                            type="submit"
                            className="flex items-center gap-2 text-gray-600 hover:text-brand-red transition-colors font-bold px-4 py-2 rounded-lg hover:bg-red-50"
                        >
                            <LogOut className="w-5 h-5" />
                            Изход
                        </button>
                    </form>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
