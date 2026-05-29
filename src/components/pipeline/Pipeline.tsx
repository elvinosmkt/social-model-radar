"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    MoreVertical,
    Instagram,
    Target,
    Loader2
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

export function Pipeline() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeads = useCallback(async () => {
        try {
            const data = await leadService.getLeads();
            setLeads(data);
        } catch (error) {
            console.error("Failed to fetch leads for pipeline:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleOpenDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        const data = await leadService.getInteractions(lead.id);
        setInteractions(data);
    };

    const handleLeadUpdate = async () => {
        await fetchLeads();
        // Refresh selected lead details sidebar if open
        if (selectedLead) {
            try {
                const updated = await leadService.getLeadById(selectedLead.id);
                setSelectedLead(updated);
                const data = await leadService.getInteractions(selectedLead.id);
                setInteractions(data);
            } catch (e) {
                setSelectedLead(null);
            }
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + 'k';
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-24 bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium">Carregando quadro do pipeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 h-full overflow-x-auto pb-6 scrollbar-thin flex-1">
            {COLUMNS.map((column) => {
                const columnLeads = leads.filter(l => l.status === column.id);
                return (
                    <div key={column.id} className="min-w-[280px] w-[280px] flex flex-col gap-4 flex-shrink-0">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", column.color)} />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                                    {column.title}
                                </h3>
                                <span className="text-[10px] font-extrabold bg-white/5 px-2 py-0.5 rounded-full text-text-secondary">
                                    {columnLeads.length}
                                </span>
                            </div>
                            <button className="p-1 hover:bg-white/5 rounded-md text-text-secondary transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col gap-3 rounded-2xl bg-white/[0.01] p-3 border border-white/[0.03] overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
                            {columnLeads.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-white/[0.05] rounded-xl">
                                    <p className="text-[10px] text-text-secondary/50 font-bold uppercase tracking-wider text-center">Nenhum Lead</p>
                                </div>
                            ) : (
                                columnLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="relative overflow-hidden backdrop-blur-md bg-white/[0.01] border border-white/[0.04] p-4 rounded-[1.5rem] hover:border-primary/20 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_30px_rgba(201,160,92,0.1)] active:scale-[0.99] flex flex-col justify-between min-h-[140px]"
                                        onClick={() => handleOpenDetails(lead)}
                                    >
                                        {/* Glowing radial ambient effect */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div>
                                            <div className="flex justify-between items-start mb-3 relative z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-full bg-card border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-md group-hover:border-primary/40 transition-colors">
                                                        {lead.avatar_url ? (
                                                            <img
                                                                src={lead.avatar_url}
                                                                alt={lead.name}
                                                                referrerPolicy="no-referrer"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                                                    if (fallback) {
                                                                        fallback.classList.remove('hidden');
                                                                        fallback.style.setProperty('display', 'flex', 'important');
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={cn("w-full h-full bg-gradient-to-tr from-[#8a3ab9] via-[#e95950] to-[#fccc63] flex items-center justify-center", lead.avatar_url ? "hidden" : "")}>
                                                            <Instagram className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-extrabold tracking-tight text-white group-hover:text-primary transition-colors truncate max-w-[125px]">{lead.handle}</p>
                                                        <p className="text-[9px] text-text-secondary/70 font-bold tracking-tighter uppercase mt-0.5">
                                                            {formatNumber(lead.followers || 0)} seguidores
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-2.5 relative z-10">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {lead.niche && (
                                                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-[8px] font-bold text-purple-300 border border-purple-500/20 uppercase tracking-wide">
                                                            {lead.niche}
                                                        </span>
                                                    )}
                                                    {lead.age_range && (
                                                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-[8px] font-bold text-cyan-300 border border-cyan-500/20 uppercase tracking-wide">
                                                            {lead.age_range}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.04] mt-3 relative z-10">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-[0_0_8px_rgba(201,160,92,0.1)]">
                                                <Target className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-extrabold">{lead.ai_score}</span>
                                            </div>
                                            <div className="text-[9px] text-text-secondary/50 font-bold uppercase tracking-wider">
                                                {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }) : ""}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Lead Details Sidebar */}
            {selectedLead && (
                <LeadDetails
                    lead={selectedLead}
                    interactions={interactions}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleLeadUpdate}
                />
            )}
        </div>
    );
}
