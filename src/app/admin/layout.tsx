import { destroyAdminSession, getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import AzMogaTitle from "@/components/AzMogaTitle";
import AdminSidebarLinks from "./AdminSidebarLinks";
import MobileNav from "./MobileNav";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getAdminSession();
    const isLoginPage = !session;

    if (isLoginPage) {
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }

    async function handleLogout() {
        "use server";
        await destroyAdminSession();
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Desktop) - Hidden until 1024px (lg) */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <Link href="/admin/dashboard" className="flex flex-col">
                        <AzMogaTitle className="text-2xl" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                            Администрация
                        </span>
                    </Link>
                </div>

                <AdminSidebarLinks />

                <div className="p-4 border-t border-gray-100">
                    <form action={handleLogout}>
                        <button
                            type="submit"
                            className="flex items-center gap-3 w-full text-gray-500 hover:text-brand-red transition-all font-bold px-4 py-3 rounded-xl hover:bg-red-50 group"
                        >
                            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <span>Изход</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile Navigation - Visible until 1024px (lg) */}
            <MobileNav logoutAction={handleLogout} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen pt-16 lg:pt-0 min-w-0">
                {/* Top header for desktop */}
                <header className="h-16 bg-white border-b border-gray-100 hidden lg:flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>Админ</span>
                        <ChevronRight size={14} />
                        <span className="text-gray-900 font-semibold">Табло</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs border border-brand-blue/20">
                            A
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
