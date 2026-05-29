"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    KanbanSquare,
    Sparkles,
    Users2,
    BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomTab() {
    const pathname = usePathname();

    const items = [
        { label: "Painel", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Pipeline", icon: KanbanSquare, href: "/pipeline" },
        { label: "Captação", icon: Sparkles, href: "/capture", isCenter: true },
        { label: "Leads", icon: Users2, href: "/leads" },
        { label: "Métricas", icon: BarChart3, href: "/metrics" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card-glass backdrop-blur-xl border-t border-white/5 px-4 pb-6 pt-2">
            <div className="flex items-center justify-between max-w-md mx-auto relative h-12">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    if (item.isCenter) {
                        return (
                            <div key={item.href} className="relative -top-5 flex flex-col items-center z-50">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-amber-300 flex items-center justify-center text-black shadow-[0_0_20px_rgba(201,160,92,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border-4 border-background",
                                        isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                    )}
                                >
                                    <item.icon className="w-6 h-6 animate-pulse" />
                                </Link>
                                <span className={cn(
                                    "text-[9px] font-bold mt-1 font-outfit uppercase tracking-wider",
                                    isActive ? "text-primary" : "text-text-secondary"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center flex-1 py-1 transition-colors group"
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-primary" : "text-text-secondary group-hover:text-primary"
                            )} />
                            <span className={cn(
                                "text-[9px] font-medium mt-1 transition-colors",
                                isActive ? "text-primary font-bold" : "text-text-secondary group-hover:text-foreground"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
