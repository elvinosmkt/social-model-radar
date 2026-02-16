"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import {
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Instagram,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, leadService, Interaction } from "@/services/lead-service";
import { LeadDetails } from "@/components/leads/LeadDetails";

// Mock data (updated with new fields)
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
        platform: "instagram",
        ai_summary: "Perfil focado em moda 40+ com audiência fiel.",
        ai_characteristics: "Elegante, foca em lifestyle de luxo e bem-estar."
    },
    {
        id: "3",
        handle: "@carol_style",
        name: "Carolina Santos",
        status: "in_conversation",
        ai_score: 78,
        followers: 8500,
        niche: "Lifestyle",
        age_range: "38",
        updated_at: new Date().toISOString(),
        platform: "instagram"
    },
];

export default function LeadsPage() {
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);

    const handleOpenDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        const data = await leadService.getInteractions(lead.id);
        setInteractions(data);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Base de Leads"
                subtitle="Gerencie todos os perfis captados e qualificados pela IA."
            />

            <div className="p-8 space-y-6 overflow-y-auto">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Buscar por handle, nome ou nicho..."
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold hover:bg-white/10 transition-all">
                            <Filter className="w-4 h-4" />
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
                            {mockLeads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                                    onClick={() => handleOpenDetails(lead)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-card border border-white/10 overflow-hidden flex items-center justify-center">
                                                <Instagram className="w-5 h-5 text-text-secondary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{lead.handle}</p>
                                                <p className="text-xs text-text-secondary">{lead.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border",
                                            lead.status === 'new' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                            lead.status === 'approaching' && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                            lead.status === 'in_conversation' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                                        )}>
                                            {lead.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "font-outfit font-bold text-sm",
                                            (lead.ai_score || 0) > 80 ? "text-primary" : "text-text-secondary"
                                        )}>
                                            {lead.ai_score}/100
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        {lead.followers?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary">
                                        {lead.niche}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-text-secondary">
                                        {new Date(lead.updated_at!).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all">
                                            <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-text-secondary font-medium">Mostrando 3 de 128 leads</p>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 disabled:opacity-20 transition-all" disabled>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all">
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
                />
            )}
        </div>
    );
}
