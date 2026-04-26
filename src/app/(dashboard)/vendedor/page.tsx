"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import {
    Users, TrendingUp, Target, MessageSquare, Plus, MoreHorizontal,
    Zap, ChevronDown, Check, Award, ArrowUpRight, Coins, Briefcase,
    Search, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Mock: dados do vendedor logado (Carlos Mendes - Time Alpha) ──
const MY_TEAM = {
    vendedor: { name: "Carlos Mendes", team: "Time Alpha", creditsReceived: 2000, creditsDistributed: 1100, creditsUsed: 712 },
    webscoutersers: [
        { id: "w1", name: "Rafaela Costa",  email: "rafaela@dws.com",  creditsReceived: 600, creditsUsed: 312, leadsTotal: 89,  leadsApproached: 67, leadsConverted: 8, responseRate: 42, conversionRate: 11.9, status: "active",  lastSeen: "há 5 min" },
        { id: "w2", name: "Bruno Matos",    email: "bruno@dws.com",    creditsReceived: 500, creditsUsed: 400, leadsTotal: 74,  leadsApproached: 58, leadsConverted: 5, responseRate: 38, conversionRate:  8.6, status: "active",  lastSeen: "há 1h"   },
        { id: "w3", name: "Ana Rodrigues",  email: "ana@dws.com",      creditsReceived:   0, creditsUsed:   0, leadsTotal:  0,  leadsApproached:  0, leadsConverted: 0, responseRate:  0, conversionRate:  0.0, status: "new",    lastSeen: "nunca"   },
    ],
};

const { vendedor, webscoutersers } = MY_TEAM;
const creditsFree = vendedor.creditsReceived - vendedor.creditsDistributed;

type Tab = 'equipe' | 'creditos' | 'novo';

export default function VendedorPage() {
    const [tab, setTab] = useState<Tab>('equipe');
    const [showNewScout, setShowNewScout] = useState(false);
    const [allocations, setAllocations] = useState<Record<string, number>>(
        Object.fromEntries(webscoutersers.map(w => [w.id, 100]))
    );

    const totalAllocating = Object.values(allocations).reduce((a, b) => a + b, 0);

    const tabs = [
        { id: 'equipe' as Tab, label: 'Minha Equipe' },
        { id: 'creditos' as Tab, label: 'Distribuir Créditos' },
        { id: 'novo' as Tab, label: 'Adicionar Webscouter' },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header
                title="Painel do Vendedor"
                subtitle={`${vendedor.name} · ${vendedor.team}`}
                showActions={false}
            />

            {/* Stats rápidos do vendedor */}
            <div className="px-8 pt-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: "Webscoutersers",     value: webscoutersers.length,                                        color: "text-primary"  },
                        { label: "Total Leads",        value: webscoutersers.reduce((a,w)=>a+w.leadsTotal,0),              color: "text-foreground"},
                        { label: "Total Abordados",    value: webscoutersers.reduce((a,w)=>a+w.leadsApproached,0),         color: "text-foreground"},
                        { label: "Conversão Média",    value: `${(webscoutersers.filter(w=>w.conversionRate>0).reduce((a,w)=>a+w.conversionRate,0)/Math.max(webscoutersers.filter(w=>w.conversionRate>0).length,1)).toFixed(1)}%`, color: "text-success" },
                        { label: "Créditos Livres",    value: creditsFree.toLocaleString('pt-BR'),                         color: creditsFree < 100 ? "text-amber-400" : "text-success" },
                    ].map((s, i) => (
                        <div key={i} className="glass-effect rounded-xl p-4 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{s.label}</p>
                            <p className={cn("text-2xl font-outfit font-bold", s.color)}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-8 pt-6 border-b border-white/5">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all relative",
                            tab === t.id ? "text-primary" : "text-text-secondary hover:text-foreground"
                        )}>
                        {t.label}
                        {tab === t.id && <motion.div layoutId="vendedor-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                ))}
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1">

                {/* ── MINHA EQUIPE ─────────────────────────── */}
                {tab === 'equipe' && (
                    <>
                        {/* Ranking da equipe */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-outfit font-bold flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Ranking da Equipe — {vendedor.team}</h3>
                                <button onClick={() => setTab('novo')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/15 transition-all">
                                    <Plus className="w-3.5 h-3.5" />Adicionar Webscouter
                                </button>
                            </div>

                            {/* Tabela */}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        {["#", "Webscouter", "Créditos", "Leads", "Abordados", "Conversão", "Resposta", "Status"].map(h => (
                                            <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...webscoutersers].sort((a,b) => b.conversionRate - a.conversionRate).map((w, i) => (
                                        <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-5 py-3.5">
                                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-outfit font-bold",
                                                    i === 0 ? "bg-primary text-black" : "bg-white/10 text-text-secondary"
                                                )}>{i+1}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                                        w.status === 'active' ? "bg-purple-500/20 text-purple-400" :
                                                        w.status === 'new'    ? "bg-white/10 text-text-secondary" :
                                                        "bg-amber-500/20 text-amber-400"
                                                    )}>{w.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="font-bold text-sm">{w.name}</p>
                                                        <p className="text-[10px] text-text-secondary">{w.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {w.creditsReceived > 0 ? (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold">{w.creditsUsed}<span className="text-text-secondary font-normal">/{w.creditsReceived}</span></p>
                                                        <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                                            <div className={cn("h-full rounded-full", (w.creditsUsed/w.creditsReceived) > 0.85 ? "bg-amber-400" : "bg-purple-400")}
                                                                style={{ width: `${(w.creditsUsed/w.creditsReceived)*100}%` }} />
                                                        </div>
                                                    </div>
                                                ) : <span className="text-xs text-text-secondary italic">sem créditos</span>}
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-sm">{w.leadsTotal || "—"}</td>
                                            <td className="px-5 py-3.5 font-bold text-sm">{w.leadsApproached || "—"}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={cn("font-outfit font-bold text-sm", w.conversionRate >= 10 ? "text-success" : w.conversionRate > 0 ? "text-primary" : "text-text-secondary")}>
                                                    {w.conversionRate > 0 ? `${w.conversionRate}%` : "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-sm">{w.responseRate > 0 ? `${w.responseRate}%` : "—"}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full",
                                                        w.status === 'active' ? "bg-success" :
                                                        w.status === 'new'    ? "bg-blue-400" :
                                                        "bg-amber-400"
                                                    )} />
                                                    <span className="text-[10px] text-text-secondary">{w.lastSeen}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Alerta webscouter sem créditos */}
                        {webscoutersers.some(w => w.creditsReceived === 0) && (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <p className="text-xs text-amber-300">
                                    <span className="font-bold">{webscoutersers.filter(w => w.creditsReceived === 0).map(w => w.name).join(", ")}</span>
                                    {" "}ainda não recebeu créditos. Distribua em <button onClick={() => setTab('creditos')} className="underline font-bold">Distribuir Créditos</button>.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* ── DISTRIBUIR CRÉDITOS ───────────────────── */}
                {tab === 'creditos' && (
                    <>
                        {/* Meu saldo */}
                        <div className="glass-effect rounded-2xl p-6 border border-white/5">
                            <h3 className="font-outfit font-bold mb-5 flex items-center gap-2"><Coins className="w-5 h-5 text-primary" />Meus Créditos — {vendedor.team}</h3>
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { label: "Recebi do ADM",      value: vendedor.creditsReceived.toLocaleString('pt-BR'),    color: "text-primary"   },
                                    { label: "Distribuí à equipe", value: vendedor.creditsDistributed.toLocaleString('pt-BR'),  color: "text-blue-400"  },
                                    { label: "Disponível p/ dist.", value: creditsFree.toLocaleString('pt-BR'),                 color: creditsFree < 100 ? "text-amber-400" : "text-success" },
                                ].map(s => (
                                    <div key={s.label} className="text-center space-y-1 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{s.label}</p>
                                        <p className={cn("text-3xl font-outfit font-bold", s.color)}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                            {/* Barra geral */}
                            <div className="mt-5 space-y-1.5">
                                <div className="flex justify-between text-xs text-text-secondary">
                                    <span>Alocado à equipe</span>
                                    <span className="font-bold">{((vendedor.creditsDistributed/vendedor.creditsReceived)*100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(vendedor.creditsDistributed/vendedor.creditsReceived)*100}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Distribuir por webscouter */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-outfit font-bold">Distribuir para Webscoutersers</h3>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-text-secondary">Total nesta distribuição:</span>
                                    <span className={cn("font-outfit font-bold", totalAllocating > creditsFree ? "text-danger" : "text-success")}>
                                        {totalAllocating.toLocaleString('pt-BR')} créditos
                                    </span>
                                    {totalAllocating > creditsFree && (
                                        <span className="text-danger font-bold">· Excede em {(totalAllocating-creditsFree).toLocaleString('pt-BR')}!</span>
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {webscoutersers.map(w => (
                                    <div key={w.id} className="px-6 py-4 flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold flex-shrink-0">{w.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm">{w.name}</p>
                                            {w.creditsReceived > 0 ? (
                                                <div className="mt-1">
                                                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className={cn("h-full rounded-full", (w.creditsUsed/w.creditsReceived)>0.85?"bg-amber-400":"bg-purple-400")}
                                                            style={{ width: `${(w.creditsUsed/w.creditsReceived)*100}%` }} />
                                                    </div>
                                                    <p className="text-[10px] text-text-secondary mt-0.5">já tem: {w.creditsReceived-w.creditsUsed} livres</p>
                                                </div>
                                            ) : <p className="text-[10px] text-amber-400 mt-0.5">sem créditos ainda</p>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setAllocations(p => ({ ...p, [w.id]: Math.max(0, (p[w.id]||0)-50) }))}
                                                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:bg-white/10 font-bold transition-all">−</button>
                                                <input type="number" value={allocations[w.id] || 0} min={0} step={50}
                                                    onChange={e => setAllocations(p => ({ ...p, [w.id]: Math.max(0, Number(e.target.value)) }))}
                                                    className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-center outline-none focus:border-primary/40 transition-all" />
                                                <button onClick={() => setAllocations(p => ({ ...p, [w.id]: (p[w.id]||0)+50 }))}
                                                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:bg-white/10 font-bold transition-all">+</button>
                                            </div>
                                            <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/15 transition-all whitespace-nowrap">
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 border-t border-white/5 flex justify-end">
                                <button disabled={totalAllocating > creditsFree}
                                    className="px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20">
                                    Distribuir Todos ({totalAllocating} créditos)
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── NOVO WEBSCOUTER ───────────────────────── */}
                {tab === 'novo' && (
                    <div className="max-w-2xl">
                        <div className="glass-effect rounded-2xl p-8 border border-white/5 space-y-6">
                            <div>
                                <h3 className="font-outfit font-bold text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Adicionar Webscouter à {vendedor.team}</h3>
                                <p className="text-xs text-text-secondary mt-1">O webscouter será vinculado automaticamente à sua equipe.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[["Nome Completo","text","Ex: João Silva"],["E-mail","email","email@dws.com"],["Senha Temporária","password","••••••••"],["WhatsApp","tel","+55 11 99999-0000"]].map(([label,type,ph]) => (
                                    <div key={label} className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{label}</label>
                                        <input type={type} placeholder={ph}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all" />
                                    </div>
                                ))}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Créditos Iniciais</label>
                                    <input type="number" defaultValue={200} min={50}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all" />
                                    <p className="text-[10px] text-text-secondary">Disponível: <span className={cn("font-bold", creditsFree < 100 ? "text-amber-400" : "text-success")}>{creditsFree} créditos</span></p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Limite de Leads</label>
                                    <input type="number" defaultValue={200} min={10}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all" />
                                </div>
                            </div>
                            <button className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" />Criar Webscouter
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
