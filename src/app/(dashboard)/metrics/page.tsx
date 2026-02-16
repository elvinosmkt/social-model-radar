"use client";

import { Header } from "@/components/shared/Header";
import {
    BarChart3,
    PieChart,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MetricsPage() {
    const mainMetrics = [
        { label: "Taxa de Conversão", value: "8.4%", change: "+1.2%", positive: true },
        { label: "Tempo Médio p/ Abordagem", value: "1.4 dias", change: "-0.2d", positive: true },
        { label: "Leads Qualificados", value: "72%", change: "+4%", positive: true },
        { label: "Média de Fit Score", value: "84/100", change: "-2", positive: false },
    ];

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Métricas e Performance"
                subtitle="Analise os resultados das suas campanhas de captação."
            />

            <div className="p-8 space-y-8 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {["7 Dias", "30 Dias", "90 Dias", "Sempre"].map((period) => (
                            <button
                                key={period}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-semibold border transition-all",
                                    period === "30 Dias"
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-white/5 text-text-secondary border-white/5 hover:bg-white/10"
                                )}
                            >
                                {period}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all">
                        <Download className="w-4 h-4" />
                        <span>Gerar Relatório Completo</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mainMetrics.map((metric, i) => (
                        <div key={i} className="glass-effect p-6 rounded-2xl space-y-2">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{metric.label}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-outfit font-bold">{metric.value}</h3>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-bold",
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
                            {[
                                { label: "Captação → Abordagem", value: 85, color: "bg-blue-400" },
                                { label: "Abordagem → Resposta", value: 42, color: "bg-purple-400" },
                                { label: "Resposta → Seleção", value: 12, color: "bg-pink-400" },
                                { label: "Seleção → Conversão", value: 4, color: "bg-emerald-400" },
                            ].map((bar, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary font-medium">{bar.label}</span>
                                        <span className="font-bold">{bar.value}%</span>
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
                        <h3 className="text-lg font-outfit font-bold mb-8">Origem dos Leads</h3>
                        <div className="flex flex-col items-center justify-center h-full pb-8">
                            <div className="relative w-48 h-48 rounded-full border-8 border-white/5 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-3xl font-bold font-outfit">#moda</p>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1">Top Origem</p>
                                </div>
                                {/* Simulated donut chart pieces could go here */}
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full mt-12">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    <span className="text-xs text-text-secondary font-medium">#fashion: 42%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                                    <span className="text-xs text-text-secondary font-medium">#scouting: 28%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                                    <span className="text-xs text-text-secondary font-medium">Localização: 18%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/10" />
                                    <span className="text-xs text-text-secondary font-medium">Outros: 12%</span>
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
