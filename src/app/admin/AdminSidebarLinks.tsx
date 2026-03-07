"use client";

import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Users, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminSidebarLinks() {
    const pathname = usePathname();

    return (
        <nav className="flex-1 p-4 space-y-2">
            <SidebarLink 
                href="/admin/dashboard" 
                icon={<LayoutDashboard size={20} />} 
                label="Табло" 
                active={pathname === "/admin/dashboard"} 
            />
            <SidebarLink 
                href="/admin/participants" 
                icon={<Users size={20} />} 
                label="Участници" 
                active={pathname.startsWith("/admin/participants")} 
            />
            <SidebarLink 
                href="#" 
                icon={<Settings size={20} />} 
                label="Настройки" 
                disabled 
            />
        </nav>
    );
}

function SidebarLink({ href, icon, label, active = false, disabled = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean }) {
    if (disabled) {
        return (
            <div className="flex items-center gap-3 text-gray-300 font-bold px-4 py-3 rounded-xl cursor-not-allowed">
                {icon}
                <span>{label}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 font-bold px-4 py-3 rounded-xl transition-all ${active
                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
