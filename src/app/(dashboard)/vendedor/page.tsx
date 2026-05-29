"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import {
    Users, Target, Plus, Award, Coins, Zap, ChevronDown, Check,
    AlertCircle, Loader2, Briefcase, Mail, Phone, Lock, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "@/services/user-service";
import { creditService } from "@/services/credit-service";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

type Tab = 'equipe' | 'creditos';

interface NewWebscouterFormProps {
    onClose: () => void;
    onSuccess: () => void;
    creditsFree: number;
    teamName: string;
}

function NewWebscouterForm({ onClose, onSuccess, creditsFree, teamName }: NewWebscouterFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [initialCredits, setInitialCredits] = useState(200);
    const [leadLimit, setLeadLimit] = useState(200);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (initialCredits > creditsFree) {
            setError(`Você não pode alocar ${initialCredits} créditos iniciais. Seu limite disponível: ${creditsFree}`);
            setLoading(false);
            return;
        }

        try {
            await userService.createWebscouter({
                name,
                email,
                password,
                phone,
                initialCredits,
                leadLimit
            });

            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2200);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Falha ao registrar webscouter no Supabase.");
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
                        <Check className="w-8 h-8 text-success animate-pulse" />
                    </div>
                    <div className="space-y-2.5">
                        <h3 className="text-2xl font-outfit font-bold text-white tracking-tight">Cadastro Concluído!</h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            O webscouter <span className="text-primary font-bold">{name}</span> foi registrado com sucesso na equipe <span className="text-white font-bold">{teamName}</span>!
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            {/* Backdrop overlay */}
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
                        <Zap className="w-5 h-5 text-primary" /> Novo Webscouter ({teamName})
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
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: João Silva"
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
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Telefone / WhatsApp</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-0000"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-medium shadow-inner" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Créditos Iniciais</label>
                            <input type="number" value={initialCredits} onChange={e => setInitialCredits(Number(e.target.value))} min={0}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/45 transition-all text-white font-bold shadow-inner" />
                            <p className="text-[9px] text-text-secondary font-medium">Seu saldo disponível: <span className="text-success font-bold">{creditsFree} créditos</span></p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Limite de Leads</label>
                            <input type="number" value={leadLimit} onChange={e => setLeadLimit(Number(e.target.value))} min={10}
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
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin text-black" />Registrando...</> : "Criar Webscouter"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function VendedorPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('equipe');
    const [showNewWebscouter, setShowNewWebscouter] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        scouterId: string;
        scouterName: string;
        isDeleting: boolean;
        isSuccess: boolean;
        error: string;
    }>({
        isOpen: false,
        scouterId: "",
        scouterName: "",
        isDeleting: false,
        isSuccess: false,
        error: ""
    });
    
    // Live State
    const [vendedor, setVendedor] = useState<any>({ name: "Vendedor", team: "Equipe", creditsReceived: 0, creditsDistributed: 0, creditsUsed: 0, balance: 0 });
    const [webscouters, setWebscouters] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [distributing, setDistributing] = useState<string | null>(null);

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

            // Fetch team name dynamically instead of showing the UUID
            const { data: teamInfo } = await supabase
                .from('teams')
                .select('nome')
                .eq('vendedor_id', user.id)
                .maybeSingle();

            const teamName = teamInfo?.nome || "Time Alpha";

            setVendedor({
                name: profile?.nome || "Vendedor",
                team: teamName,
                creditsReceived: creditsInfo.total_allocated ?? 0,
                creditsDistributed: distributed,
                creditsUsed: creditsInfo.total_consumed ?? 0,
                balance: creditsInfo.balance !== undefined ? creditsInfo.balance : 0
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

    const creditsFree = vendedor.balance || 0;
    const totalAllocating = Object.values(allocations).reduce((a, b) => a + b, 0);

    const tabs = [
        { id: 'equipe' as Tab, label: 'Minha Equipe' },
        { id: 'creditos' as Tab, label: 'Distribuir Créditos' },
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

    const promptDeleteScouter = (scouterId: string, scouterName: string) => {
        setDeleteModal({
            isOpen: true,
            scouterId,
            scouterName,
            isDeleting: false,
            isSuccess: false,
            error: ""
        });
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
                                <button onClick={() => setShowNewWebscouter(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/15 transition-all cursor-pointer">
                                    <Plus className="w-3.5 h-3.5" />Adicionar Webscouter
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            {["#", "Webscouter", "Créditos", "Leads", "Abordados", "Conversão", "Status", ""].map(h => (
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
                                                <td className="px-5 py-3.5 text-right">
                                                    <button 
                                                        onClick={() => promptDeleteScouter(w.id, w.name)}
                                                        className="p-2 hover:bg-danger/10 text-text-secondary hover:text-danger rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                                        title={`Remover ${w.name}`}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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

                <AnimatePresence>
                    {showNewWebscouter && (
                        <NewWebscouterForm 
                            onClose={() => setShowNewWebscouter(false)}
                            creditsFree={creditsFree}
                            teamName={vendedor.team}
                            onSuccess={() => {
                                setShowNewWebscouter(false);
                                loadSellerData();
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Modal de Confirmação de Deleção de Scouter */}
                <AnimatePresence>
                    {deleteModal.isOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            {/* Backdrop blur overlay */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !deleteModal.isDeleting && !deleteModal.isSuccess && setDeleteModal(p => ({ ...p, isOpen: false }))}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />

                            {/* Glowing card panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="relative w-full max-w-md bg-card-glass border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10"
                            >
                                {/* Radial glowing mesh aura */}
                                <div className={cn(
                                    "absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none",
                                    deleteModal.isSuccess ? 'bg-success/40' : deleteModal.error ? 'bg-danger/40' : 'bg-danger/20'
                                )} />

                                {/* Centered Glowing Icon */}
                                <div className="flex justify-center">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg transition-colors duration-500",
                                        deleteModal.isSuccess
                                            ? 'bg-success/10 border-success/20 text-success shadow-success/10'
                                            : deleteModal.error
                                                ? 'bg-danger/10 border-danger/20 text-danger shadow-danger/10'
                                                : 'bg-danger/5 border-danger/15 text-danger shadow-danger/5'
                                    )}>
                                        {deleteModal.isSuccess ? (
                                            <Check className="w-8 h-8 text-success" />
                                        ) : deleteModal.isDeleting ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-danger" />
                                        ) : (
                                            <Trash2 className="w-8 h-8 text-danger" />
                                        )}
                                    </div>
                                </div>

                                {/* Modal Header & Messages */}
                                <div className="space-y-2.5">
                                    <h3 className="text-xl font-outfit font-extrabold text-white tracking-tight">
                                        {deleteModal.isSuccess
                                            ? 'Scouter Removido!'
                                            : deleteModal.error
                                                ? 'Falha ao Remover'
                                                : 'Remover Scouter?'}
                                    </h3>
                                    <p className="text-xs text-text-secondary leading-relaxed px-4 font-medium">
                                        {deleteModal.isSuccess ? (
                                            <>O captador <span className="text-primary font-bold">{deleteModal.scouterName}</span> foi permanentemente desligado da equipe.</>
                                        ) : deleteModal.error ? (
                                            <span>{deleteModal.error}</span>
                                        ) : (
                                            <>Tem certeza de que deseja remover o captador <span className="text-white font-bold">{deleteModal.scouterName}</span>? Esta ação excluirá a conta dele e é <span className="text-danger font-bold">totalmente irreversível</span>.</>
                                        )}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    {deleteModal.isSuccess ? (
                                        <button
                                            onClick={async () => {
                                                setDeleteModal(p => ({ ...p, isOpen: false }));
                                                await loadSellerData();
                                            }}
                                            className="w-full py-3 rounded-2xl text-xs font-extrabold bg-primary text-black hover:opacity-90 shadow-[0_5px_15px_rgba(201,160,92,0.3)] transition-all cursor-pointer"
                                        >
                                            Concluir
                                        </button>
                                    ) : deleteModal.error ? (
                                        <button
                                            onClick={() => setDeleteModal(p => ({ ...p, error: "" }))}
                                            className="w-full py-3 rounded-2xl text-xs font-extrabold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            Tentar Novamente
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                disabled={deleteModal.isDeleting}
                                                onClick={() => setDeleteModal(p => ({ ...p, isOpen: false }))}
                                                className="w-1/2 py-3 rounded-2xl text-xs font-bold bg-white/5 border border-white/5 text-text-secondary hover:text-white transition-all cursor-pointer disabled:opacity-40"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                disabled={deleteModal.isDeleting}
                                                onClick={async () => {
                                                    setDeleteModal(p => ({ ...p, isDeleting: true }));
                                                    try {
                                                        await userService.deleteUser(deleteModal.scouterId);
                                                        setDeleteModal(p => ({ ...p, isDeleting: false, isSuccess: true }));
                                                    } catch (err: any) {
                                                        setDeleteModal(p => ({
                                                            ...p,
                                                            isDeleting: false,
                                                            error: err.message || "Por favor, tente novamente."
                                                        }));
                                                    }
                                                }}
                                                className="w-1/2 py-3 rounded-2xl text-xs font-extrabold bg-danger text-white hover:bg-danger-light shadow-[0_5px_15px_rgba(239,68,68,0.2)] transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                                            >
                                                {deleteModal.isDeleting ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        <span>Excluindo...</span>
                                                    </>
                                                ) : (
                                                    <span>Sim, Remover</span>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
