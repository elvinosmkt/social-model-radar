"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import {
    Users, TrendingUp, Target, MessageSquare, Shield, Plus,
    MoreHorizontal, AlertTriangle, Award, ArrowUpRight, ArrowDownRight,
    Search, ChevronRight, Coins, UserCircle, Briefcase, Zap,
    CheckCircle2, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ══════════════════════════════════════════════════
// MOCK DATA — hierarquia real ADM → VENDEDOR → WEBSCOUTER
// ══════════════════════════════════════════════════

const VENDEDORES = [
    {
        id: "v1", name: "Carlos Mendes", email: "carlos@dws.com",
        team: "Time Alpha", teamId: "t1",
        creditsReceived: 2000, creditsDistributed: 1100, creditsUsed: 712,
        webscoutersCount: 2, leadsTotal: 163, leadsApproached: 125,
        leadsConverted: 13, responseRate: 44, conversionRate: 10.4,
        status: "active", lastSeen: "há 10 min"
    },
    {
        id: "v2", name: "Patricia Lima", email: "patricia@dws.com",
        team: "Time Omega", teamId: "t2",
        creditsReceived: 1500, creditsDistributed: 1200, creditsUsed: 450,
        webscoutersCount: 2, leadsTotal: 85, leadsApproached: 62,
        leadsConverted: 6, responseRate: 38, conversionRate: 9.7,
        status: "active", lastSeen: "há 2h"
    },
    {
        id: "v3", name: "Rodrigo Faria", email: "rodrigo@dws.com",
        team: "Time Nexus", teamId: "t3",
        creditsReceived: 800, creditsDistributed: 600, creditsUsed: 580,
        webscoutersCount: 1, leadsTotal: 44, leadsApproached: 38,
        leadsConverted: 2, responseRate: 22, conversionRate: 5.3,
        status: "warning", lastSeen: "há 1 dia"
    },
];

const WEBSCOUTERSERS = [
    { id: "w1", name: "Rafaela Costa",  email: "rafaela@dws.com",  vendedorId: "v1", team: "Time Alpha", creditsReceived: 600, creditsUsed: 312, leadsTotal: 89,  leadsApproached: 67, leadsConverted: 8, responseRate: 42, conversionRate: 11.9, status: "active",  lastSeen: "há 5 min" },
    { id: "w2", name: "Bruno Matos",    email: "bruno@dws.com",    vendedorId: "v1", team: "Time Alpha", creditsReceived: 500, creditsUsed: 400, leadsTotal: 74,  leadsApproached: 58, leadsConverted: 5, responseRate: 38, conversionRate:  8.6, status: "active",  lastSeen: "há 1h"   },
    { id: "w3", name: "Camila Torres",  email: "camila@dws.com",   vendedorId: "v2", team: "Time Omega", creditsReceived: 700, creditsUsed: 250, leadsTotal: 51,  leadsApproached: 38, leadsConverted: 4, responseRate: 55, conversionRate: 10.5, status: "active",  lastSeen: "há 3h"   },
    { id: "w4", name: "Diego Alves",    email: "diego@dws.com",    vendedorId: "v2", team: "Time Omega", creditsReceived: 500, creditsUsed: 200, leadsTotal: 34,  leadsApproached: 24, leadsConverted: 2, responseRate: 28, conversionRate:  8.3, status: "warning", lastSeen: "há 3 dias"},
    { id: "w5", name: "Thiago Santos",  email: "thiago@dws.com",   vendedorId: "v3", team: "Time Nexus", creditsReceived: 600, creditsUsed: 580, leadsTotal: 44,  leadsApproached: 38, leadsConverted: 2, responseRate: 22, conversionRate:  5.3, status: "warning", lastSeen: "há 2 dias"},
];

// créditos da plataforma (ADM)
const PLATFORM = { total: 10000, allocated: 4300, remaining: 5700 };

type Tab = 'visao-geral' | 'vendedores' | 'equipes' | 'creditos';

// ══════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ══════════════════════════════════════════════════

function StatCard({ label, value, trend, positive, icon: Icon }: any) {
    return (
        <div className="glass-effect rounded-2xl p-6 space-y-3 hover:border-primary/20 transition-all">
            <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{label}</p>
                <div className="p-2 rounded-xl bg-white/5"><Icon className="w-4 h-4 text-primary" /></div>
            </div>
            <h3 className="text-3xl font-outfit font-bold">{value}</h3>
            <div className={cn("flex items-center gap-1 text-xs font-bold", positive ? "text-success" : "text-danger")}>
                {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend} <span className="text-text-secondary font-normal ml-1">esta semana</span>
            </div>
        </div>
    );
}

function CreditBar({ used, total, warn }: { used: number; total: number; warn?: boolean }) {
    const pct = Math.min((used / total) * 100, 100);
    return (
        <div className="space-y-1">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", pct > 85 ? "bg-amber-400" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
            <p className={cn("text-[10px] font-bold", pct > 85 ? "text-amber-400" : "text-text-secondary")}>
                {used.toLocaleString('pt-BR')} / {total.toLocaleString('pt-BR')} usados
            </p>
        </div>
    );
}

function NewVendedorForm({ onClose }: { onClose: () => void }) {
    return (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-6 border border-primary/20 space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-outfit font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />Novo Vendedor</h3>
                <button onClick={onClose} className="text-xs text-text-secondary hover:text-foreground">Cancelar</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[["Nome Completo","text","Ex: Maria Silva"],["E-mail","email","email@dws.com"],["Senha Temporária","password","••••••••"],["Nome da Equipe","text","Ex: Time Delta"]].map(([label,type,ph]) => (
                    <div key={label} className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{label}</label>
                        <input type={type} placeholder={ph}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all" />
                    </div>
                ))}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Créditos Iniciais</label>
                    <input type="number" defaultValue={1000} min={100}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all" />
                    <p className="text-[10px] text-text-secondary">Disponível: {PLATFORM.remaining.toLocaleString('pt-BR')} créditos na plataforma</p>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Limite de Leads</label>
                    <input type="number" defaultValue={500} min={50}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all" />
                </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Criar Vendedor
            </button>
        </motion.div>
    );
}

// ══════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════

export default function AdminPage() {
    const [tab, setTab] = useState<Tab>('visao-geral');
    const [showNewVendedor, setShowNewVendedor] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedVendedor, setExpandedVendedor] = useState<string | null>(null);

    const tabs: { id: Tab; label: string }[] = [
        { id: 'visao-geral', label: 'Visão Geral' },
        { id: 'vendedores',  label: 'Vendedores' },
        { id: 'equipes',     label: 'Por Equipe' },
        { id: 'creditos',    label: 'Créditos' },
    ];

    const filteredVendedores = VENDEDORES.filter(v =>
        !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.email.toLowerCase().includes(search.toLowerCase())
    );

    const globalStats = [
        { label: "Vendedores Ativos",  value: VENDEDORES.length.toString(),                                       trend: "+1",    positive: true,  icon: Briefcase   },
        { label: "Webscoutersers",     value: WEBSCOUTERSERS.length.toString(),                                    trend: "+2",    positive: true,  icon: Users       },
        { label: "Leads na Base",      value: (VENDEDORES.reduce((a,v)=>a+v.leadsTotal,0)).toString(),             trend: "+56",   positive: true,  icon: Target      },
        { label: "Conversão Global",   value: `${(VENDEDORES.reduce((a,v)=>a+v.conversionRate,0)/VENDEDORES.length).toFixed(1)}%`, trend:"+0.6%", positive:true, icon: TrendingUp },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Painel Administrativo" subtitle="ADM — Gerencie vendedores, equipes, créditos e performance global." showActions={false} />

            {/* Hierarquia visual */}
            <div className="px-8 pt-5 pb-0">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 w-fit text-xs font-bold">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                        <Shield className="w-3.5 h-3.5" /><span>ADM</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-text-secondary" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Briefcase className="w-3.5 h-3.5" /><span>VENDEDOR</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-text-secondary" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <Zap className="w-3.5 h-3.5" /><span>WEBSCOUTER</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-8 pt-5 border-b border-white/5">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all relative",
                            tab === t.id ? "text-primary" : "text-text-secondary hover:text-foreground"
                        )}>
                        {t.label}
                        {tab === t.id && <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                ))}
            </div>

            <div className="p-8 space-y-8 overflow-y-auto flex-1">

                {/* ── VISÃO GERAL ──────────────────────────── */}
                {tab === 'visao-geral' && (
                    <>
                        {/* Stats globais */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                            {globalStats.map((s, i) => <StatCard key={i} {...s} />)}
                        </div>

                        {/* Anti-duplicidade */}
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm mb-1">Sistema Anti-Duplicidade Ativo</p>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Leads cruzados entre todos os vendedores e webscoutersers. Nenhum perfil pode ser trabalhado por duas equipes simultâneas.
                                    <span className="text-amber-400 font-bold ml-1">3 tentativas de duplicação bloqueadas esta semana.</span>
                                </p>
                            </div>
                        </div>

                        {/* Ranking de Vendedores */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-outfit font-bold flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Ranking de Vendedores</h3>
                            </div>
                            <div className="divide-y divide-white/5">
                                {[...VENDEDORES].sort((a,b) => b.conversionRate - a.conversionRate).map((v, i) => (
                                    <div key={v.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-outfit font-bold flex-shrink-0",
                                            i === 0 ? "bg-primary text-black" : i === 1 ? "bg-white/20" : "bg-white/10 text-text-secondary"
                                        )}>{i + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm">{v.name}</p>
                                            <p className="text-[10px] text-text-secondary">{v.team} · {v.webscoutersCount} webscoutersers</p>
                                        </div>
                                        <div className="grid grid-cols-4 gap-8 text-right">
                                            {[
                                                ["Leads", v.leadsTotal],
                                                ["Abordados", v.leadsApproached],
                                                ["Conversão", `${v.conversionRate}%`],
                                                ["Resposta", `${v.responseRate}%`],
                                            ].map(([k, val]) => (
                                                <div key={k}>
                                                    <p className={cn("font-outfit font-bold text-sm", k === "Conversão" && v.conversionRate >= 10 ? "text-success" : k === "Conversão" ? "text-primary" : "")}>{val}</p>
                                                    <p className="text-[9px] text-text-secondary uppercase">{k}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", v.status === 'active' ? "bg-success" : "bg-amber-400")} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Consumo de créditos resumo */}
                        <div className="grid grid-cols-3 gap-5">
                            {[
                                { label: "Créditos Plataforma",   value: PLATFORM.total.toLocaleString('pt-BR'),     sub: "Total disponível", color: "text-primary" },
                                { label: "Alocado a Vendedores",  value: PLATFORM.allocated.toLocaleString('pt-BR'), sub: `${((PLATFORM.allocated/PLATFORM.total)*100).toFixed(0)}% do total`, color: "text-blue-400" },
                                { label: "Disponível para Alocar",value: PLATFORM.remaining.toLocaleString('pt-BR'), sub: "Não alocado ainda", color: "text-success" },
                            ].map(c => (
                                <div key={c.label} className="glass-effect rounded-2xl p-6 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{c.label}</p>
                                    <p className={cn("text-4xl font-outfit font-bold", c.color)}>{c.value}</p>
                                    <p className="text-xs text-text-secondary">{c.sub}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ── VENDEDORES ───────────────────────────── */}
                {tab === 'vendedores' && (
                    <>
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar vendedor..."
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 transition-all" />
                            </div>
                            <button onClick={() => setShowNewVendedor(!showNewVendedor)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4" />Novo Vendedor
                            </button>
                        </div>

                        <AnimatePresence>
                            {showNewVendedor && <NewVendedorForm onClose={() => setShowNewVendedor(false)} />}
                        </AnimatePresence>

                        <div className="space-y-4">
                            {filteredVendedores.map(v => {
                                const scouts = WEBSCOUTERSERS.filter(w => w.vendedorId === v.id);
                                const isExpanded = expandedVendedor === v.id;
                                const creditPct = (v.creditsDistributed / v.creditsReceived) * 100;
                                return (
                                    <div key={v.id} className="glass-effect rounded-2xl border border-white/5 overflow-hidden">
                                        {/* Header do vendedor */}
                                        <div className="px-6 py-5 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base flex-shrink-0">
                                                {v.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold">{v.name}</p>
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">Vendedor</span>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", v.status === 'active' ? "bg-success" : "bg-amber-400")} />
                                                </div>
                                                <p className="text-xs text-text-secondary">{v.email} · {v.team} · {v.webscoutersCount} webscoutersers</p>
                                            </div>
                                            {/* Métricas rápidas */}
                                            <div className="hidden lg:grid grid-cols-4 gap-6 text-right">
                                                {[["Leads", v.leadsTotal], ["Abordados", v.leadsApproached], ["Conversão", `${v.conversionRate}%`], ["Resposta", `${v.responseRate}%`]].map(([k, val]) => (
                                                    <div key={k}>
                                                        <p className="font-outfit font-bold text-sm">{val}</p>
                                                        <p className="text-[9px] text-text-secondary uppercase">{k}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => setExpandedVendedor(isExpanded ? null : v.id)}
                                                className="p-2 hover:bg-white/10 rounded-xl transition-all flex-shrink-0">
                                                <ChevronRight className={cn("w-4 h-4 text-text-secondary transition-transform", isExpanded && "rotate-90")} />
                                            </button>
                                        </div>

                                        {/* Créditos do vendedor */}
                                        <div className="px-6 pb-4">
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="text-text-secondary font-medium">Créditos distribuídos aos webscoutersers</span>
                                                <span className="font-bold">{v.creditsDistributed.toLocaleString('pt-BR')} / {v.creditsReceived.toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full", creditPct > 85 ? "bg-amber-400" : "bg-blue-400")} style={{ width: `${creditPct}%` }} />
                                            </div>
                                            <p className="text-[10px] text-text-secondary mt-1">
                                                {(v.creditsReceived - v.creditsDistributed).toLocaleString('pt-BR')} créditos ainda não distribuídos
                                            </p>
                                        </div>

                                        {/* Webscoutersers expandidos */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                                                    <div className="divide-y divide-white/5">
                                                        {scouts.map(w => (
                                                            <div key={w.id} className="px-6 py-3.5 flex items-center gap-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                                                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0">
                                                                    {w.name.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-bold text-sm">{w.name}</p>
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">Webscouter</span>
                                                                        <div className={cn("w-1.5 h-1.5 rounded-full", w.status === 'active' ? "bg-success" : "bg-amber-400")} />
                                                                    </div>
                                                                    <p className="text-[10px] text-text-secondary">{w.email} · {w.lastSeen}</p>
                                                                </div>
                                                                <div className="grid grid-cols-5 gap-5 text-right">
                                                                    <div><p className="text-xs font-bold">{w.creditsUsed}/{w.creditsReceived}</p><p className="text-[9px] text-text-secondary">Créditos</p></div>
                                                                    <div><p className="text-xs font-bold">{w.leadsTotal}</p><p className="text-[9px] text-text-secondary">Leads</p></div>
                                                                    <div><p className="text-xs font-bold">{w.leadsApproached}</p><p className="text-[9px] text-text-secondary">Abord.</p></div>
                                                                    <div><p className={cn("text-xs font-bold font-outfit", w.conversionRate >= 10 ? "text-success" : "text-primary")}>{w.conversionRate}%</p><p className="text-[9px] text-text-secondary">Conv.</p></div>
                                                                    <div><p className="text-xs font-bold">{w.responseRate}%</p><p className="text-[9px] text-text-secondary">Resp.</p></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {scouts.length === 0 && (
                                                            <div className="px-6 py-4 text-center text-xs text-text-secondary italic">Nenhum webscouter nesta equipe.</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── POR EQUIPE ───────────────────────────── */}
                {tab === 'equipes' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {VENDEDORES.map(v => {
                            const scouts = WEBSCOUTERSERS.filter(w => w.vendedorId === v.id);
                            const teamLeads = scouts.reduce((a, w) => a + w.leadsTotal, 0);
                            const teamConverted = scouts.reduce((a, w) => a + w.leadsConverted, 0);
                            const teamRate = teamLeads > 0 ? ((teamConverted / teamLeads) * 100).toFixed(1) : "0";
                            return (
                                <div key={v.id} className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                                    {/* Header do time */}
                                    <div className="px-5 py-4 border-b border-white/5 bg-blue-500/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-outfit font-bold">{v.team}</p>
                                                <p className="text-[10px] text-text-secondary mt-0.5">Vendedor: <span className="text-blue-400 font-bold">{v.name}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-outfit font-bold text-primary">{teamRate}%</p>
                                                <p className="text-[10px] text-text-secondary">conv. média</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stats do time */}
                                    <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                                        {[["Leads", teamLeads], ["Convertidos", teamConverted], ["Webscoutersers", scouts.length]].map(([k,v]) => (
                                            <div key={k} className="px-4 py-3 text-center">
                                                <p className="text-xl font-outfit font-bold">{v}</p>
                                                <p className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">{k}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Membros */}
                                    <div className="divide-y divide-white/5">
                                        {scouts.map(w => (
                                            <div key={w.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", w.status === 'active' ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400")}>
                                                        {w.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">{w.name}</p>
                                                        <p className="text-[10px] text-text-secondary">{w.lastSeen}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-right">
                                                    <div><p className="text-xs font-bold">{w.leadsApproached}</p><p className="text-[9px] text-text-secondary">abord.</p></div>
                                                    <div><p className={cn("text-xs font-bold font-outfit", w.conversionRate >= 10 ? "text-success" : "text-primary")}>{w.conversionRate}%</p><p className="text-[9px] text-text-secondary">conv.</p></div>
                                                    <div><p className="text-xs font-bold">{w.responseRate}%</p><p className="text-[9px] text-text-secondary">resp.</p></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── CRÉDITOS ─────────────────────────────── */}
                {tab === 'creditos' && (
                    <>
                        {/* Cascata de créditos */}
                        <div className="glass-effect rounded-2xl p-6 border border-white/5 space-y-6">
                            <h3 className="font-outfit font-bold flex items-center gap-2"><Coins className="w-5 h-5 text-primary" />Cascata de Créditos</h3>
                            {/* Plataforma */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-sm">Plataforma (ADM)</span>
                                    </div>
                                    <span className="font-outfit font-bold text-primary">{PLATFORM.total.toLocaleString('pt-BR')} créditos</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(PLATFORM.allocated/PLATFORM.total)*100}%` }} />
                                </div>
                                <div className="flex justify-between text-xs text-text-secondary">
                                    <span>{PLATFORM.allocated.toLocaleString('pt-BR')} alocado a vendedores</span>
                                    <span className="text-success font-bold">{PLATFORM.remaining.toLocaleString('pt-BR')} disponível</span>
                                </div>
                            </div>

                            {/* Por vendedor */}
                            <div className="space-y-4 pl-6 border-l-2 border-white/5">
                                {VENDEDORES.map(v => {
                                    const scouts = WEBSCOUTERSERS.filter(w => w.vendedorId === v.id);
                                    return (
                                        <div key={v.id} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="font-bold text-sm text-blue-400">{v.name}</span>
                                                    <span className="text-[10px] text-text-secondary">({v.team})</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-text-secondary">recebeu <span className="font-bold text-foreground">{v.creditsReceived.toLocaleString('pt-BR')}</span></span>
                                                    <span className="text-xs text-text-secondary">distribuiu <span className="font-bold text-blue-400">{v.creditsDistributed.toLocaleString('pt-BR')}</span></span>
                                                    <span className="text-xs text-success font-bold">+{(v.creditsReceived-v.creditsDistributed).toLocaleString('pt-BR')} livre</span>
                                                </div>
                                            </div>
                                            {/* Webscoutersers deste vendedor */}
                                            <div className="space-y-2 pl-5 border-l-2 border-white/5">
                                                {scouts.map(w => (
                                                    <div key={w.id} className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="w-3 h-3 text-purple-400" />
                                                            <span className="text-purple-300">{w.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2 w-32">
                                                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                                                    <div className={cn("h-full rounded-full", (w.creditsUsed/w.creditsReceived) > 0.85 ? "bg-amber-400" : "bg-purple-400")}
                                                                        style={{ width: `${(w.creditsUsed/w.creditsReceived)*100}%` }} />
                                                                </div>
                                                            </div>
                                                            <span className="text-text-secondary">{w.creditsUsed}/{w.creditsReceived}</span>
                                                            <span className={cn("font-bold", (w.creditsReceived-w.creditsUsed) < 50 ? "text-amber-400" : "text-success")}>
                                                                +{w.creditsReceived-w.creditsUsed} livre
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Alocar créditos a vendedores */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5">
                                <h3 className="font-outfit font-bold">Alocar Créditos — ADM → Vendedor</h3>
                                <p className="text-xs text-text-secondary mt-1">Disponível para alocação: <span className="text-primary font-bold">{PLATFORM.remaining.toLocaleString('pt-BR')} créditos</span></p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {VENDEDORES.map(v => (
                                    <div key={v.id} className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">{v.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm">{v.name}</p>
                                            <CreditBar used={v.creditsDistributed} total={v.creditsReceived} />
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <input type="number" defaultValue={500} min={100} step={100}
                                                className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-center outline-none focus:border-primary/40 transition-all" />
                                            <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all whitespace-nowrap">Adicionar</button>
                                            <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-text-secondary text-xs font-bold hover:bg-white/10 transition-all">Zerar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
