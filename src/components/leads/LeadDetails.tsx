"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    X,
    Instagram,
    Mail,
    Phone,
    MapPin,
    Calendar,
    MessageSquare,
    History,
    User,
    Sparkles,
    Send,
    Target,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead, Interaction, leadService } from "@/services/lead-service";
import { templateService, DMTemplate } from "@/services/template-service";

interface LeadDetailsProps {
    lead: Lead;
    onClose: () => void;
    interactions: Interaction[];
    onUpdate?: () => void;
}

export function LeadDetails({ lead, onClose, interactions, onUpdate }: LeadDetailsProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<DMTemplate | null>(null);

    const handleStatusChange = async (newStatus: Lead['status']) => {
        setIsUpdating(true);
        try {
            await leadService.updateStatus(lead.id, newStatus);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendDM = async () => {
        if (!selectedTemplate) return;

        const message = templateService.hydrateTemplate(selectedTemplate.content, lead);

        try {
            await leadService.addInteraction(lead.id, {
                lead_id: lead.id,
                type: 'dm_sent',
                content: `DM Enviada: "${message}"`
            });
            setShowTemplates(false);
            setSelectedTemplate(null);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to log DM:", error);
        }
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-card/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                        <Instagram className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                        <h2 className="font-outfit font-bold text-lg tracking-tight">{lead.handle}</h2>
                        <p className="text-xs text-text-secondary">{lead.name}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('info')}
                    className={cn(
                        "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                        activeTab === 'info' ? "text-primary" : "text-text-secondary hover:text-foreground"
                    )}
                >
                    Informações
                    {activeTab === 'info' && (
                        <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={cn(
                        "px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                        activeTab === 'timeline' ? "text-primary" : "text-text-secondary hover:text-foreground"
                    )}
                >
                    Timeline
                    {activeTab === 'timeline' && (
                        <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {showTemplates ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold font-outfit uppercase tracking-wider">Templates de Abordagem</h3>
                            <button onClick={() => setShowTemplates(false)} className="text-xs text-text-secondary hover:text-foreground">Voltar</button>
                        </div>

                        <div className="space-y-3">
                            {templateService.getTemplates().map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={cn(
                                        "w-full p-4 rounded-xl border text-left transition-all space-y-2",
                                        selectedTemplate?.id === template.id
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                >
                                    <p className="text-xs font-bold uppercase tracking-widest">{template.name}</p>
                                    <p className="text-sm text-text-secondary line-clamp-2 italic">
                                        "{templateService.hydrateTemplate(template.content, lead)}"
                                    </p>
                                </button>
                            ))}
                        </div>

                        {selectedTemplate && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <p className="text-[10px] font-bold uppercase text-text-secondary">Preview Completo</p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {templateService.hydrateTemplate(selectedTemplate.content, lead)}
                                </p>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'info' ? (
                    <div className="space-y-8">
                        {/* Status Selector */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <Target className="w-3 h-3" />
                                Status Atual
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['new', 'approaching', 'approached', 'in_conversation', 'selected'] as Lead['status'][]).map((status) => (
                                    <button
                                        key={status}
                                        disabled={isUpdating}
                                        onClick={() => handleStatusChange(status)}
                                        className={cn(
                                            "px-3 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all text-left flex items-center justify-between",
                                            lead.status === status
                                                ? "bg-primary text-black border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                                                : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        {status.replace('_', ' ')}
                                        {lead.status === status && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                <p className="text-[10px] text-text-secondary font-bold uppercase">Fit Score</p>
                                <p className="text-xl font-outfit font-bold text-primary">{lead.ai_score}/100</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                <p className="text-[10px] text-text-secondary font-bold uppercase">Seguidores</p>
                                <p className="text-xl font-outfit font-bold">{lead.followers?.toLocaleString() || "N/A"}</p>
                            </div>
                        </div>

                        {/* AI Insights */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Sparkles className="w-4 h-4" />
                                <h3 className="text-sm font-bold font-outfit uppercase tracking-wider">Percepção da IA</h3>
                            </div>
                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-sm text-text-secondary leading-relaxed italic">
                                    "{lead.ai_summary || "Perfil em análise de potencial."}"
                                </p>
                                {lead.ai_characteristics && (
                                    <div className="mt-4 pt-4 border-t border-primary/10">
                                        <p className="text-[10px] text-primary font-outfit font-bold uppercase mb-2">Características Identificadas</p>
                                        <p className="text-xs text-text-secondary leading-relaxed">{lead.ai_characteristics}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact & Social */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Dados do Perfil</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Instagram className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Plataforma:</span>
                                    <span className="font-medium capitalize">{lead.platform}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-text-secondary" />
                                    <span className="text-text-secondary">Idade Estimada:</span>
                                    <span className="font-medium">{lead.age_range || "N/A"} anos</span>
                                </div>
                                {lead.location && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-text-secondary" />
                                        <span className="text-text-secondary">Localização:</span>
                                        <span className="font-medium">{lead.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                            <h3 className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Biografia</h3>
                            <p className="text-sm bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
                                {lead.bio || "Nenhuma biografia captada."}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Timeline */
                    <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-white/5 before:my-4">
                        {interactions.map((int, i) => (
                            <div key={i} className="relative pl-10">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-card border border-white/10 flex items-center justify-center z-10 shadow-lg">
                                    {int.type === 'status_change' && <History className="w-3 h-3 text-blue-400" />}
                                    {int.type === 'dm_sent' && <Send className="w-3 h-3 text-success" />}
                                    {int.type === 'note' && <MessageSquare className="w-3 h-3 text-text-secondary" />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase text-text-secondary">
                                            {new Date(int.created_at).toLocaleDateString()} • {new Date(int.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium">{int.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-card/50">
                <div className="flex gap-2">
                    {showTemplates ? (
                        <button
                            onClick={handleSendDM}
                            disabled={!selectedTemplate}
                            className="flex-1 py-3 px-4 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 disabled:opacity-50 disabled:grayscale"
                        >
                            <Send className="w-4 h-4" />
                            <span>Confirmar Envio de DM</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowTemplates(true)}
                                className="flex-1 py-3 px-4 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                            >
                                <Send className="w-4 h-4" />
                                <span>Mandar DM</span>
                            </button>
                            <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <MessageSquare className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
