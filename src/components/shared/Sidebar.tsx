"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    KanbanSquare,
    Users2,
    BarChart3,
    Settings,
    LogOut,
    Sparkles
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Captação", icon: Sparkles, href: "/capture" },
    { label: "Pipeline", icon: KanbanSquare, href: "/pipeline" },
    { label: "Leads", icon: Users2, href: "/leads" },
    { label: "Métricas", icon: BarChart3, href: "/metrics" },
    { label: "Configurações", icon: Settings, href: "/settings" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // Get initials or email prefix for the avatar
    const email = user?.email || "admin@smr.com";
    const displayName = email.split('@')[0];
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="fixed left-0 top-0 h-screen w-64 bg-card-glass backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col z-50">
            <div className="p-6 border-b border-white/5">
                <h1 className="text-2xl font-outfit font-bold premium-gradient-text tracking-tight">
                    SMR RADAR
                </h1>
                <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] mt-1 font-medium">
                    Social Model Radar
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(201,160,92,0.1)]"
                                    : "text-text-secondary hover:text-foreground hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-primary" : "text-text-secondary group-hover:text-primary"
                            )} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate capitalize">{displayName}</p>
                        <p className="text-xs text-text-secondary truncate">{email}</p>
                    </div>
                </div>

                <button
                    onClick={signOut}
                    className="flex items-center gap-3 w-full px-4 py-3 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all duration-300 group"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Sair</span>
                </button>
            </div>
        </div>
    );
}
