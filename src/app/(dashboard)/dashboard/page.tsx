"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import { useAuth } from "@/lib/context/AuthContext";
import {
    Users,
    TrendingUp,
    Target,
    CheckCircle2,
    Sparkles,
    Zap,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { leadService } from "@/services/lead-service";
import { ScoutingCharts } from "@/components/dashboard/ScoutingCharts";
import { ModelComparison } from "@/components/dashboard/ModelComparison";
import { ROITracking } from "@/components/dashboard/ROITracking";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { user } = useAuth();
    const [statusStats, setStatusStats] = useState<any[]>([]);
    const [nicheStats, setNicheStats] = useState<any[]>([]);
    const [comparisonLeads, setComparisonLeads] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [dailyApproaches, setDailyApproaches] = useState(12);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                const [status, niches, compLeads, allLeads, recent, dailyCount] = await Promise.all([
                    leadService.getStatusStats(),
                    leadService.getNicheStats(),
                    leadService.getComparisonLeads(),
                    leadService.getLeads(),
                    leadService.getRecentActivities(),
                    leadService.getDailyApproachesCount(user.id)
                ]);
                setStatusStats(status);
                setNicheStats(niches);
                setComparisonLeads(compLeads);
                setLeads(allLeads);
                setActivities(recent);
                setDailyApproaches(dailyCount);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (user) {
            fetchData();
        }
    }, [user]);

    // Calculate dynamic stats
    const leadsCount = leads.length;

    const qualCount = leads.filter(l => (l.ai_score || 0) >= 70).length;
    const inConvCount = leads.filter(l => l.status === 'in_conversation').length;
    const approachedCount = leads.filter(l => ['approached', 'in_conversation', 'selected', 'converted'].includes(l.status)).length;
    const convertedCount = leads.filter(l => l.status === 'selected' || l.status === 'converted').length;
    const qualRate = leadsCount ? Math.round((qualCount / leadsCount) * 100) : 0;

    // Count high fit leads dynamically
    const highFitCount = leads.filter(l => (l.ai_score || 0) >= 90).length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const highFitTodayCount = leads.filter(l => (l.ai_score || 0) >= 90 && new Date(l.created_at || l.criado_em || '') >= startOfToday).length;

    const displayStatusStats = statusStats;
    const displayNicheStats = nicheStats;

    const stats = [
        { label: "Leads Captados", value: leadsCount.toLocaleString(), trend: leadsCount ? "+100%" : "+0%", icon: Users, color: "text-primary" },
        { label: "Taxa de Qualificação (>=70)", value: `${qualRate}%`, trend: leadsCount ? "+5%" : "+0%", icon: Zap, color: "text-blue-400" },
        { label: "Em Conversa", value: inConvCount.toString(), trend: inConvCount ? "+15%" : "+0%", icon: Target, color: "text-amber-400" },
        { label: "Convertidas", value: convertedCount.toString(), trend: convertedCount ? "+8%" : "+0%", icon: CheckCircle2, color: "text-success" },
    ];

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium">Carregando métricas reais...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <Header
                title="Dashboard"
                subtitle="Painel de controle alimentado por IA para scouting de elite."
            />

            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* AI Notification Bar */}
                    <div className="lg:col-span-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary/15 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-outfit">Análise de IA Concluída</p>
                                <p className="text-xs text-text-secondary">
                                    {highFitTodayCount > 0 ? (
                                        `Encontramos ${highFitTodayCount} novos perfis com fit score superior a 90% hoje.`
                                    ) : highFitCount > 0 ? (
                                        `Encontramos ${highFitCount} perfis com fit score superior a 90% na sua base.`
                                    ) : (
                                        "Nenhum perfil com fit score >= 90% localizado na base hoje."
                                    )}
                                </p>
                            </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
                    </div>

                    {/* Daily Goals Card */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-success/20 border border-success/30 flex items-center justify-center">
                                <Target className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Meta Diária (Webscouter)</p>
                                <p className="text-lg font-outfit font-bold">
                                    {dailyApproaches} / 30 <span className="text-xs font-normal text-text-secondary">Abordagens</span>
                                </p>
                            </div>
                        </div>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-success transition-all duration-500" 
                                style={{ width: `${Math.min(100, (dailyApproaches / 30) * 100)}%` }} 
                            />
                        </div>
                    </div>
                </div>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-effect rounded-2xl p-4 md:p-6 group hover:border-primary/30 transition-all duration-300">
                            <div className="flex justify-between items-start gap-1 w-full">
                                <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                                    <p className="text-[9px] md:text-xs font-bold text-text-secondary uppercase tracking-wider truncate">{stat.label}</p>
                                    <h3 className="text-lg md:text-3xl font-outfit font-extrabold text-white leading-none">{stat.value}</h3>
                                </div>
                                <div className={`p-2 md:p-3 rounded-xl bg-white/5 border border-white/5 shrink-0 ${stat.color}`}>
                                    <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
                                </div>
                            </div>
                            <p className="text-[9px] md:text-xs font-semibold text-success flex items-center gap-0.5 mt-2 md:mt-3">
                                {stat.trend} <span className="text-text-secondary/70 font-normal italic lowercase text-[8px] md:text-[10px]">esta semana</span>
                            </p>
                        </div>
                    ))}
                </div>

                {/* Main Charts */}
                <ScoutingCharts
                    statusStats={displayStatusStats}
                    nicheStats={displayNicheStats}
                />
                <ROITracking 
                    leadsCount={leadsCount}
                    qualCount={qualCount}
                    approachedCount={approachedCount}
                    convertedCount={convertedCount}
                />
                <ModelComparison leads={comparisonLeads} />

                {/* Secondary Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Insights Feed */}
                    <div className="glass-effect rounded-2xl p-8 lg:col-span-1">
                        <h3 className="text-lg font-outfit font-bold mb-6">Últimas Atividades</h3>
                        <div className="space-y-6">
                            {activities.length === 0 ? (
                                <p className="text-xs text-text-secondary italic">Nenhuma atividade registrada no banco ainda.</p>
                            ) : (
                                activities.map((activity, i) => {
                                    const handle = activity.leads?.handle || "@perfil";
                                    const formattedTime = new Date(activity.created_at).toLocaleDateString() + ' ' + new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                                <Users className="w-4 h-4 text-text-secondary" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">
                                                    <span className="font-bold text-white">{handle}</span> • {activity.type === 'status_change' ? 'Status' : activity.type === 'dm_sent' ? 'Mensagem' : 'Histórico'}
                                                </p>
                                                <p className="text-xs text-text-secondary line-clamp-1">{activity.content}</p>
                                                <p className="text-[10px] text-text-secondary/70 italic uppercase font-bold">{formattedTime}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* AI Predictions */}
                    <div className="lg:col-span-2 glass-effect rounded-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sparkles className="w-32 h-32 text-primary" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-xl font-outfit font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Projeção de Crescimento da Base
                            </h3>
                            <div className="h-48 border-b border-l border-white/10 relative mt-8 flex items-end justify-between px-4">
                                {[40, 60, 45, 75, 90, 85, 100].map((val, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${val}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="w-12 bg-gradient-to-t from-primary/20 to-primary rounded-t-lg relative group/bar"
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border border-white/10 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                            {val + Math.max(10, leadsCount)}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-4">
                                <span>Seg</span>
                                <span>Ter</span>
                                <span>Qua</span>
                                <span>Qui</span>
                                <span>Sex</span>
                                <span>Sáb</span>
                                <span>Dom</span>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed max-w-lg">
                                Com base no volume de scouting atual, estimamos uma taxa contínua de crescimento qualificado para sua base de captação.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
