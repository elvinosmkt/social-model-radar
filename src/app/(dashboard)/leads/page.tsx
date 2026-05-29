"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import {
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Instagram,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Lock,
    BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, leadService, Interaction } from "@/services/lead-service";
import { LeadDetails } from "@/components/leads/LeadDetails";

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchLeads = useCallback(async () => {
        try {
            const data = await leadService.getLeads();
            setLeads(data);
        } catch (error) {
            console.error("Failed to fetch leads from Supabase:", error);
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

    // Filter leads locally based on search query
    const filteredLeads = leads.filter(lead => {
        const query = searchQuery.toLowerCase();
        return (
            lead.handle.toLowerCase().includes(query) ||
            (lead.name && lead.name.toLowerCase().includes(query)) ||
            (lead.niche && lead.niche.toLowerCase().includes(query))
        );
    });

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Base de Leads"
                subtitle="Gerencie todos os perfis captados e qualificados pela IA."
            />

            <div className="p-4 md:p-8 space-y-6 overflow-y-auto no-scrollbar">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Buscar por handle, nome ou nicho..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-text-secondary/40 font-medium"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold hover:bg-white/10 transition-all text-white">
                            <Filter className="w-4 h-4 text-primary" />
                            Filtrar
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all">
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Lead</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary text-center">Fit Score</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Seguidores</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nicho</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Última Ação</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            <p className="text-xs text-text-secondary font-medium">Carregando leads do Supabase...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <p className="text-sm text-text-secondary font-medium">
                                            {searchQuery ? "Nenhum lead corresponde à sua busca." : "Nenhum lead cadastrado ainda. Vá em Captação para buscar modelos!"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className="border-b border-white/5 hover:bg-white/[0.01] hover:border-l-2 hover:border-l-primary transition-all duration-200 group cursor-pointer"
                                        onClick={() => handleOpenDetails(lead)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-card border border-white/10 overflow-hidden flex items-center justify-center relative shrink-0 shadow-md group-hover:border-primary/40 transition-colors">
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
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm tracking-tight text-white group-hover:text-primary transition-colors duration-300">{lead.handle}</p>
                                                        {lead.age_range && (
                                                            <span className="text-[8px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0">{lead.age_range}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-secondary/70 truncate max-w-[180px] mt-0.5">{lead.name || lead.handle}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border shadow-sm shrink-0",
                                                lead.status === 'new' && "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5",
                                                lead.status === 'approaching' && "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-500/5",
                                                lead.status === 'approached' && "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5",
                                                lead.status === 'in_conversation' && "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-pink-500/5",
                                                lead.status === 'selected' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
                                                lead.status === 'converted' && "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-teal-500/5",
                                                lead.status === 'lost' && "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5",
                                            )}>
                                                {lead.status === 'new' && 'Novo'}
                                                {lead.status === 'approaching' && 'Para Abordar'}
                                                {lead.status === 'approached' && 'Abordado'}
                                                {lead.status === 'in_conversation' && 'Em Conversa'}
                                                {lead.status === 'selected' && 'Selecionado'}
                                                {lead.status === 'converted' && 'Convertido'}
                                                {lead.status === 'lost' && 'Perdido'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-[0_0_8px_rgba(201,160,92,0.1)]">
                                                <span className="text-[11px] font-extrabold">{lead.ai_score}/100</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-white">
                                            {lead.followers?.toLocaleString("pt-BR") || "0"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                                            {lead.niche}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-text-secondary font-bold">
                                            {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all">
                                                <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-text-secondary font-medium">
                        {filteredLeads.length === leads.length
                            ? `Mostrando ${leads.length} leads`
                            : `Mostrando ${filteredLeads.length} de ${leads.length} leads (filtrados)`
                        }
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all" disabled>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

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
