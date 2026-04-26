"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import {
    Users,
    TrendingUp,
    Target,
    CheckCircle2,
    Sparkles,
    Zap,
    ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { leadService } from "@/services/lead-service";
import { ScoutingCharts } from "@/components/dashboard/ScoutingCharts";
import { ModelComparison } from "@/components/dashboard/ModelComparison";
import { ROITracking } from "@/components/dashboard/ROITracking";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const [statusStats, setStatusStats] = useState<any[]>([]);
    const [nicheStats, setNicheStats] = useState<any[]>([]);
    const [comparisonLeads, setComparisonLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [status, niches, compLeads] = await Promise.all([
                    leadService.getStatusStats(),
                    leadService.getNicheStats(),
                    leadService.getComparisonLeads()
                ]);
                setStatusStats(status);
                setNicheStats(niches);
                setComparisonLeads(compLeads);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const stats = [
        { label: "Leads Captados", value: "1,284", trend: "+12%", icon: Users, color: "text-primary" },
        { label: "Taxa de Qualificação", value: "68%", trend: "+5%", icon: Zap, color: "text-blue-400" },
        { label: "Em Conversa", value: "45", trend: "+18%", icon: Target, color: "text-amber-400" },
        { label: "Convertidas", value: "12", trend: "+2%", icon: CheckCircle2, color: "text-success" },
    ];

    return (
        <div className="flex flex-col h-full bg-background">
            <Header
                title="Dashboard"
                subtitle="Painel de controle alimentado por IA para scouting de elite."
            />

            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* AI Notification Bar */}
                    <div className="lg:col-span-2 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary/15 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-outfit">Análise de IA Concluída</p>
                                <p className="text-xs text-text-secondary">Encontramos 15 novos perfis com fit score superior a 90% hoje.</p>
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
                                <p className="text-lg font-outfit font-bold">12 / 30 <span className="text-xs font-normal text-text-secondary">Abordagens</span></p>
                            </div>
                        </div>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-success w-[40%]" />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-effect rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-3xl font-outfit font-bold">{stat.value}</h3>
                                    <p className="text-xs font-semibold text-success flex items-center gap-1">
                                        {stat.trend} <span className="text-text-secondary font-normal italic">esta semana</span>
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Charts */}
                {!isLoading && (
                    <>
                        <ScoutingCharts
                            statusStats={statusStats}
                            nicheStats={nicheStats}
                        />
                        <ROITracking />
                        <ModelComparison leads={comparisonLeads} />
                    </>
                )}

                {/* Secondary Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Insights Feed */}
                    <div className="glass-effect rounded-2xl p-8 lg:col-span-1">
                        <h3 className="text-lg font-outfit font-bold mb-6">Últimas Atividades</h3>
                        <div className="space-y-6">
                            {[
                                { user: "@isabella.f", action: "Mudança de status", detail: "para Approached", time: "2m atrás" },
                                { user: "@adriana_m40", action: "DM Enviada", detail: "Template: Abordagem Inicial", time: "15m atrás" },
                                { user: "@carol_style", action: "Novo Lead", detail: "Captado via AI Search", time: "1h atrás" },
                            ].map((activity, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                        <Users className="w-4 h-4 text-text-secondary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">
                                            <span className="font-bold">{activity.user}</span> • {activity.action}
                                        </p>
                                        <p className="text-xs text-text-secondary">{activity.detail}</p>
                                        <p className="text-[10px] text-text-secondary italic uppercase font-bold">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
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
                                            {val + 200}
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
                                Com base no volume de scouting atual, prevemos alcançar 2.000 leads qualificados nos próximos 12 dias.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
