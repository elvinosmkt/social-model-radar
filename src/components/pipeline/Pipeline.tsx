"use client";

import { useState } from "react";
import {
    Plus,
    MoreVertical,
    Instagram,
    Target,
    TrendingUp,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, leadService, Interaction } from "@/services/lead-service";
import { LeadDetails } from "@/components/leads/LeadDetails";

const COLUMNS = [
    { id: "new", title: "Novos", color: "bg-blue-400" },
    { id: "approaching", title: "Para Abordar", color: "bg-purple-400" },
    { id: "approached", title: "Abordados", color: "bg-orange-400" },
    { id: "in_conversation", title: "Em Conversa", color: "bg-pink-400" },
    { id: "selected", title: "Selecionados", color: "bg-emerald-400" },
];

const mockLeads: Lead[] = [
    {
        id: "1",
        handle: "@isabella.f",
        name: "Isabella Ferreira",
        status: "new",
        ai_score: 92,
        followers: 45000,
        niche: "Beauty",
        age_range: "22",
        updated_at: new Date().toISOString(),
        platform: "instagram",
        ai_summary: "Influenciadora de beleza com alto engajamento em vídeos de maquiagem.",
        ai_characteristics: "Estética limpa, perfil profissional, ótima oratória."
    },
    {
        id: "2",
        handle: "@adriana_m40",
        name: "Adriana Medeiros",
        status: "approaching",
        ai_score: 85,
        followers: 12000,
        niche: "Fashion",
        age_range: "42",
        updated_at: new Date().toISOString(),
        platform: "instagram"
    },
];

export function Pipeline() {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);

    const handleOpenDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        const data = await leadService.getInteractions(lead.id);
        setInteractions(data);
    };

    return (
        <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-thin">
            {COLUMNS.map((column) => (
                <div key={column.id} className="min-w-[300px] w-[300px] flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", column.color)} />
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                                {column.title}
                            </h3>
                            <span className="text-[10px] font-bold bg-white/5 px-2 py-0.5 rounded-full text-text-secondary">
                                {mockLeads.filter(l => l.status === column.id).length}
                            </span>
                        </div>
                        <button className="p-1 hover:bg-white/5 rounded-md text-text-secondary transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-3 rounded-2xl bg-white/[0.02] p-2 border border-white/5">
                        {mockLeads
                            .filter((lead) => lead.status === column.id)
                            .map((lead) => (
                                <div
                                    key={lead.id}
                                    className="glass-effect p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group"
                                    onClick={() => handleOpenDetails(lead)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center">
                                                <Instagram className="w-4 h-4 text-text-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold tracking-tight">{lead.handle}</p>
                                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-tighter">
                                                    {lead.followers?.toLocaleString()} followers
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4 text-text-secondary" />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-text-secondary uppercase">
                                                {lead.niche}
                                            </span>
                                            {lead.age_range && (
                                                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-text-secondary uppercase">
                                                    {lead.age_range} anos
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-1">
                                                <Target className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] font-bold text-primary">{lead.ai_score}</span>
                                            </div>
                                            <div className="flex items-center -space-x-1.5">
                                                <div className="w-5 h-5 rounded-full bg-blue-400 border border-[#0d0d0d]" />
                                                <div className="w-5 h-5 rounded-full bg-purple-400 border border-[#0d0d0d]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            ))}

            {/* Lead Details Sidebar */}
            {selectedLead && (
                <LeadDetails
                    lead={selectedLead}
                    interactions={interactions}
                    onClose={() => setSelectedLead(null)}
                />
            )}
        </div>
    );
}
