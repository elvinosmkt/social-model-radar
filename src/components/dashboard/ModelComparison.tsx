"use client";

import { motion } from "framer-motion";
import { Users, Star, Award, Zap, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead } from "@/services/lead-service";

interface ModelComparisonProps {
    leads: Lead[];
}

export function ModelComparison({ leads }: ModelComparisonProps) {
    return (
        <div className="glass-effect rounded-2xl p-8 space-y-8 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between min-w-[600px]">
                <h3 className="text-xl font-outfit font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Comparativo de Modelos AI
                </h3>
                <p className="text-xs text-text-secondary italic">Dados baseados em análise de fit biométrico e engajamento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-[600px]">
                {leads.map((lead, i) => (
                    <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6 relative overflow-hidden group hover:border-primary/30 transition-all"
                    >
                        {/* Lead Header */}
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold font-outfit">{lead.name || lead.handle}</p>
                                <p className="text-xs text-text-secondary">{lead.niche}</p>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/5 p-3 rounded-xl space-y-1">
                                <p className="text-[10px] text-text-secondary uppercase font-bold flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Seguidores
                                </p>
                                <p className="text-sm font-bold">{lead.followers?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl space-y-1">
                                <p className="text-[10px] text-text-secondary uppercase font-bold flex items-center gap-1">
                                    <Star className="w-3 h-3" /> AI Score
                                </p>
                                <p className="text-sm font-bold text-primary">{lead.ai_score}/100</p>
                            </div>
                        </div>

                        {/* AI Fit Radar (Simplified as bars for now) */}
                        <div className="space-y-4 relative z-10">
                            {[
                                { label: "Estética", val: lead.ai_score || 0, color: "bg-blue-400" },
                                { label: "Profissionalismo", val: Math.min(100, (lead.ai_score || 0) + 5), color: "bg-primary" },
                                { label: "Potencial ROI", val: Math.min(100, (lead.ai_score || 0) - 10), color: "bg-amber-400" },
                            ].map((attr, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-text-secondary">
                                        <span>{attr.label}</span>
                                        <span>{attr.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${attr.val}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 + idx * 0.1 }}
                                            className={cn("h-full rounded-full", attr.color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Background Sparkles for Top Rated */}
                        {(lead.ai_score || 0) > 90 && (
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Award className="w-16 h-16 text-primary" />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
