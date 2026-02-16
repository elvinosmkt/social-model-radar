"use client";

import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, PieChart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ROITracking() {
    const funnelSteps = [
        { label: "Captados", value: 1284, color: "bg-white/10" },
        { label: "Qualificados (AI)", value: 856, color: "bg-primary/20" },
        { label: "Abordados", value: 456, color: "bg-primary/40" },
        { label: "Convertidos", value: 24, color: "bg-primary" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Conversion Funnel */}
            <div className="glass-effect rounded-2xl p-8 space-y-8">
                <h3 className="text-xl font-outfit font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Funil de Conversão
                </h3>

                <div className="space-y-4">
                    {funnelSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="text-[10px] font-bold text-text-secondary uppercase w-24">{step.label}</div>
                            <div className="flex-1 h-12 relative flex items-center">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step.value / funnelSteps[0].value) * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className={cn("h-full rounded-lg flex items-center px-4", step.color)}
                                >
                                    <span className="text-sm font-bold">{step.value}</span>
                                </motion.div>
                                {i < funnelSteps.length - 1 && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-text-secondary">
                                        <ArrowRight className="w-3 h-3 rotate-90" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ROI & Key Metrics */}
            <div className="glass-effect rounded-2xl p-8 space-y-8">
                <h3 className="text-xl font-outfit font-bold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Projeção de ROI
                </h3>

                <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <p className="text-[10px] text-text-secondary uppercase font-bold">Custo por Lead (CPL)</p>
                        <p className="text-2xl font-outfit font-bold text-primary">R$ 0,42</p>
                        <div className="flex items-center gap-1 text-[10px] text-success">
                            <TrendingUp className="w-3 h-3" />
                            <span>-15% vs mês anterior</span>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <p className="text-[10px] text-text-secondary uppercase font-bold">LTV Projetado (Médio)</p>
                        <p className="text-2xl font-outfit font-bold text-primary">R$ 12.500</p>
                        <div className="flex items-center gap-1 text-[10px] text-text-secondary">
                            <span>Baseado em 24 conversões</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Eficiência da IA (Qualificação)</p>
                        <p className="text-sm font-bold text-success">84%</p>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "84%" }}
                            className="h-full bg-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        />
                    </div>
                    <p className="text-xs text-text-secondary italic">
                        A IA está economizando aproximadamente 32 horas semanais de triagem manual.
                    </p>
                </div>
            </div>
        </div>
    );
}
