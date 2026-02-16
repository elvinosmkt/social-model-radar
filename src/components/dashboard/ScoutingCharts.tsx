"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChartData {
    name: string;
    value: number;
    color?: string;
}

interface ScoutingChartsProps {
    statusStats: ChartData[];
    nicheStats: ChartData[];
}

export function ScoutingCharts({ statusStats, nicheStats }: ScoutingChartsProps) {
    const maxStatusValue = Math.max(...statusStats.map(s => s.value));
    const totalNicheValue = nicheStats.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lead Distribution (Status) */}
            <div className="glass-effect rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-outfit font-bold">Distribuição de Funil</h3>
                <div className="space-y-4">
                    {statusStats.map((stat, i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-text-secondary">
                                <span>{stat.name}</span>
                                <span>{stat.value} leads</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stat.value / maxStatusValue) * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                    className="h-full rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                                    style={{ backgroundColor: stat.color || 'var(--primary)' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Niche Analysis */}
            <div className="glass-effect rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-outfit font-bold">Análise de Nichos (IA)</h3>
                <div className="grid grid-cols-2 gap-4">
                    {nicheStats.map((niche, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1"
                        >
                            <p className="text-[10px] text-text-secondary font-bold uppercase">{niche.name}</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-outfit font-bold">{niche.value}%</p>
                                <div className="mb-1 h-1 flex-1 bg-white/5 rounded-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${niche.value}%` }}
                                        className="h-full bg-primary rounded-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 italic text-xs text-text-secondary">
                    "A IA identificou um aumento de 15% no interesse em conteúdos de 'Beauty' esta semana."
                </div>
            </div>
        </div>
    );
}
