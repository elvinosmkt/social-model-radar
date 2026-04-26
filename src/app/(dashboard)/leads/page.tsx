"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import {
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Instagram,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, Interaction } from "@/services/lead-service";
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

const MOCK_LEADS: Lead[] = [
    { id: "1", handle: "@isabella.f", name: "Isabella Ferreira", status: "new", ai_score: 92, followers: 45000, niche: "Beauty", age_range: "22", updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), platform: "instagram", ai_summary: "Influenciadora de beleza com alto engajamento em vídeos de maquiagem.", ai_characteristics: "Estética limpa, perfil profissional, ótima oratória." },
    { id: "2", handle: "@adriana_m40", name: "Adriana Medeiros", status: "approaching", ai_score: 85, followers: 12000, niche: "Fashion", age_range: "42", updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), platform: "instagram", ai_summary: "Referência em moda madura com audiência fiel e engajada." },
    { id: "3", handle: "@carol.style", name: "Carolina Santos", status: "in_conversation", ai_score: 78, followers: 8500, niche: "Lifestyle", age_range: "29", updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), platform: "instagram" },
    { id: "4", handle: "@lua.creator", name: "Luanda Ferreira", status: "approached", ai_score: 91, followers: 9800, niche: "Beauty", age_range: "22", updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), platform: "instagram", ai_summary: "Criadora de conteúdo em ascensão rápida com crescimento orgânico excepcional." },
    { id: "5", handle: "@mari.premium", name: "Mariana Pires", status: "selected", ai_score: 96, followers: 7600, niche: "Luxury", age_range: "35", updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), platform: "instagram", ai_summary: "Microinfluenciadora premium com audiência ultra-segmentada de alto poder aquisitivo." },
    { id: "6", handle: "@bia.fitness", name: "Beatriz Almeida", status: "new", ai_score: 79, followers: 55000, niche: "Fitness", age_range: "26", updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), platform: "instagram" },
    { id: "7", handle: "@juju.modaetc", name: "Juliana Ramos", status: "approaching", ai_score: 87, followers: 43000, niche: "Fashion", age_range: "25", updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), platform: "instagram", ai_summary: "Influenciadora de moda com linguagem jovem e conteúdo de alto volume." },
    { id: "8", handle: "@nana.beauty", name: "Fernanda Lima", status: "approached", ai_score: 89, followers: 6500, niche: "Beauty", age_range: "28", updated_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), platform: "instagram" },
];

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        setTimeout(() => {
            setLeads(MOCK_LEADS);
            setFilteredLeads(MOCK_LEADS);
            setLoading(false);
        }, 800);
    }, []);

    useEffect(() => {
        let result = leads;
        if (search) {
            const q = search.toLowerCase();
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
    }, [search, statusFilter, leads]);

    const handleOpenDetails = (lead: Lead) => {
        setSelectedLead(lead);
        setInteractions([]);
    };

    const handleStatusChange = (id: string, status: Lead['status']) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Base de Leads"
                subtitle="Gerencie todos os perfis captados e qualificados pela IA."
            />

            <div className="p-8 space-y-6 overflow-y-auto flex-1">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar por handle, nome ou nicho..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
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
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {/* Stats rápidos */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: leads.length },
                        { label: "Novos", value: leads.filter(l => l.status === 'new').length },
                        { label: "Em Conversa", value: leads.filter(l => l.status === 'in_conversation').length },
                        { label: "Selecionados", value: leads.filter(l => l.status === 'selected').length },
                    ].map((stat, i) => (
                        <div key={i} className="glass-effect rounded-xl p-4 text-center space-y-1">
                            <p className="text-2xl font-outfit font-bold">{stat.value}</p>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabela */}
                <div className="glass-effect rounded-2xl overflow-hidden border border-white/5">
                    <table className="w-full text-left border-collapse">
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
                            {loading ? (
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
                            ) : filteredLeads.map((lead) => {
                                const statusCfg = STATUS_CONFIG[lead.status];
                                return (
                                    <tr
                                        key={lead.id}
                                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                                        onClick={() => handleOpenDetails(lead)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-primary">
                                                    {lead.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight">{lead.handle}</p>
                                                    <p className="text-xs text-text-secondary">{lead.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border", statusCfg?.color)}>
                                                {statusCfg?.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn("font-outfit font-bold text-sm", (lead.ai_score || 0) >= 90 ? "text-primary" : "text-text-secondary")}>
                                                {lead.ai_score}/100
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {lead.followers?.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">
                                            {lead.niche}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-text-secondary">
                                            {new Date(lead.updated_at!).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all">
                                                <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-text-secondary font-medium">
                        Mostrando <span className="text-foreground font-bold">{filteredLeads.length}</span> de <span className="text-foreground font-bold">{leads.length}</span> leads
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 text-xs font-bold text-primary">1</button>
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
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
                        onUpdate={() => {}}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
