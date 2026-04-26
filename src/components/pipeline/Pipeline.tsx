"use client";

import { useState, useRef } from "react";
import {
    Plus,
    Target,
    ChevronDown,
    Check,
    User,
    MessageCircle,
    Phone,
    ArrowRight,
    GripVertical
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
    new: "Novo", approaching: "Para Abordar", approached: "Abordado",
    in_conversation: "Em Conversa", selected: "Selecionado",
    converted: "Convertido", lost: "Descartado",
};

const mockLeads: Lead[] = [
    { id: "1", handle: "@isabella.f",    name: "Isabella Ferreira", status: "new",            ai_score: 92, followers: 45000, niche: "Beauty",    age_range: "22", updated_at: new Date().toISOString(), platform: "instagram", ai_summary: "Alto engajamento em maquiagem.", ai_characteristics: "Estética limpa, perfil profissional.", phone: "+55 41 99999-1111" },
    { id: "2", handle: "@adriana_m40",   name: "Adriana Medeiros",  status: "approaching",    ai_score: 85, followers: 12000, niche: "Fashion",   age_range: "42", updated_at: new Date().toISOString(), platform: "instagram" },
    { id: "3", handle: "@carol.style",   name: "Carolina Santos",   status: "approaching",    ai_score: 78, followers: 8500,  niche: "Lifestyle", age_range: "29", updated_at: new Date().toISOString(), platform: "instagram", email: "carol@style.com" },
    { id: "4", handle: "@lua.creator",   name: "Luanda Ferreira",   status: "approached",     ai_score: 91, followers: 9800,  niche: "Beauty",    age_range: "22", updated_at: new Date().toISOString(), platform: "instagram", phone: "+55 11 98888-2222" },
    { id: "5", handle: "@mari.premium",  name: "Mariana Pires",     status: "in_conversation",ai_score: 96, followers: 7600,  niche: "Luxury",    age_range: "35", updated_at: new Date().toISOString(), platform: "instagram", phone: "+55 21 97777-3333", email: "mari@premium.com" },
    { id: "6", handle: "@bia.fitness",   name: "Beatriz Almeida",   status: "selected",       ai_score: 79, followers: 55000, niche: "Fitness",   age_range: "26", updated_at: new Date().toISOString(), platform: "instagram" },
    { id: "7", handle: "@juju.modaetc", name: "Juliana Ramos",     status: "new",            ai_score: 87, followers: 43000, niche: "Fashion",   age_range: "25", updated_at: new Date().toISOString(), platform: "instagram", phone: "+55 51 96666-4444" },
];

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
    const [leads, setLeads] = useState<Lead[]>(mockLeads);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);

    // Drag & drop state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggingId(leadId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverCol(colId);
    };

    const handleDrop = (e: React.DragEvent, colId: Lead['status']) => {
        e.preventDefault();
        if (draggingId && draggingId !== colId) {
            setLeads(prev => prev.map(l =>
                l.id === draggingId ? { ...l, status: colId, updated_at: new Date().toISOString() } : l
            ));
        }
        setDraggingId(null);
        setDragOverCol(null);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverCol(null);
    };

    const handleStatusChange = (leadId: string, newStatus: Lead['status']) => {
        setLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus, updated_at: new Date().toISOString() } : l
        ));
    };

    const handleOpenDetails = async (lead: Lead) => {
        setSelectedLead(lead);
        try { setInteractions(await leadService.getInteractions(lead.id)); }
        catch { setInteractions([]); }
    };

    const openWhatsApp = (e: React.MouseEvent, phone: string) => {
        e.stopPropagation();
        const clean = phone.replace(/\D/g, "");
        window.open(`https://wa.me/${clean}`, "_blank");
    };

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
                            "flex-1 flex flex-col gap-2.5 rounded-2xl p-2 border min-h-[120px] transition-all duration-200",
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
                                            "glass-effect p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing group",
                                            isDragging
                                                ? "opacity-40 scale-95 border-primary/20"
                                                : "border-white/5 hover:border-primary/20 hover:translate-y-[-2px]"
                                        )}
                                    >
                                        {/* Top */}
                                        <div className="flex justify-between items-start mb-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                                                    {lead.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold leading-tight">{lead.handle}</p>
                                                    <p className="text-[10px] text-text-secondary leading-tight">{lead.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Target className="w-3 h-3 text-primary" />
                                                <span className="text-[11px] font-outfit font-bold text-primary">{lead.ai_score}</span>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mb-2.5">
                                            {lead.niche && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-text-secondary uppercase">{lead.niche}</span>}
                                            {lead.age_range && <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-text-secondary uppercase">{lead.age_range} anos</span>}
                                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-text-secondary">{lead.followers ? `${(lead.followers / 1000).toFixed(0)}k` : "—"}</span>
                                            {hasWhats && (
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">WA</span>
                                            )}
                                            {lead.email && (
                                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] font-bold text-blue-400 border border-blue-500/20">EMAIL</span>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div
                                            className="flex items-center justify-between pt-2 border-t border-white/5"
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
                        onUpdate={() => {}}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
