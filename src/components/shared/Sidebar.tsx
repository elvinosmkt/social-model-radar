"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, KanbanSquare, Users2, BarChart3, Settings,
    LogOut, Sparkles, ShieldCheck, Zap, Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

// ── SIMULAÇÃO DE ROLE (em prod virá do JWT/Context) ──────────────
// Troque o valor para ver o menu de cada perfil:
// "admin" | "vendedor" | "webscouter"
const CURRENT_ROLE = "admin" as "admin" | "vendedor" | "webscouter";

const ROLE_CONFIG = {
    admin:       { label: "Administrador", badge: "ADM",       color: "bg-primary/20 text-primary",           icon: ShieldCheck },
    vendedor:    { label: "Carlos Mendes", badge: "VENDEDOR",  color: "bg-blue-500/20 text-blue-400",          icon: Briefcase   },
    webscouter:  { label: "Rafaela Costa", badge: "WEBSCOUTER",color: "bg-purple-500/20 text-purple-400",      icon: Zap         },
};

// ── Menus por role ───────────────────────────────────────────────
const NAV_COMMON = [
    { label: "Dashboard",     icon: LayoutDashboard, href: "/dashboard" },
    { label: "Captação",      icon: Sparkles,         href: "/capture"   },
    { label: "Pipeline",      icon: KanbanSquare,     href: "/pipeline"  },
    { label: "Leads",         icon: Users2,            href: "/leads"     },
    { label: "Métricas",      icon: BarChart3,         href: "/metrics"   },
    { label: "Configurações", icon: Settings,          href: "/settings"  },
];

const NAV_ROLE: Record<string, { label: string; icon: any; href: string; section: string }[]> = {
    admin: [
        { label: "Painel Admin",    icon: ShieldCheck, href: "/admin",    section: "Administração" },
    ],
    vendedor: [
        { label: "Minha Equipe",    icon: Briefcase,   href: "/vendedor", section: "Gestão"        },
    ],
    webscouter: [],
};

function NavItem({ item, isActive }: { item: { label: string; icon: any; href: string }; isActive: boolean }) {
    return (
        <Link href={item.href}
            className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
                isActive ? "text-primary" : "text-text-secondary hover:text-foreground hover:bg-white/5"
            )}>
            {isActive && (
                <motion.div layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
            <item.icon className={cn("w-[18px] h-[18px] transition-all duration-300 relative z-10",
                isActive ? "text-primary" : "text-text-secondary group-hover:text-primary group-hover:scale-110"
            )} />
            <span className="font-semibold text-sm relative z-10 tracking-tight">{item.label}</span>
        </Link>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const role = CURRENT_ROLE;
    const roleInfo = ROLE_CONFIG[role];
    const roleNav = NAV_ROLE[role] || [];

    // Initials or email prefix for the avatar
    const email = user?.email || "admin@smr.com";
    const displayName = email.split('@')[0];
    const initials = displayName.slice(0, 2).toUpperCase();

    // Créditos — só para vendedor e webscouter
    const creditData = {
        vendedor:    { used: 712,  total: 2000, label: "Créditos livres" },
        webscouter:  { used: 312,  total: 600,  label: "Meus créditos"  },
        admin:       null,
    }[role];

    return (
        <div className="fixed left-0 top-0 h-screen w-64 bg-card-glass backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                        <Zap className="w-4 h-4 text-black" />
                    </div>
                    <h1 className="text-xl font-outfit font-bold premium-gradient-text tracking-tight">DWS SCOUTER</h1>
                </div>
                <p className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-medium pl-9">Digital Web Scouter</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto no-scrollbar">
                <p className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold px-4 py-2">Principal</p>
                {NAV_COMMON.map(item => (
                    <NavItem key={item.href} item={item} isActive={pathname === item.href} />
                ))}

                {/* Seção específica do role */}
                {roleNav.length > 0 && (
                    <div className="pt-3">
                        <p className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold px-4 py-2">{roleNav[0].section}</p>
                        {roleNav.map(item => (
                            <NavItem key={item.href} item={item} isActive={pathname === item.href || pathname.startsWith(item.href + '/')} />
                        ))}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 space-y-3">
                {/* Créditos (vendedor/webscouter) */}
                {creditData && (
                    <div className="px-2 space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-text-secondary font-medium">{creditData.label}</span>
                            <span className={cn("font-bold", (creditData.total - creditData.used) < creditData.total * 0.15 ? "text-amber-400" : "text-primary")}>
                                {(creditData.total - creditData.used).toLocaleString('pt-BR')} / {creditData.total.toLocaleString('pt-BR')}
                            </span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", (creditData.used/creditData.total) > 0.85 ? "bg-amber-400" : "bg-primary")}
                                style={{ width: `${(creditData.used/creditData.total)*100}%` }} />
                        </div>
                    </div>
                )}

                {/* User card */}
                {user ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate capitalize">{displayName}</p>
                            <p className="text-[10px] text-text-secondary truncate">{email}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0", roleInfo.color)}>
                            {roleInfo.label.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{roleInfo.label}</p>
                            <div className="flex items-center gap-1">
                                <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", roleInfo.color)}>{roleInfo.badge}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sair */}
                <button
                    onClick={signOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all group"
                >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform text-text-secondary" />
                    <span className="font-medium text-sm">Sair</span>
                </button>
            </div>
        </div>
    );
}
