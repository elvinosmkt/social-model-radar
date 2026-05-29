"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import {
    Users, TrendingUp, Target, Shield, Plus,
    AlertTriangle, Award, ArrowUpRight, ArrowDownRight,
    Search, ChevronRight, Coins, Briefcase, Zap,
    CheckCircle2, Loader2, AlertCircle, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "@/services/user-service";
import { creditService } from "@/services/credit-service";
import { useAuth } from "@/lib/context/AuthContext";

type Tab = 'visao-geral' | 'vendedores' | 'equipes' | 'creditos';

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

function CreditBar({ used, total }: { used: number; total: number }) {
    const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
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

interface NewVendedorFormProps {
    onClose: () => void;
    onSuccess: () => void;
    remainingCredits: number;
}

function NewVendedorForm({ onClose, onSuccess, remainingCredits }: NewVendedorFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [teamName, setTeamName] = useState("");
    const [initialCredits, setInitialCredits] = useState(1000);
    const [leadLimit, setLeadLimit] = useState(500);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (initialCredits > remainingCredits) {
            setError(`Você não pode alocar ${initialCredits} créditos. Limite disponível: ${remainingCredits}`);
            setLoading(false);
            return;
        }

        try {
            await userService.createVendedor({
                name,
                email,
                password,
                teamName,
                initialCredits,
                leadLimit
            });
            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2200);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao registrar vendedor no banco.");
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop glass overlay */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/85 backdrop-blur-md" 
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative w-full max-w-md bg-card-glass border border-white/10 rounded-3xl p-10 shadow-2xl backdrop-blur-3xl flex flex-col items-center justify-center text-center space-y-6 z-10"
                >
                    <div className="w-16 h-16 rounded-full bg-success/15 border border-success/35 flex items-center justify-center shadow-[0_0_35px_rgba(48,209,88,0.25)]">
                        <CheckCircle2 className="w-8 h-8 text-success animate-pulse" />
                    </div>
                    <div className="space-y-2.5">
                        <h3 className="text-2xl font-outfit font-bold text-white tracking-tight">Cadastro Concluído!</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            O vendedor <span className="text-primary font-bold">{name}</span> foi registrado com sucesso e está pronto para gerenciar sua equipe.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            {/* Backdrop glass overlay */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            {/* Modal Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-lg bg-card-glass border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-3xl space-y-6 z-10"
            >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-outfit text-xl font-bold flex items-center gap-2.5 text-white">
                        <Briefcase className="w-5 h-5 text-primary" /> Novo Vendedor
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="px-3 py-1.5 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-colors cursor-pointer text-xs font-bold border border-white/5"
                    >
                        Fechar
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nome Completo</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Maria Silva"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-medium shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">E-mail</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@dws.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-medium shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Senha Temporária</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-medium shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nome da Equipe</label>
                            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="Ex: Time Delta"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-medium shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Créditos Iniciais</label>
                            <input type="number" value={initialCredits} onChange={e => setInitialCredits(Number(e.target.value))} min={100}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-bold shadow-inner" />
                            <p className="text-[9px] text-text-secondary font-medium">Disponível: <span className="text-primary font-bold">{remainingCredits.toLocaleString('pt-BR')}</span> créditos</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Limite de Leads</label>
                            <input type="number" value={leadLimit} onChange={e => setLeadLimit(Number(e.target.value))} min={50}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-bold shadow-inner" />
                        </div>
                    </div>
                    {error && (
                        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 flex items-center gap-2.5 text-danger text-xs font-semibold">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <button type="submit" disabled={loading}
                        className="w-full py-4 rounded-xl bg-primary text-black font-extrabold text-sm hover:bg-primary-light disabled:opacity-50 transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group">
                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 skew-x-[-25deg] -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin text-black" />Registrando...</> : "Criar Vendedor"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function AdminPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('visao-geral');
    const [showNewVendedor, setShowNewVendedor] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedVendedor, setExpandedVendedor] = useState<string | null>(null);
    const [sellerToDelete, setSellerToDelete] = useState<{ id: string, name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleDeleteSeller = async () => {
        if (!sellerToDelete) return;
        setDeleteLoading(true);
        setDeleteError("");

        try {
            await userService.deleteUser(sellerToDelete.id);
            setSellerToDelete(null);
            loadAdminData();
        } catch (err: any) {
            console.error(err);
            setDeleteError(err.message || "Erro ao deletar vendedor.");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Live state
    const [vendedores, setVendedores] = useState<any[]>([]);
    const [webscouters, setWebscouters] = useState<any[]>([]);
    const [platformCredits, setPlatformCredits] = useState({ total: 10000, allocated: 0, remaining: 10000 });
    const [loading, setLoading] = useState(true);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            const sellersList = await userService.getSellers();
            const scoutsList = await userService.getWebscouters();
            setVendedores(sellersList);
            setWebscouters(scoutsList);

            const isMock = sellersList.length > 0 && String(sellersList[0].id).startsWith('v');
            const allocated = isMock ? 0 : sellersList.reduce((sum, s) => sum + s.creditsReceived, 0);
            const remaining = Math.max(0, 10000 - allocated);
            setPlatformCredits({
                total: 10000,
                allocated,
                remaining
            });
        } catch (err) {
            console.error("Failed to load admin data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    const tabs: { id: Tab; label: string }[] = [
        { id: 'visao-geral', label: 'Visão Geral' },
        { id: 'vendedores',  label: 'Vendedores' },
        { id: 'equipes',     label: 'Por Equipe' },
        { id: 'creditos',    label: 'Créditos' },
    ];

    const filteredVendedores = vendedores.filter(v =>
        !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.email.toLowerCase().includes(search.toLowerCase())
    );

    const globalStats = [
        { label: "Vendedores Ativos",  value: vendedores.length.toString(), trend: "+1", positive: true, icon: Briefcase },
        { label: "Webscouters Ativos", value: webscouters.length.toString(), trend: "+2", positive: true, icon: Users },
        { label: "Leads na Base",      value: (vendedores.reduce((a,v)=>a+v.leadsTotal,0)).toLocaleString(), trend: "+56", positive: true, icon: Target },
        { label: "Conversão Global",   value: `${vendedores.length > 0 ? (vendedores.reduce((a,v)=>a+v.conversionRate,0)/vendedores.length).toFixed(1) : "0"}%`, trend: "+0.6%", positive: true, icon: TrendingUp },
    ];

    const handleAddCredits = async (sellerId: string, amount: number) => {
        try {
            if (amount > platformCredits.remaining) {
                alert(`Créditos insuficientes na plataforma. Disponível: ${platformCredits.remaining}`);
                return;
            }
            // Add credits in database
            await creditService.distributeCredits(user!.id, sellerId, amount);
            alert("Créditos alocados com sucesso!");
            loadAdminData();
        } catch (e: any) {
            alert(`Erro ao alocar: ${e.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium">Carregando painel administrativo real...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header title="Painel Administrativo" subtitle="ADM — Gerencie vendedores, equipes, créditos e performance global." showActions={false} />

            {/* Hierarquia visual */}
            <div className="px-4 md:px-8 pt-5 pb-0">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 w-fit text-xs font-bold flex-wrap">
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
            <div className="flex gap-1 px-4 md:px-8 pt-5 border-b border-white/5 overflow-x-auto no-scrollbar">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all relative shrink-0 cursor-pointer",
                            tab === t.id ? "text-primary" : "text-text-secondary hover:text-foreground"
                        )}>
                        {t.label}
                        {tab === t.id && <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                ))}
            </div>

            <div className="p-4 md:p-8 space-y-8 overflow-y-auto flex-1">

                {/* ── VISÃO GERAL ──────────────────────────── */}
                {tab === 'visao-geral' && (
                    <>
                        {/* Stats globais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {globalStats.map((s, i) => <StatCard key={i} {...s} />)}
                        </div>

                        {/* Anti-duplicidade */}
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-sm mb-1 text-white">Sistema Anti-Duplicidade Ativo (Banco Cruzado)</p>
                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                    Os leads são verificados automaticamente na tabela global `leads_master` em tempo real. Nenhum perfil duplicado consome créditos adicionais.
                                    <span className="text-amber-400 font-bold ml-1">Prevenção automática ativa entre todas as equipes.</span>
                                </p>
                            </div>
                        </div>

                        {/* Ranking de Vendedores */}
                        <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-outfit font-bold flex items-center gap-2 text-white"><Award className="w-5 h-5 text-primary" />Ranking de Vendedores</h3>
                            </div>
                            <div className="divide-y divide-white/5 overflow-x-auto">
                                <div className="min-w-[600px] divide-y divide-white/5">
                                    {[...vendedores].sort((a,b) => b.conversionRate - a.conversionRate).map((v, i) => (
                                        <div key={v.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-outfit font-bold flex-shrink-0",
                                                i === 0 ? "bg-primary text-black" : i === 1 ? "bg-white/20 text-white" : "bg-white/10 text-text-secondary"
                                            )}>{i + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-white">{v.name}</p>
                                                <p className="text-[10px] text-text-secondary">{v.team} · {v.webscoutersCount} webscouters</p>
                                            </div>
                                            <div className="grid grid-cols-4 gap-8 text-right pr-4">
                                                {[
                                                    ["Leads", v.leadsTotal],
                                                    ["Abordados", v.leadsApproached],
                                                    ["Conversão", `${v.conversionRate}%`],
                                                    ["Resposta", `${v.responseRate}%`],
                                                ].map(([k, val]) => (
                                                    <div key={k} className="w-16">
                                                        <p className={cn("font-outfit font-bold text-sm text-white", k === "Conversão" && v.conversionRate >= 10 ? "text-success" : k === "Conversão" ? "text-primary" : "")}>{val}</p>
                                                        <p className="text-[9px] text-text-secondary uppercase">{k}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", v.status === 'active' ? "bg-success" : "bg-amber-400")} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Consumo de créditos resumo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { label: "Créditos Plataforma",   value: platformCredits.total.toLocaleString('pt-BR'),     sub: "Total global", color: "text-primary" },
                                { label: "Alocado a Vendedores",  value: platformCredits.allocated.toLocaleString('pt-BR'), sub: `${((platformCredits.allocated/platformCredits.total)*100).toFixed(0)}% do total`, color: "text-blue-400" },
                                { label: "Disponível para Alocar",value: platformCredits.remaining.toLocaleString('pt-BR'), sub: "Saldo livre", color: "text-success" },
                            ].map(c => (
                                <div key={c.label} className="glass-effect rounded-2xl p-6 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{c.label}</p>
                                    <p className={cn("text-4xl font-outfit font-bold", c.color)}>{c.value}</p>
                                    <p className="text-xs text-text-secondary font-medium">{c.sub}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ── VENDEDORES ───────────────────────────── */}
                {tab === 'vendedores' && (
                    <>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar vendedor..."
                                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50 transition-all text-white font-medium placeholder:text-text-secondary/30" />
                            </div>
                            <button onClick={() => setShowNewVendedor(!showNewVendedor)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer w-full sm:w-auto justify-center">
                                <Plus className="w-4 h-4" />Novo Vendedor
                            </button>
                        </div>

                        <AnimatePresence>
                            {showNewVendedor && (
                                <NewVendedorForm 
                                    onClose={() => setShowNewVendedor(false)} 
                                    remainingCredits={platformCredits.remaining}
                                    onSuccess={() => {
                                        setShowNewVendedor(false);
                                        loadAdminData();
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {sellerToDelete && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                                    {/* Backdrop */}
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }} 
                                        onClick={() => setSellerToDelete(null)}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                                    />
                                    
                                    {/* Confirmation Card */}
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                        transition={{ type: "spring", duration: 0.5 }}
                                        className="relative w-full max-w-md bg-card-glass border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-3xl space-y-6 z-10 text-center"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-danger/15 border border-danger/35 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(255,69,58,0.15)]">
                                            <AlertCircle className="w-6 h-6 text-danger" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-outfit text-xl font-bold text-white">Excluir Vendedor?</h3>
                                            <p className="text-xs text-text-secondary leading-relaxed">
                                                Tem certeza que deseja deletar permanentemente <span className="text-white font-bold">{sellerToDelete.name}</span>? 
                                                Esta ação excluirá permanentemente a equipe, os webscouters vinculados e todos os créditos distribuídos. Esta ação é irreversível.
                                            </p>
                                        </div>

                                        {deleteError && (
                                            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 flex items-center gap-2.5 text-danger text-xs font-semibold text-left">
                                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                <span>{deleteError}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                onClick={() => setSellerToDelete(null)}
                                                disabled={deleteLoading}
                                                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold text-xs cursor-pointer disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleDeleteSeller}
                                                disabled={deleteLoading}
                                                className="flex-1 py-3 rounded-xl bg-danger text-white hover:bg-danger-light transition-all font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-danger/20 disabled:opacity-50"
                                            >
                                                {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sim, Excluir"}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            {filteredVendedores.map(v => {
                                const scouts = webscouters.filter(w => w.vendedorId === v.id);
                                const isExpanded = expandedVendedor === v.id;
                                const creditPct = v.creditsReceived > 0 ? (v.creditsDistributed / v.creditsReceived) * 100 : 0;
                                return (
                                    <div key={v.id} className="glass-effect rounded-2xl border border-white/5 overflow-hidden">
                                        {/* Header do vendedor */}
                                        <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base flex-shrink-0">
                                                    {v.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-white text-sm">{v.name}</p>
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">Vendedor</span>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", v.status === 'active' ? "bg-success" : "bg-amber-400")} />
                                                    </div>
                                                    <p className="text-xs text-text-secondary">{v.email} · {v.team} · {v.webscoutersCount} webscouters</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="hidden lg:grid grid-cols-4 gap-6 text-right">
                                                    {[["Leads", v.leadsTotal], ["Abordados", v.leadsApproached], ["Conversão", `${v.conversionRate}%`], ["Resposta", `${v.responseRate}%`]].map(([k, val]) => (
                                                        <div key={k}>
                                                            <p className="font-outfit font-bold text-sm text-white">{val}</p>
                                                            <p className="text-[9px] text-text-secondary uppercase">{k}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                 <div className="flex items-center gap-1">
                                                     <button 
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             setSellerToDelete({ id: v.id, name: v.name });
                                                         }}
                                                         className="p-2 hover:bg-danger/15 text-text-secondary hover:text-danger rounded-xl transition-all flex-shrink-0 cursor-pointer border border-transparent hover:border-danger/20"
                                                         title="Excluir Vendedor"
                                                     >
                                                         <Trash2 className="w-4 h-4" />
                                                     </button>
                                                     <button onClick={() => setExpandedVendedor(isExpanded ? null : v.id)}
                                                         className="p-2 hover:bg-white/10 rounded-xl transition-all flex-shrink-0 cursor-pointer">
                                                         <ChevronRight className={cn("w-4 h-4 text-text-secondary transition-transform", isExpanded && "rotate-90")} />
                                                     </button>
                                                 </div>
                                            </div>
                                        </div>

                                        {/* Créditos do vendedor */}
                                        <div className="px-6 pb-4">
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="text-text-secondary font-medium">Créditos alocados para a equipe do Vendedor</span>
                                                <span className="font-bold text-white">{v.creditsDistributed.toLocaleString('pt-BR')} / {v.creditsReceived.toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className={cn("h-full rounded-full", creditPct > 85 ? "bg-amber-400" : "bg-blue-400")} style={{ width: `${creditPct}%` }} />
                                            </div>
                                            <p className="text-[10px] text-text-secondary mt-1">
                                                {(v.creditsReceived - v.creditsDistributed).toLocaleString('pt-BR')} créditos livres no time dele
                                            </p>
                                        </div>

                                        {/* Webscouters expandidos */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
                                                    <div className="divide-y divide-white/5">
                                                        {scouts.map(w => (
                                                            <div key={w.id} className="px-6 py-4 flex items-center justify-between gap-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex-wrap sm:flex-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0">
                                                                        {w.name.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-bold text-sm text-white">{w.name}</p>
                                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">Webscouter</span>
                                                                            <div className={cn("w-1.5 h-1.5 rounded-full", w.status === 'active' ? "bg-success" : "bg-amber-400")} />
                                                                        </div>
                                                                        <p className="text-[10px] text-text-secondary">{w.email} · {w.lastSeen}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-right pr-2">
                                                                    <div><p className="text-xs font-bold text-white">{w.creditsUsed}/{w.creditsReceived}</p><p className="text-[9px] text-text-secondary">Créditos</p></div>
                                                                    <div><p className="text-xs font-bold text-white">{w.leadsTotal}</p><p className="text-[9px] text-text-secondary">Leads</p></div>
                                                                    <div><p className="text-xs font-bold text-white">{w.leadsApproached}</p><p className="text-[9px] text-text-secondary">Abord.</p></div>
                                                                    <div><p className={cn("text-xs font-bold font-outfit", w.conversionRate >= 10 ? "text-success" : "text-primary")}>{w.conversionRate}%</p><p className="text-[9px] text-text-secondary">Conv.</p></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {scouts.length === 0 && (
                                                            <div className="px-6 py-4 text-center text-xs text-text-secondary italic font-medium">Nenhum webscouter nesta equipe de vendas ainda.</div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vendedores.map(v => {
                            const scouts = webscouters.filter(w => w.vendedorId === v.id);
                            const teamLeads = scouts.reduce((sum, w) => sum + w.leadsTotal, 0);
                            const teamConverted = scouts.reduce((sum, w) => sum + w.leadsConverted, 0);
                            const teamRate = teamLeads > 0 ? ((teamConverted / teamLeads) * 100).toFixed(1) : "0";
                            return (
                                <div key={v.id} className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                                    {/* Header do time */}
                                    <div className="px-5 py-4 border-b border-white/5 bg-blue-500/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-outfit font-bold text-white">{v.team}</p>
                                                <p className="text-[10px] text-text-secondary mt-0.5 font-medium">Vendedor: <span className="text-blue-400 font-bold">{v.name}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-outfit font-bold text-primary">{teamRate}%</p>
                                                <p className="text-[10px] text-text-secondary">conv. média</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Stats do time */}
                                    <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                                        {[["Leads", teamLeads], ["Convertidos", teamConverted], ["Membros", scouts.length]].map(([k,v]) => (
                                            <div key={k} className="px-4 py-3 text-center">
                                                <p className="text-xl font-outfit font-bold text-white">{v}</p>
                                                <p className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">{k}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Membros */}
                                    <div className="divide-y divide-white/5 max-h-[250px] overflow-y-auto no-scrollbar">
                                        {scouts.map(w => (
                                            <div key={w.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02]">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", w.status === 'active' ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400")}>
                                                        {w.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{w.name}</p>
                                                        <p className="text-[10px] text-text-secondary">{w.lastSeen}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-right">
                                                    <div><p className="text-xs font-bold text-white">{w.leadsApproached}</p><p className="text-[9px] text-text-secondary">abord.</p></div>
                                                    <div><p className={cn("text-xs font-bold font-outfit", w.conversionRate >= 10 ? "text-success" : "text-primary")}>{w.conversionRate}%</p><p className="text-[9px] text-text-secondary">conv.</p></div>
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
                            <h3 className="font-outfit font-bold flex items-center gap-2 text-white"><Coins className="w-5 h-5 text-primary" />Cascata de Créditos</h3>
                            {/* Plataforma */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary" />
                                        <span className="font-bold text-sm text-white">Plataforma (ADM)</span>
                                    </div>
                                    <span className="font-outfit font-bold text-primary">{platformCredits.total.toLocaleString('pt-BR')} créditos</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(platformCredits.allocated/platformCredits.total)*100}%` }} />
                                </div>
                                <div className="flex justify-between text-xs text-text-secondary font-medium">
                                    <span>{platformCredits.allocated.toLocaleString('pt-BR')} alocados a vendedores</span>
                                    <span className="text-success font-bold">{platformCredits.remaining.toLocaleString('pt-BR')} disponíveis para alocar</span>
                                </div>
                            </div>

                            {/* Por vendedor */}
                            <div className="space-y-4 pl-6 border-l-2 border-white/5">
                                {vendedores.map(v => {
                                    const scouts = webscouters.filter(w => w.vendedorId === v.id);
                                    return (
                                        <div key={v.id} className="space-y-3">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="font-bold text-sm text-blue-400">{v.name}</span>
                                                    <span className="text-[10px] text-text-secondary">({v.team})</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-text-secondary font-medium">
                                                    <span>recebeu <span className="font-bold text-white">{v.creditsReceived.toLocaleString('pt-BR')}</span></span>
                                                    <span>distribuiu <span className="font-bold text-blue-400">{v.creditsDistributed.toLocaleString('pt-BR')}</span></span>
                                                    <span className="text-success font-bold">+{v.creditsReceived-v.creditsDistributed} livres</span>
                                                </div>
                                            </div>
                                            {/* Webscouters de cada vendedor */}
                                            <div className="space-y-2 pl-5 border-l border-white/5">
                                                {scouts.map(w => (
                                                    <div key={w.id} className="flex items-center justify-between text-xs flex-wrap sm:flex-nowrap gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                                                            <span className="text-purple-300 font-medium">{w.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-text-secondary font-medium">{w.creditsUsed}/{w.creditsReceived} consumidos</span>
                                                            <span className="font-bold text-success">+{w.creditsReceived-w.creditsUsed} livres</span>
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
                                <h3 className="font-outfit font-bold text-white">Alocar Créditos — ADM → Vendedor</h3>
                                <p className="text-xs text-text-secondary mt-1 font-medium">Selecione o vendedor e adicione créditos ao saldo da equipe dele. Disponível: <span className="text-primary font-bold">{platformCredits.remaining.toLocaleString('pt-BR')}</span></p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {vendedores.map(v => {
                                    return (
                                        <div key={v.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">{v.name.charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-white">{v.name}</p>
                                                    <CreditBar used={v.creditsDistributed} total={v.creditsReceived} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto justify-end">
                                                <input 
                                                    type="number" 
                                                    id={`credits-input-${v.id}`}
                                                    defaultValue={500} 
                                                    min={100} 
                                                    step={100}
                                                    className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-center outline-none focus:border-primary/40 text-white font-bold" 
                                                />
                                                <button 
                                                    onClick={() => {
                                                        const el = document.getElementById(`credits-input-${v.id}`) as HTMLInputElement;
                                                        const val = el ? Number(el.value) : 500;
                                                        handleAddCredits(v.id, val);
                                                    }}
                                                    className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all whitespace-nowrap cursor-pointer"
                                                >
                                                    Adicionar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
