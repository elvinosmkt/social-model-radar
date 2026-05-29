"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import {
    Users, Target, Plus, Award, Coins, Zap, ChevronDown, Check,
    AlertCircle, Loader2, Briefcase, Mail, Phone, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "@/services/user-service";
import { creditService } from "@/services/credit-service";
import { useAuth } from "@/lib/context/AuthContext";

type Tab = 'equipe' | 'creditos' | 'novo';

export default function VendedorPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('equipe');
    
    // Live State
    const [vendedor, setVendedor] = useState<any>({ name: "Vendedor", team: "Equipe", creditsReceived: 0, creditsDistributed: 0, creditsUsed: 0 });
    const [webscouters, setWebscouters] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [distributing, setDistributing] = useState<string | null>(null);

    // Form inputs for creating a new webscouter
    const [scoutName, setScoutName] = useState("");
    const [scoutEmail, setScoutEmail] = useState("");
    const [scoutPassword, setScoutPassword] = useState("");
    const [scoutPhone, setScoutPhone] = useState("");
    const [scoutInitialCredits, setScoutInitialCredits] = useState(200);
    const [scoutLeadLimit, setScoutLeadLimit] = useState(200);
    const [scoutLoading, setScoutLoading] = useState(false);
    const [scoutError, setScoutError] = useState("");

    const loadSellerData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            // 1. Fetch seller profile
            const profile = await userService.getUserProfile(user.id);
            const creditsInfo = await creditService.getUserCredits(user.id);

            // 2. Fetch webscouters under this seller
            const scoutsList = await userService.getWebscouters(user.id);
            setWebscouters(scoutsList);

            const distributed = scoutsList.reduce((sum, w) => sum + (w.creditsReceived || 0), 0);

            setVendedor({
                name: profile?.nome || "Carlos Mendes",
                team: profile?.team_id || "Time Alpha",
                creditsReceived: creditsInfo.total_allocated || 2000,
                creditsDistributed: distributed,
                creditsUsed: creditsInfo.total_consumed || 0
            });

            // Initialize allocation input values
            const initialAllocations: Record<string, number> = {};
            scoutsList.forEach(w => {
                initialAllocations[w.id] = 100;
            });
            setAllocations(initialAllocations);
        } catch (err) {
            console.error("Failed to load seller team stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSellerData();
    }, [user]);

    const creditsFree = Math.max(0, vendedor.creditsReceived - vendedor.creditsDistributed);
    const totalAllocating = Object.values(allocations).reduce((a, b) => a + b, 0);

    const tabs = [
        { id: 'equipe' as Tab, label: 'Minha Equipe' },
        { id: 'creditos' as Tab, label: 'Distribuir Créditos' },
        { id: 'novo' as Tab, label: 'Adicionar Webscouter' },
    ];

    // Distribute credits single action
    const handleDistributeCreditsSingle = async (webscouterId: string, amount: number) => {
        if (!user) return;
        if (amount <= 0) return;
        if (amount > creditsFree) {
            alert(`Créditos insuficientes. Seu saldo disponível: ${creditsFree}`);
            return;
        }

        setDistributing(webscouterId);
        try {
            await creditService.distributeCredits(user.id, webscouterId, amount);
            alert("Créditos distribuídos com sucesso!");
            await loadSellerData();
        } catch (e: any) {
            alert(`Erro na distribuição: ${e.message}`);
        } finally {
            setDistributing(null);
        }
    };

    // Distribute credits to all team members
    const handleDistributeCreditsAll = async () => {
        if (!user) return;
        if (totalAllocating > creditsFree) {
            alert(`O total planejado (${totalAllocating}) excede seu saldo disponível (${creditsFree}).`);
            return;
        }

        setLoading(true);
        try {
            for (const [scoutId, amount] of Object.entries(allocations)) {
                if (amount > 0) {
                    await creditService.distributeCredits(user.id, scoutId, amount);
                }
            }
            alert("Todos os créditos foram alocados com sucesso!");
            await loadSellerData();
            setTab('equipe');
        } catch (e: any) {
            alert(`Erro ao distribuir lote: ${e.message}`);
            await loadSellerData();
        } finally {
            setLoading(false);
        }
    };

    // Form submit for creating a new webscouter
    const handleCreateWebscouterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setScoutError("");
        setScoutLoading(true);

        if (scoutInitialCredits > creditsFree) {
            setScoutError(`Você não pode alocar ${scoutInitialCredits} créditos iniciais. Seu limite disponível: ${creditsFree}`);
            setScoutLoading(false);
            return;
        }

        try {
            await userService.createWebscouter({
                name: scoutName,
                email: scoutEmail,
                password: scoutPassword,
                phone: scoutPhone,
                initialCredits: scoutInitialCredits,
                leadLimit: scoutLeadLimit
            });

            // If seller had enough credits, subtract from their balance locally/real
            if (scoutInitialCredits > 0 && user) {
                try {
                    await creditService.distributeCredits(user.id, user.id, -scoutInitialCredits); // adjust seller balance
                } catch (e) {}
            }

            alert(`Sucesso! O webscouter ${scoutName} foi cadastrado.`);
            setScoutName("");
            setScoutEmail("");
            setScoutPassword("");
            setScoutPhone("");
            await loadSellerData();
            setTab('equipe');
        } catch (err: any) {
            console.error(err);
            setScoutError(err.message || "Falha ao registrar webscouter no Supabase.");
        } finally {
            setScoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium">Carregando painel do vendedor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header
                title="Painel do Vendedor"
                subtitle={`${vendedor.name} · ${vendedor.team}`}
                showActions={false}
            />

            {/* Quick stats grid */}
            <div className="px-4 md:px-8 pt-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { label: "Webscouters",        value: webscouters.length, color: "text-primary" },
                        { label: "Total Leads",        value: webscouters.reduce((a,w)=>a+w.leadsTotal,0), color: "text-white"},
                        { label: "Total Abordados",    value: webscouters.reduce((a,w)=>a+w.leadsApproached,0), color: "text-white"},
                        { label: "Conversão Média",    value: `${(webscouters.filter(w=>w.conversionRate>0).reduce((a,w)=>a+w.conversionRate,0)/Math.max(webscouters.filter(w=>w.conversionRate>0).length,1)).toFixed(1)}%`, color: "text-success" },
                        { label: "Seu Saldo Livre",    value: creditsFree.toLocaleString('pt-BR'), color: creditsFree < 100 ? "text-amber-400 animate-pulse" : "text-success" },
                    ].map((s, i) => (
                        <div key={i} className="glass-effect rounded-xl p-4 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{s.label}</p>
                            <p className={cn("text-2xl font-outfit font-bold", s.color)}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 md:px-8 pt-6 border-b border-white/5 overflow-x-auto no-scrollbar">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 cursor-pointer",
                            tab === t.id ? "text-primary" : "text-text-secondary hover:text-foreground"
                        )}>
                        {t.label}
                        {tab === t.id && <motion.div layoutId="vendedor-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-8 space-y-6 overflow-y-auto flex-1">

                {/* ── MINHA EQUIPE ─────────────────────────── */}
                {tab === 'equipe' && (
                    <>
                        {/* Team Table Grid */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                                <h3 className="font-outfit font-bold flex items-center gap-2 text-white"><Award className="w-5 h-5 text-primary" />Ranking da Equipe — {vendedor.team}</h3>
                                <button onClick={() => setTab('novo')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/15 transition-all cursor-pointer">
                                    <Plus className="w-3.5 h-3.5" />Adicionar Webscouter
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            {["#", "Webscouter", "Créditos", "Leads", "Abordados", "Conversão", "Status"].map(h => (
                                                <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...webscouters].sort((a,b) => b.conversionRate - a.conversionRate).map((w, i) => (
                                            <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-5 py-3.5">
                                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-outfit font-bold",
                                                        i === 0 ? "bg-primary text-black" : "bg-white/10 text-text-secondary"
                                                    )}>{i+1}</div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white",
                                                            w.status === 'active' ? "bg-purple-500/20 text-purple-400" :
                                                            w.status === 'new'    ? "bg-white/10 text-text-secondary" :
                                                            "bg-amber-500/20 text-amber-400"
                                                        )}>{w.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-bold text-sm text-white">{w.name}</p>
                                                            <p className="text-[10px] text-text-secondary font-medium">{w.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {w.creditsReceived > 0 ? (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-white">{w.creditsUsed}<span className="text-text-secondary font-normal">/{w.creditsReceived}</span></p>
                                                            <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                                                <div className={cn("h-full rounded-full", (w.creditsUsed/w.creditsReceived) > 0.85 ? "bg-amber-400" : "bg-purple-400")}
                                                                    style={{ width: `${(w.creditsUsed/w.creditsReceived)*100}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-xs text-text-secondary italic">sem créditos</span>}
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-sm text-white">{w.leadsTotal || 0}</td>
                                                <td className="px-5 py-3.5 font-bold text-sm text-white">{w.leadsApproached || 0}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={cn("font-outfit font-bold text-sm", w.conversionRate >= 10 ? "text-success" : w.conversionRate > 0 ? "text-primary" : "text-text-secondary")}>
                                                        {w.conversionRate > 0 ? `${w.conversionRate}%` : "0%"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                                            w.status === 'active' ? "bg-success" :
                                                            w.status === 'new'    ? "bg-blue-400" :
                                                            "bg-amber-400"
                                                        )} />
                                                        <span className="text-[10px] text-text-secondary font-bold">{w.lastSeen}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Webscouter lack of credits warning */}
                        {webscouters.some(w => w.creditsReceived === 0) && (
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
                                <p className="text-xs text-amber-300">
                                    <span className="font-bold">{webscouters.filter(w => w.creditsReceived === 0).map(w => w.name).join(", ")}</span>
                                    {" "}ainda não possui créditos de busca ativos. Acesse a aba <button onClick={() => setTab('creditos')} className="underline font-bold text-primary cursor-pointer">Distribuir Créditos</button> para alocar.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* ── DISTRIBUIR CRÉDITOS ───────────────────── */}
                {tab === 'creditos' && (
                    <>
                        {/* Vendedor Credit details card */}
                        <div className="glass-effect rounded-2xl p-6 border border-white/5">
                            <h3 className="font-outfit font-bold mb-5 flex items-center gap-2 text-white"><Coins className="w-5 h-5 text-primary" />Meus Créditos — {vendedor.team}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "Recebido do ADM",      value: vendedor.creditsReceived.toLocaleString('pt-BR'),    color: "text-primary"   },
                                    { label: "Distribuído à equipe", value: vendedor.creditsDistributed.toLocaleString('pt-BR'),  color: "text-blue-400"  },
                                    { label: "Disponível para alocar", value: creditsFree.toLocaleString('pt-BR'),                 color: creditsFree < 100 ? "text-amber-400" : "text-success" },
                                ].map(s => (
                                    <div key={s.label} className="text-center space-y-1 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{s.label}</p>
                                        <p className={cn("text-3xl font-outfit font-bold", s.color)}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 space-y-1.5">
                                <div className="flex justify-between text-xs text-text-secondary font-medium">
                                    <span>Alocado para webscouters</span>
                                    <span className="font-bold text-white">{vendedor.creditsReceived > 0 ? ((vendedor.creditsDistributed/vendedor.creditsReceived)*100).toFixed(0) : 0}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${vendedor.creditsReceived > 0 ? (vendedor.creditsDistributed/vendedor.creditsReceived)*100 : 0}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Credit distribution grid */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
                                <h3 className="font-outfit font-bold text-white">Distribuir para Webscouters</h3>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-text-secondary">Total alocação lote:</span>
                                    <span className={cn("font-outfit font-bold", totalAllocating > creditsFree ? "text-danger animate-pulse" : "text-success")}>
                                        {totalAllocating.toLocaleString('pt-BR')} créditos
                                    </span>
                                    {totalAllocating > creditsFree && (
                                        <span className="text-danger font-bold">· Excede em {(totalAllocating-creditsFree).toLocaleString('pt-BR')}!</span>
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {webscouters.map(w => (
                                    <div key={w.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold flex-shrink-0">{w.name.charAt(0)}</div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{w.name}</p>
                                                <p className="text-[10px] text-text-secondary">Saldo atual: {w.creditsReceived-w.creditsUsed} livres</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-end">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setAllocations(p => ({ ...p, [w.id]: Math.max(0, (p[w.id]||0)-50) }))}
                                                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:bg-white/10 font-bold transition-all cursor-pointer">−</button>
                                                <input type="number" value={allocations[w.id] || 0} min={0} step={50}
                                                    onChange={e => setAllocations(p => ({ ...p, [w.id]: Math.max(0, Number(e.target.value)) }))}
                                                    className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-center outline-none focus:border-primary/40 text-white font-bold" />
                                                <button onClick={() => setAllocations(p => ({ ...p, [w.id]: (p[w.id]||0)+50 }))}
                                                    className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:bg-white/10 font-bold transition-all cursor-pointer">+</button>
                                            </div>
                                            <button 
                                                onClick={() => handleDistributeCreditsSingle(w.id, allocations[w.id] || 0)}
                                                disabled={distributing === w.id || (allocations[w.id] || 0) <= 0}
                                                className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/15 transition-all whitespace-nowrap cursor-pointer disabled:opacity-40"
                                            >
                                                {distributing === w.id ? "Enviando..." : "Enviar"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 border-t border-white/5 flex justify-end">
                                <button 
                                    onClick={handleDistributeCreditsAll}
                                    disabled={totalAllocating > creditsFree || totalAllocating <= 0}
                                    className="px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20 cursor-pointer"
                                >
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
                                <h3 className="font-outfit font-bold text-lg flex items-center gap-2 text-white"><Zap className="w-5 h-5 text-primary" />Adicionar Webscouter à {vendedor.team}</h3>
                                <p className="text-xs text-text-secondary mt-1 font-medium">O novo contratado será cadastrado na equipe do Vendedor e vinculado automaticamente.</p>
                            </div>
                            <form onSubmit={handleCreateWebscouterSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nome Completo</label>
                                        <input type="text" value={scoutName} onChange={e => setScoutName(e.target.value)} required placeholder="Ex: João Silva"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 text-white font-medium placeholder:text-text-secondary/30" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">E-mail</label>
                                        <input type="email" value={scoutEmail} onChange={e => setScoutEmail(e.target.value)} required placeholder="email@dws.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 text-white font-medium placeholder:text-text-secondary/30" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Senha Temporária</label>
                                        <input type="password" value={scoutPassword} onChange={e => setScoutPassword(e.target.value)} required placeholder="••••••••"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 text-white font-medium placeholder:text-text-secondary/30" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Telefone / WhatsApp</label>
                                        <input type="tel" value={scoutPhone} onChange={e => setScoutPhone(e.target.value)} placeholder="+55 11 99999-0000"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 text-white font-medium placeholder:text-text-secondary/30" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Créditos Iniciais</label>
                                        <input type="number" value={scoutInitialCredits} onChange={e => setScoutInitialCredits(Number(e.target.value))} min={0}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 text-white font-medium" />
                                        <p className="text-[10px] text-text-secondary font-medium">Seu saldo disponível: <span className={cn("font-bold", creditsFree < 100 ? "text-amber-400" : "text-success")}>{creditsFree} créditos</span></p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Limite de Leads</label>
                                        <input type="number" value={scoutLeadLimit} onChange={e => setScoutLeadLimit(Number(e.target.value))} min={10}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 text-white font-medium" />
                                    </div>
                                </div>
                                {scoutError && <p className="text-xs text-danger font-medium">{scoutError}</p>}
                                <button type="submit" disabled={scoutLoading}
                                    className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer">
                                    {scoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Cadastrando...</> : <><Plus className="w-4 h-4" />Criar Webscouter</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
