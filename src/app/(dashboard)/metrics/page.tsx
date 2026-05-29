"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import {
    BarChart3,
    PieChart,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Loader2,
    Sparkles,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, leadService } from "@/services/lead-service";
import { useAuth } from "@/lib/context/AuthContext";

export default function MetricsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchLeads() {
            if (!user) return;
            try {
                const allLeads = await leadService.getLeads();
                setLeads(allLeads);
            } catch (e) {
                console.error("Failed to load metrics leads:", e);
            } finally {
                setIsLoading(false);
            }
        }
        if (user) {
            fetchLeads();
        }
    }, [user]);

    // ═══════════════════════════════════════════════════
    // CÁLCULOS DE MÉTRICAS REAIS (SUPABASE)
    // ═══════════════════════════════════════════════════
    const totalLeads = leads.length;
    
    // 1. Taxa de Conversão: Leads em 'selected' ou 'converted' sobre o total
    const convertedLeads = leads.filter(l => l.status === 'selected' || l.status === 'converted').length;
    const conversionRate = totalLeads ? ((convertedLeads / totalLeads) * 100).toFixed(1) + "%" : "0.0%";

    // 2. Tempo Médio p/ Abordagem: Intervalo real entre created_at e updated_at para leads abordados
    const leadsWithDuration = leads.filter(l => l.status !== 'new' && l.created_at && l.updated_at);
    let avgDays = 0;
    if (leadsWithDuration.length > 0) {
        const totalDiff = leadsWithDuration.reduce((acc, curr) => {
            const created = new Date(curr.created_at!).getTime();
            const updated = new Date(curr.updated_at!).getTime();
            return acc + Math.max(0, updated - created);
        }, 0);
        avgDays = Number((totalDiff / leadsWithDuration.length / (1000 * 60 * 60 * 24)).toFixed(1));
    }
    const avgApproachTime = `${avgDays} dias`;

    // 3. Leads Qualificados: Percentual com score de IA >= 70
    const qualCount = leads.filter(l => (l.ai_score || 0) >= 70).length;
    const qualifiedLeadsRate = totalLeads ? Math.round((qualCount / totalLeads) * 100) + "%" : "0%";

    // 4. Média de Fit Score
    const avgFitScore = totalLeads ? Math.round(leads.reduce((acc, curr) => acc + (curr.ai_score || 0), 0) / totalLeads) : 0;

    const mainMetrics = [
        { label: "Taxa de Conversão", value: conversionRate, change: "Estável", positive: true },
        { label: "Tempo Médio p/ Abordagem", value: avgApproachTime, change: "Tempo real", positive: true },
        { label: "Leads Qualificados (>=70)", value: qualifiedLeadsRate, change: "Pontuação", positive: true },
        { label: "Média de Fit Score", value: `${avgFitScore}/100`, change: "Média", positive: true },
    ];

    // ═══════════════════════════════════════════════════
    // FUNIL DE CONVERSÃO REAL
    // ═══════════════════════════════════════════════════
    const stage1Count = totalLeads;
    const stage2Count = leads.filter(l => ['approaching', 'approached', 'in_conversation', 'selected', 'converted'].includes(l.status)).length;
    const stage3Count = leads.filter(l => ['in_conversation', 'selected', 'converted'].includes(l.status)).length;
    const stage4Count = leads.filter(l => ['selected', 'converted'].includes(l.status)).length;

    const stg1To2 = stage1Count ? Math.round((stage2Count / stage1Count) * 100) : 0;
    const stg2To3 = stage2Count ? Math.round((stage3Count / stage2Count) * 100) : 0;
    const stg3To4 = stage3Count ? Math.round((stage4Count / stage3Count) * 100) : 0;
    const stg4ToConv = stage4Count ? 100 : 0;

    const funnelStages = [
        { label: "Captação → Abordagem", value: stg1To2, color: "bg-blue-400" },
        { label: "Abordagem → Resposta (Conversa)", value: stg2To3, color: "bg-purple-400" },
        { label: "Resposta → Seleção", value: stg3To4, color: "bg-pink-400" },
        { label: "Seleção → Conversão", value: stg4ToConv, color: "bg-emerald-400" },
    ];

    // ═══════════════════════════════════════════════════
    // ORIGEM / NICHOS DE LEADS DO BANCO
    // ═══════════════════════════════════════════════════
    const fashionCount = leads.filter(l => l.niche?.toLowerCase().includes('fashion') || l.niche?.toLowerCase().includes('moda')).length;
    const beautyCount = leads.filter(l => l.niche?.toLowerCase().includes('beauty') || l.niche?.toLowerCase().includes('beleza') || l.niche?.toLowerCase().includes('aesthetic')).length;
    const lifestyleCount = leads.filter(l => l.niche?.toLowerCase().includes('lifestyle') || l.niche?.toLowerCase().includes('vida')).length;
    const fitnessCount = leads.filter(l => l.niche?.toLowerCase().includes('fitness') || l.niche?.toLowerCase().includes('saude') || l.niche?.toLowerCase().includes('esporte')).length;
    
    const matchedCount = fashionCount + beautyCount + lifestyleCount + fitnessCount;
    const otherCount = Math.max(0, totalLeads - matchedCount);

    const calcPercent = (count: number) => {
        if (!totalLeads) return 0;
        return Math.round((count / totalLeads) * 100);
    };

    const fashionPercent = calcPercent(fashionCount);
    const beautyPercent = calcPercent(beautyCount);
    const lifestylePercent = calcPercent(lifestyleCount);
    const otherPercent = calcPercent(fitnessCount + otherCount);

    const topNicheName = totalLeads === 0 
        ? "Nenhum"
        : fashionCount >= beautyCount && fashionCount >= lifestyleCount && fashionCount >= fitnessCount 
            ? "#moda" 
            : beautyCount >= lifestyleCount && beautyCount >= fitnessCount 
                ? "#beleza" 
                : lifestyleCount >= fitnessCount 
                    ? "#lifestyle" 
                    : "#fitness";

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium">Carregando métricas de performance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Métricas e Performance"
                subtitle="Analise os resultados das suas campanhas de captação."
            />

            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 px-1 -mx-1">
                        {["7 Dias", "30 Dias", "90 Dias", "Sempre"].map((period) => (
                            <button
                                key={period}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 active:scale-95",
                                    period === "Sempre"
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-white/5 text-text-secondary border-white/5 hover:bg-white/10"
                                )}
                            >
                                {period}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-xl bg-primary text-black text-xs font-extrabold hover:opacity-90 active:scale-[0.98] transition-all w-full md:w-auto shadow-lg shadow-primary/10">
                        <Download className="w-4 h-4" />
                        <span>Gerar Relatório Completo</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {mainMetrics.map((metric, i) => (
                        <div key={i} className="glass-effect p-4 md:p-6 rounded-2xl space-y-1 md:space-y-2 hover:border-primary/20 transition-all duration-300">
                            <p className="text-[9px] md:text-[10px] text-text-secondary font-bold uppercase tracking-wider truncate">{metric.label}</p>
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                                <h3 className="text-lg md:text-2xl font-outfit font-extrabold text-white leading-none">{metric.value}</h3>
                                <div className={cn(
                                    "flex items-center gap-0.5 text-[9px] md:text-xs font-bold shrink-0 self-start sm:self-auto",
                                    metric.positive ? "text-success" : "text-danger"
                                )}>
                                    {metric.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {metric.change}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-effect rounded-3xl p-8 min-h-[400px]">
                        <h3 className="text-lg font-outfit font-bold mb-8">Conversão por Estágio</h3>
                        <div className="space-y-6">
                            {funnelStages.map((bar, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary font-medium">{bar.label}</span>
                                        <span className="font-bold text-white">{bar.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000", bar.color)}
                                            style={{ width: `${bar.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-effect rounded-3xl p-8">
                        <h3 className="text-lg font-outfit font-bold mb-8">Origem por Nicho</h3>
                        <div className="flex flex-col items-center justify-center h-full pb-8">
                            <div className="relative w-48 h-48 rounded-full border-8 border-white/5 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-3xl font-bold font-outfit text-primary capitalize">{topNicheName}</p>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">Top Origem</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full mt-12">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <span className="text-xs text-text-secondary font-medium">#moda / fashion: {fashionPercent}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                                    <span className="text-xs text-text-secondary font-medium">#beleza / beauty: {beautyPercent}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                                    <span className="text-xs text-text-secondary font-medium">#lifestyle: {lifestylePercent}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                    <span className="text-xs text-text-secondary font-medium">Outros: {otherPercent}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Download(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}
