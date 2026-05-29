"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import {
    Search,
    Download,
    MoreHorizontal,
    Instagram,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Lock,
    BadgeCheck,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, leadService, Interaction } from "@/services/lead-service";
import { LeadDetails } from "@/components/leads/LeadDetails";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    new: { label: "Novo", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    approaching: { label: "Para Abordar", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    approached: { label: "Abordado", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    in_conversation: { label: "Em Conversa", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
    selected: { label: "Selecionado", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    converted: { label: "Convertido", color: "bg-primary/10 text-primary border-primary/20" },
    lost: { label: "Descartado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

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

    // Apply filters locally
    useEffect(() => {
        let result = leads;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                l.handle.toLowerCase().includes(q) ||
                l.name?.toLowerCase().includes(q) ||
                l.niche?.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== "all") {
            result = result.filter(l => l.status === statusFilter);
        }
        setFilteredLeads(result);
    }, [searchQuery, statusFilter, leads]);

    const handleOpenDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        try {
            const data = await leadService.getInteractions(lead.id);
            setInteractions(data);
        } catch (e) {
            setInteractions([]);
        }
    };

    const handleStatusChange = async (leadId: string, status: Lead['status']) => {
        // Optimistic UI update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
        try {
            await leadService.updateStatus(leadId, status);
            handleLeadUpdate();
        } catch (error) {
            console.error("Failed to update lead status:", error);
            fetchLeads();
        }
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
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all text-white placeholder:text-text-secondary/40 font-medium"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto items-center">
                        {/* Filtro de status */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-xs font-bold text-text-secondary focus:outline-none focus:border-primary/50 transition-all cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                <option key={val} value={val}>{cfg.label}</option>
                            ))}
                        </select>

                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all whitespace-nowrap">
                            <Download className="w-4 h-4" />
                            <span>Exportar CSV</span>
                        </button>
                    </div>
                </div>

                {/* Stats rápidos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: leads.length },
                        { label: "Novos", value: leads.filter(l => l.status === 'new').length },
                        { label: "Em Conversa", value: leads.filter(l => l.status === 'in_conversation').length },
                        { label: "Selecionados", value: leads.filter(l => l.status === 'selected').length },
                    ].map((stat, i) => (
                        <div key={i} className="glass-effect rounded-xl p-4 text-center space-y-1">
                            <p className="text-2xl font-outfit font-bold text-white">{stat.value}</p>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabela */}
                <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Lead</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary text-center">Score IA</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Seguidores</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nicho</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Última Ação</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-full" /><div className="space-y-2"><Skeleton className="w-24 h-4" /><Skeleton className="w-16 h-3" /></div></div></td>
                                            <td className="px-6 py-4"><Skeleton className="w-20 h-6 rounded-full" /></td>
                                            <td className="px-6 py-4"><Skeleton className="w-12 h-4 mx-auto" /></td>
                                            <td className="px-6 py-4"><Skeleton className="w-16 h-4" /></td>
                                            <td className="px-6 py-4"><Skeleton className="w-20 h-4" /></td>
                                            <td className="px-6 py-4"><Skeleton className="w-24 h-4" /></td>
                                            <td className="px-6 py-4 text-right"><Skeleton className="w-8 h-8 ml-auto rounded-lg" /></td>
                                        </tr>
                                    ))
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <Search className="w-8 h-8 text-text-secondary" />
                                                <p className="text-text-secondary text-sm">Nenhum lead encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead) => {
                                        const statusCfg = STATUS_CONFIG[lead.status];
                                        return (
                                            <tr
                                                key={lead.id}
                                                className="border-b border-white/5 hover:bg-white/[0.02] hover:border-l-2 hover:border-l-primary transition-all duration-200 group cursor-pointer"
                                                onClick={() => handleOpenDetails(lead)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-card border border-white/10 overflow-hidden flex items-center justify-center relative shrink-0 shadow-md group-hover:border-primary/40 transition-colors">
                                                            {lead.avatar_url ? (
                                                                <img
                                                                    src={lead.avatar_url}
                                                                    alt={lead.name || lead.handle}
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
                                                            <div className={cn("w-full h-full bg-gradient-to-tr from-[#8a3ab9] via-[#e95950] to-[#fccc63] flex items-center justify-center text-xs font-bold text-white", lead.avatar_url ? "hidden" : "")}>
                                                                {lead.name?.charAt(0) || lead.handle.charAt(1).toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-sm tracking-tight text-white group-hover:text-primary transition-colors duration-300">{lead.handle}</p>
                                                                {lead.age_range && (
                                                                    <span className="text-[8px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0">{lead.age_range} anos</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-text-secondary/70 truncate max-w-[180px] mt-0.5">{lead.name || lead.handle}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border", statusCfg?.color)}>
                                                        {statusCfg?.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={cn("font-outfit font-bold text-sm", (lead.ai_score || 0) >= 90 ? "text-primary animate-pulse" : "text-white")}>
                                                        {lead.ai_score}/100
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-white">
                                                    {lead.followers?.toLocaleString("pt-BR") || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text-secondary font-medium capitalize">
                                                    {lead.niche || "—"}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-secondary font-bold">
                                                    {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString("pt-BR") : "—"}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all">
                                                        <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-text-secondary font-medium">
                        Mostrando <span className="text-white font-bold">{filteredLeads.length}</span> de <span className="text-white font-bold">{leads.length}</span> leads
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-xs font-bold text-primary">1</button>
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all" disabled>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Lead Details Sidebar */}
            <AnimatePresence>
                {selectedLead && (
                    <LeadDetails
                        key={selectedLead.id}
                        lead={leads.find(l => l.id === selectedLead.id) || selectedLead}
                        interactions={interactions}
                        onClose={() => setSelectedLead(null)}
                        onUpdate={handleLeadUpdate}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
