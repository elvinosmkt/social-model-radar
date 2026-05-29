"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Target,
    ChevronDown,
    Check,
    User,
    MessageCircle,
    Phone,
    ArrowRight,
    GripVertical,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, leadService, Interaction } from "@/services/lead-service";
import { LeadDetails } from "@/components/leads/LeadDetails";
import { motion, AnimatePresence } from "framer-motion";

const COLUMNS: { id: Lead['status']; title: string; colorDot: string; colorBg: string; colorBorder: string }[] = [
    { id: "new",            title: "Novos",         colorDot: "bg-blue-400",    colorBg: "bg-blue-400/8",    colorBorder: "border-blue-400/20" },
    { id: "approaching",    title: "Para Abordar",  colorDot: "bg-purple-400",  colorBg: "bg-purple-400/8",  colorBorder: "border-purple-400/20" },
    { id: "approached",     title: "Abordados",     colorDot: "bg-orange-400",  colorBg: "bg-orange-400/8",  colorBorder: "border-orange-400/20" },
    { id: "in_conversation",title: "Em Conversa",   colorDot: "bg-pink-400",    colorBg: "bg-pink-400/8",    colorBorder: "border-pink-400/20" },
    { id: "selected",       title: "Selecionados",  colorDot: "bg-emerald-400", colorBg: "bg-emerald-400/8", colorBorder: "border-emerald-400/20" },
];

const STATUS_LABELS: Record<string, string> = {
    new: "Novo",
    approaching: "Para Abordar",
    approached: "Abordado",
    in_conversation: "Em Conversa",
    selected: "Selecionado",
    converted: "Convertido",
    lost: "Descartado",
};

function StatusDropdown({ currentStatus, onChange }: { currentStatus: Lead['status']; onChange: (s: Lead['status']) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={e => { e.stopPropagation(); setOpen(!open); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-text-secondary transition-all"
            >
                {STATUS_LABELS[currentStatus]}
                <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute top-full left-0 mt-1 bg-card border border-white/10 rounded-xl shadow-2xl z-50 min-w-[160px] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {COLUMNS.map(col => (
                            <button key={col.id} onClick={() => { onChange(col.id); setOpen(false); }}
                                className={cn("w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-left hover:bg-white/5 transition-colors",
                                    currentStatus === col.id ? "text-primary" : "text-text-secondary"
                                )}
                            >
                                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", col.colorDot)} />
                                {col.title}
                                {currentStatus === col.id && <Check className="w-3 h-3 ml-auto" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function Pipeline() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Drag & drop state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggingId(leadId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverCol(colId);
    };

    const handleDrop = async (e: React.DragEvent, colId: Lead['status']) => {
        e.preventDefault();
        if (draggingId) {
            const lead = leads.find(l => l.id === draggingId);
            if (lead && lead.status !== colId) {
                // 1. Optimistic UI update
                setLeads(prev => prev.map(l =>
                    l.id === draggingId ? { ...l, status: colId, updated_at: new Date().toISOString() } : l
                ));
                // 2. Persist to DB
                try {
                    await leadService.updateStatus(draggingId, colId);
                } catch (error) {
                    console.error("Failed to update status on DB:", error);
                    // Revert on error
                    fetchLeads();
                }
            }
        }
        setDraggingId(null);
        setDragOverCol(null);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverCol(null);
    };

    const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
        // 1. Optimistic UI update
        setLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, updated_at: new Date().toISOString() } : l
        ));
        // 2. Persist to DB
        try {
            await leadService.updateStatus(leadId, newStatus);
            handleLeadUpdate();
        } catch (error) {
            console.error("Failed to change status on DB:", error);
            // Revert on error
            fetchLeads();
        }
    };

    const handleOpenDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        try {
            const data = await leadService.getInteractions(lead.id);
            setInteractions(data);
        } catch (e) {
            setInteractions([]);
        }
    };

    const handleLeadUpdate = async () => {
        await fetchLeads();
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

    const openWhatsApp = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation();
        const clean = phone.replace(/\D/g, "");
        window.open(`https://wa.me/${clean}`, "_blank");
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
        <div className="flex gap-5 h-full overflow-x-auto pb-4 scrollbar-thin select-none">
            {COLUMNS.map(col => {
                const colLeads = leads.filter(l => l.status === col.id);
                const isOver = dragOverCol === col.id;
                return (
                    <div
                        key={col.id}
                        className="min-w-[280px] w-[280px] flex flex-col gap-3"
                        onDragOver={e => handleDragOver(e, col.id)}
                        onDragLeave={() => setDragOverCol(null)}
                        onDrop={e => handleDrop(e, col.id)}
                    >
                        {/* Cabeçalho */}
                        <div className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200",
                            col.colorBg, col.colorBorder
                        )}>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", col.colorDot)} />
                                <h3 className="text-xs font-bold uppercase tracking-wider">{col.title}</h3>
                                <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">{colLeads.length}</span>
                            </div>
                            <button className="p-1 hover:bg-white/10 rounded-lg text-text-secondary transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Área de drop */}
                        <div className={cn(
                            "flex-1 flex flex-col gap-2.5 rounded-2xl p-2 border min-h-[120px] transition-all duration-200 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none",
                            isOver
                                ? "bg-primary/5 border-primary/30 scale-[1.01]"
                                : "bg-white/[0.015] border-white/5"
                        )}>
                            {colLeads.length === 0 && (
                                <div className={cn(
                                    "flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed min-h-[80px] transition-all",
                                    isOver ? "border-primary/40 bg-primary/5" : "border-white/5"
                                )}>
                                    {isOver
                                        ? <ArrowRight className="w-4 h-4 text-primary animate-bounce" />
                                        : <p className="text-[10px] text-text-secondary italic">Arraste aqui</p>
                                    }
                                </div>
                            )}

                            {colLeads.map(lead => {
                                const isDragging = draggingId === lead.id;
                                const hasWhats = !!lead.phone;
                                return (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, lead.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleOpenDetails(lead)}
                                        className={cn(
                                            "glass-effect p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden",
                                            isDragging
                                                ? "opacity-40 scale-95 border-primary/20"
                                                : "border-white/5 hover:border-primary/20 hover:translate-y-[-2px]"
                                        )}
                                    >
                                        {/* Glowing radial ambient effect */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        {/* Top */}
                                        <div className="flex justify-between items-start mb-2.5 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-card border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-md group-hover:border-primary/40 transition-colors">
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
                                                    <div className={cn("w-full h-full bg-gradient-to-tr from-[#8a3ab9] via-[#e95950] to-[#fccc63] flex items-center justify-center text-[10px] font-bold text-white", lead.avatar_url ? "hidden" : "")}>
                                                        {lead.name?.charAt(0) || lead.handle.charAt(1).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold leading-tight text-white group-hover:text-primary transition-colors">{lead.handle}</p>
                                                    <p className="text-[10px] text-text-secondary leading-tight mt-0.5 truncate max-w-[120px]">{lead.name || lead.handle}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-primary shadow-[0_0_8px_rgba(201,160,92,0.1)]">
                                                <Target className="w-3 h-3 text-primary" />
                                                <span className="text-[10px] font-outfit font-extrabold text-primary">{lead.ai_score}</span>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mb-2.5 relative z-10">
                                            {lead.niche && <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-text-secondary uppercase">{lead.niche}</span>}
                                            {lead.age_range && <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-text-secondary uppercase">{lead.age_range} anos</span>}
                                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-text-secondary">
                                                {lead.followers ? (lead.followers >= 1000 ? `${(lead.followers / 1000).toFixed(0)}k` : lead.followers) : "—"}
                                            </span>
                                            {hasWhats && (
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">WA</span>
                                            )}
                                            {lead.email && (
                                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] font-bold text-blue-400 border border-blue-500/20">EMAIL</span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div
                                            className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <StatusDropdown
                                                currentStatus={lead.status}
                                                onChange={s => handleStatusChange(lead.id, s)}
                                            />
                                            <div className="flex items-center gap-1">
                                                {hasWhats && (
                                                    <button
                                                        onClick={e => openWhatsApp(e, lead.phone!)}
                                                        className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors group/wa"
                                                        title={`WhatsApp: ${lead.phone}`}
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5 text-text-secondary group-hover/wa:text-emerald-400 transition-colors" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleOpenDetails(lead); }}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <User className="w-3 h-3 text-text-secondary" />
                                                </button>
                                                <GripVertical className="w-3 h-3 text-text-secondary/30 cursor-grab" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

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
