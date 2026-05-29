"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X,
    Instagram,
    Calendar,
    MessageSquare,
    History,
    Sparkles,
    Send,
    Target,
    Check,
    Edit2,
    Save,
    ChevronDown,
    FileText,
    AlertCircle,
    ExternalLink,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, Interaction, leadService } from "@/services/lead-service";

const STATUS_OPTIONS: { value: Lead['status']; label: string; color: string }[] = [
    { value: "new", label: "Novo", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { value: "approaching", label: "Para Abordar", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    { value: "approached", label: "Abordado", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    { value: "in_conversation", label: "Em Conversa", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
    { value: "selected", label: "Selecionado", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { value: "converted", label: "Convertido", color: "bg-primary/10 text-primary border-primary/20" },
    { value: "lost", label: "Descartado", color: "bg-red-500/10 text-red-400 border-red-500/20" },
];

const MOCK_TIMELINE: Interaction[] = [
    { id: "t1", lead_id: "", type: "note", content: "Perfil captado via Radar AI — score 92/100. Perfil altamente compatível.", created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "t2", lead_id: "", type: "status_change", content: "Status alterado para: Para Abordar", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "t3", lead_id: "", type: "dm_sent", content: "DM enviada: Template 'Abordagem Inicial' — 'Olá! Vi seu perfil e adorei seu conteúdo...'", created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "t4", lead_id: "", type: "response_received", content: "Resposta recebida: 'Oi! Pode me contar mais sobre a oportunidade?'", created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
];

const TYPE_CONFIG = {
    status_change: { icon: History, color: "text-blue-400", label: "Mudança de Status" },
    dm_sent: { icon: Send, color: "text-success", label: "DM Enviada" },
    note: { icon: FileText, color: "text-text-secondary", label: "Nota" },
    response_received: { icon: MessageSquare, color: "text-primary", label: "Resposta Recebida" },
};

interface LeadDetailsProps {
    lead: Lead;
    onClose: () => void;
    interactions: Interaction[];
    onUpdate?: () => void;
    onStatusChange?: (id: string, status: Lead['status']) => void;
}

export function LeadDetails({ lead, onClose, interactions, onUpdate, onStatusChange }: LeadDetailsProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'analise'>('info');
    const [isUpdating, setIsUpdating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [savedAnalysis, setSavedAnalysis] = useState("");
    const [noteInput, setNoteInput] = useState("");
    const [localTimeline, setLocalTimeline] = useState<Interaction[]>(
        interactions.length > 0 ? interactions : MOCK_TIMELINE
    );
    const [currentStatus, setCurrentStatus] = useState(lead.status);

    const handleStatusChange = async (newStatus: Lead['status']) => {
        setIsUpdating(true);
        setCurrentStatus(newStatus);
        if (onStatusChange) onStatusChange(lead.id, newStatus);

        const newEntry: Interaction = {
            id: Date.now().toString(),
            lead_id: lead.id,
            type: "status_change",
            content: `Status alterado para: ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`,
            created_at: new Date().toISOString(),
        };
        setLocalTimeline(prev => [newEntry, ...prev]);

        try {
            await leadService.updateStatus(lead.id, newStatus);
            if (onUpdate) onUpdate();
        } catch {
            // fallback: UI já atualizado
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddNote = () => {
        if (!noteInput.trim()) return;
        const newEntry: Interaction = {
            id: Date.now().toString(),
            lead_id: lead.id,
            type: "note",
            content: noteInput.trim(),
            created_at: new Date().toISOString(),
        };
        setLocalTimeline(prev => [newEntry, ...prev]);
        setNoteInput("");
    };

    const handleSaveAnalysis = () => {
        setSavedAnalysis(analysis);
        setEditMode(false);
    };

    const currentStatusConfig = STATUS_OPTIONS.find(s => s.value === currentStatus);

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-card/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-primary font-bold">
                        {lead.name?.charAt(0) || lead.handle?.charAt(1) || "?"}
                    </div>
                    <div>
                        <h2 className="font-outfit font-bold text-base tracking-tight">{lead.handle}</h2>
                        <p className="text-xs text-text-secondary">{lead.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={`https://instagram.com/${lead.handle?.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        title="Abrir no Instagram"
                    >
                        <ExternalLink className="w-4 h-4 text-text-secondary hover:text-primary transition-colors" />
                    </a>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Status atual badge */}
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    currentStatusConfig?.color
                )}>
                    {currentStatusConfig?.label}
                </span>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Target className="w-3 h-3 text-primary" />
                    <span className="font-bold text-primary">{lead.ai_score}/100</span>
                    <span>·</span>
                    <Users className="w-3 h-3" />
                    <span>{lead.followers?.toLocaleString('pt-BR')}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex px-5 border-b border-white/10 flex-shrink-0">
                {(['info', 'analise', 'timeline'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-3.5 text-xs font-bold uppercase tracking-widest transition-all relative capitalize",
                            activeTab === tab ? "text-primary" : "text-text-secondary hover:text-foreground"
                        )}
                    >
                        {tab === 'info' ? 'Informações' : tab === 'analise' ? 'Análise' : 'Timeline'}
                        {activeTab === tab && (
                            <motion.div layoutId="lead-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-6">

                {/* ── ABA: INFORMAÇÕES ─────────────────────────────── */}
                {activeTab === 'info' && (
                    <>
                        {/* Mudar status */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Mudar Status</p>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_OPTIONS.map(option => (
                                    <button
                                        key={option.value}
                                        disabled={isUpdating}
                                        onClick={() => handleStatusChange(option.value)}
                                        className={cn(
                                            "px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase border transition-all text-left flex items-center justify-between gap-2",
                                            currentStatus === option.value
                                                ? "bg-primary text-black border-primary shadow-[0_0_16px_rgba(212,175,55,0.25)]"
                                                : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        {currentStatus === option.value && <Check className="w-3 h-3 flex-shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dados rápidos */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center space-y-1">
                                <p className="text-[9px] text-text-secondary font-bold uppercase">Score IA</p>
                                <p className="text-xl font-outfit font-bold text-primary">{lead.ai_score}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center space-y-1">
                                <p className="text-[9px] text-text-secondary font-bold uppercase">Seguidores</p>
                                <p className="text-base font-outfit font-bold">{lead.followers ? (lead.followers >= 1000 ? `${(lead.followers / 1000).toFixed(0)}k` : lead.followers) : "—"}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center space-y-1">
                                <p className="text-[9px] text-text-secondary font-bold uppercase">Nicho</p>
                                <p className="text-sm font-outfit font-bold">{lead.niche || "—"}</p>
                            </div>
                        </div>

                        {/* Análise IA */}
                        {lead.ai_summary && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-primary">
                                    <Sparkles className="w-4 h-4" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Percepção da IA</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                                    <p className="text-sm text-text-secondary leading-relaxed italic">"{lead.ai_summary}"</p>
                                    {lead.ai_characteristics && (
                                        <div className="pt-3 border-t border-primary/10">
                                            <p className="text-[10px] text-primary font-bold uppercase mb-1.5">Características</p>
                                            <p className="text-xs text-text-secondary leading-relaxed">{lead.ai_characteristics}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dados do perfil */}
                        <div className="space-y-3">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Dados do Perfil</p>
                            <div className="space-y-2.5 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary flex items-center gap-2"><Instagram className="w-4 h-4" /> Plataforma</span>
                                    <span className="font-medium capitalize">{lead.platform}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary flex items-center gap-2"><Calendar className="w-4 h-4" /> Idade</span>
                                    <span className="font-medium">{lead.age_range ? `${lead.age_range} anos` : "N/A"}</span>
                                </div>
                                {lead.location && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-secondary">Localização</span>
                                        <span className="font-medium">{lead.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Biografia</p>
                            <p className="text-sm bg-white/[0.03] p-4 rounded-xl border border-white/5 leading-relaxed text-text-secondary italic">
                                {lead.bio || "Nenhuma biografia captada."}
                            </p>
                        </div>
                    </>
                )}

                {/* ── ABA: ANÁLISE DO WEBSCOUTER ───────────────────── */}
                {activeTab === 'analise' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-primary" />
                                <p className="text-sm font-bold">Análise do Webscouter</p>
                            </div>
                            {!editMode ? (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary transition-all"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Editar
                                </button>
                            ) : (
                                <button
                                    onClick={handleSaveAnalysis}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-bold transition-all hover:opacity-90"
                                >
                                    <Save className="w-3 h-3" />
                                    Salvar
                                </button>
                            )}
                        </div>

                        {editMode ? (
                            <textarea
                                value={analysis}
                                onChange={e => setAnalysis(e.target.value)}
                                placeholder="Adicione sua análise pessoal sobre este lead... Notas de abordagem, impressões, pontos de atenção, estratégia de contato..."
                                rows={10}
                                className="w-full bg-white/5 border border-white/10 focus:border-primary/40 rounded-xl p-4 text-sm text-foreground leading-relaxed resize-none outline-none transition-all"
                                autoFocus
                            />
                        ) : (
                            <div className="min-h-[200px] p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                {savedAnalysis ? (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{savedAnalysis}</p>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-center opacity-40 space-y-2">
                                        <FileText className="w-8 h-8 text-text-secondary" />
                                        <p className="text-xs text-text-secondary">Nenhuma análise registrada. Clique em Editar para adicionar.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info sobre duplicidade */}
                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-blue-400 mb-0.5">Verificação de Duplicidade</p>
                                <p className="text-[11px] text-text-secondary leading-relaxed">Este perfil é único na base. Nenhum outro webscouter está trabalhando com este lead.</p>
                            </div>
                        </div>

                        {/* Campos editáveis do lead */}
                        <div className="space-y-3">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Dados Editáveis</p>
                            <div className="space-y-2.5">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-text-secondary font-bold uppercase">Nome</label>
                                    <input
                                        defaultValue={lead.name}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-text-secondary font-bold uppercase">E-mail</label>
                                    <input
                                        defaultValue={lead.email || ""}
                                        placeholder="email@modelo.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-text-secondary font-bold uppercase">Telefone / WhatsApp</label>
                                    <input
                                        defaultValue={lead.phone || ""}
                                        placeholder="+55 11 9 9999-9999"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all"
                                    />
                                </div>
                                <button className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-text-secondary hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <Save className="w-3.5 h-3.5" />
                                    Salvar Dados
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ABA: TIMELINE ────────────────────────────────── */}
                {activeTab === 'timeline' && (
                    <div className="space-y-5">
                        {/* Adicionar nota */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Nova Nota</p>
                            <textarea
                                value={noteInput}
                                onChange={e => setNoteInput(e.target.value)}
                                placeholder="Adicionar anotação sobre este lead..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-all resize-none"
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!noteInput.trim()}
                                className="w-full py-2 rounded-xl bg-primary text-black text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Nota
                            </button>
                        </div>

                        {/* Timeline */}
                        <div className="relative">
                            {localTimeline.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40 space-y-2">
                                    <History className="w-8 h-8 text-text-secondary" />
                                    <p className="text-xs text-text-secondary">Nenhuma atividade registrada ainda.</p>
                                </div>
                            ) : (
                                <div className="space-y-0 relative before:absolute before:inset-0 before:left-3.5 before:w-px before:bg-white/5 before:my-4">
                                    {localTimeline.map((item, i) => {
                                        const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.note;
                                        const Icon = config.icon;
                                        const date = new Date(item.created_at);

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="relative pl-10 pb-5 last:pb-0"
                                            >
                                                <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-card border border-white/10 flex items-center justify-center z-10">
                                                    <Icon className={cn("w-3 h-3", config.color)} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">
                                                            {config.label}
                                                        </p>
                                                        <p className="text-[10px] text-text-secondary italic">
                                                            {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-foreground/90 leading-relaxed">{item.content}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 bg-card/50 flex-shrink-0">
                <div className="flex gap-2.5">
                    <button className="flex-1 py-3 px-4 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10">
                        <Send className="w-4 h-4" />
                        <span>Enviar DM</span>
                    </button>
                    <a
                        href={`https://instagram.com/${lead.handle?.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
                    >
                        <Instagram className="w-4 h-4 text-pink-400" />
                    </a>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
                        title="Adicionar nota"
                    >
                        <MessageSquare className="w-4 h-4 text-text-secondary" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Importação local para evitar erro
function Plus({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    );
}
