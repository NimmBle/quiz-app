"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import AzMogaTitle from "@/components/AzMogaTitle";
import AdminSidebarLinks from "./AdminSidebarLinks";

export default function MobileNav({ logoutAction }: { logoutAction: () => Promise<void> }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between z-50">
                <AzMogaTitle className="text-xl" />
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div 
                className={`lg:hidden fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Sidebar */}
            <aside 
                className={`lg:hidden fixed top-16 left-0 bottom-0 w-72 bg-white z-40 transform transition-transform duration-300 ease-in-out border-r border-gray-200 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                        <AdminSidebarLinks />
                    </div>
                    
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={() => {
                                if (confirm("Сигурни ли сте, че искате да излезете?")) {
                                    logoutAction();
                                }
                            }}
                            className="flex items-center gap-3 w-full text-gray-500 hover:text-brand-red transition-all font-bold px-4 py-3 rounded-xl hover:bg-red-50 group"
                        >
                            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            <span>Изход</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
