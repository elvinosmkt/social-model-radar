"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import {
    Sparkles,
    Search,
    Instagram,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Target,
    ExternalLink,
    Users,
    UserPlus,
    Image as ImageIcon,
    BadgeCheck,
    Lock,
    Briefcase,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoutingFilters } from "@/services/ai-service";
import { leadService } from "@/services/lead-service";
import { captureAndAnalyzeLeadsAction } from "@/app/actions/ai-actions";

function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + 'k';
    return num.toString();
}

export default function CapturePage() {
    const [prompt, setPrompt] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [filters, setFilters] = useState<ScoutingFilters | null>(null);
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'success' | 'warning' | 'error';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showNotification = (type: 'success' | 'warning' | 'error', title: string, message: string) => {
        setModal({
            isOpen: true,
            type,
            title,
            message
        });
    };

    const handleAddLead = async (lead: any) => {
        try {
            await leadService.createLead({
                handle: lead.handle,
                name: lead.name,
                platform: lead.platform,
                followers: lead.followers,
                niche: lead.ai_niche,
                ai_score: lead.ai_score,
                ai_summary: lead.ai_summary,
                ai_characteristics: Array.isArray(lead.ai_characteristics) ? lead.ai_characteristics.join(", ") : lead.ai_characteristics,
                age_range: lead.age_range,
                bio: lead.bio,
                avatar_url: lead.avatar_url,
                external_link: lead.external_url,
                status: 'new',
                updated_at: new Date().toISOString()
            });
            showNotification('success', 'Lead Adicionado!', `O perfil ${lead.handle} foi inserido no seu pipeline de scouting.`);
        } catch (error: any) {
            console.error("Failed to add lead:", error);
            if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                showNotification('warning', 'Perfil Duplicado', `O perfil ${lead.handle} já está cadastrado no seu pipeline.`);
            } else {
                showNotification('error', 'Erro no Banco', `Falha ao salvar lead: ${error.message || "Por favor, tente novamente."}`);
            }
        }
    };

    const handleSearch = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!prompt.trim()) return;

        setIsSearching(true);
        setResults([]);
        setFilters(null);

        try {
            const { filters: extractedFilters, results: searchResults } = await captureAndAnalyzeLeadsAction(prompt);
            setResults(searchResults);
            setFilters(extractedFilters);
        } catch (error) {
            console.error("Failed to search leads:", error);
            showNotification('error', 'Erro na Conexão', 'Ocorreu um erro na conexão com a IA. Verifique se a sua chave de API do OpenAI é válida.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Captação Inteligente"
                subtitle="Use IA para identificar perfis ideais através de linguagem natural."
                showActions={false}
            />

            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar">
                {/* Search Bar Area */}
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                        <div className="relative glass-effect rounded-[2rem] p-2.5 md:p-4 flex items-center gap-2 md:gap-4 bg-card/80 outline-none border-white/5 group-focus-within:border-primary/30 transition-all">
                            <Sparkles className="w-5 h-5 md:w-6 h-6 text-primary ml-2 md:ml-4 shrink-0" />
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Ex: Mulheres de 40 anos com 5k..."
                                className="flex-1 bg-transparent border-none outline-none text-sm md:text-lg placeholder:text-text-secondary/50 font-medium min-w-0"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="bg-primary text-black p-2.5 md:p-3 rounded-[1.25rem] md:rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 shrink-0"
                            >
                                {isSearching ? <Loader2 className="w-5 h-5 md:w-6 h-6 animate-spin" /> : <Search className="w-5 h-5 md:w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:flex-wrap md:justify-center px-2 -mx-2 md:px-0 md:mx-0">
                        {["@fashion", "40+ anos", "Beleza", "5k - 20k seguidores", "Fitness"].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setPrompt(tag)}
                                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-secondary hover:text-primary hover:border-primary/30 transition-all shrink-0 active:scale-95"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Area */}
                {filters && (
                    <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
                        <div className="flex items-center justify-between py-2 border-b border-white/5 px-2">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                <p className="text-sm font-medium text-text-secondary">
                                    IA detectou:
                                    <span className="text-primary ml-1">
                                        Nicho {filters.niche || "Geral"} • {filters.minFollowers !== undefined && filters.maxFollowers !== undefined ? `${formatNumber(filters.minFollowers)}-${formatNumber(filters.maxFollowers)}` : "Qualquer"} seguidores • Idade aprox. {filters.ageRange || "qualquer"}
                                    </span>
                                </p>
                            </div>
                            <div className="text-xs font-bold text-text-secondary">
                                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((res, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        const username = res.handle.replace('@', '');
                                        window.open(`https://instagram.com/${username}`, '_blank');
                                    }}
                                    className="relative overflow-hidden backdrop-blur-md bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-4 md:p-6 group hover:translate-y-[-6px] hover:bg-white/[0.04] hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(201,160,92,0.15)] transition-all duration-500 cursor-pointer flex flex-col justify-between"
                                >
                                    {/* Glowing radial ambient effect */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div>
                                        {/* Header: Avatar + Handle + Badges */}
                                        <div className="flex items-start justify-between mb-5 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-purple-500 rounded-full blur opacity-40 group-hover:opacity-85 transition-opacity duration-500"></div>
                                                    {res.avatar_url ? (
                                                        <img
                                                            src={res.avatar_url}
                                                            alt={res.name}
                                                            referrerPolicy="no-referrer"
                                                            className="relative w-12 h-12 rounded-full object-cover border-2 border-background"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                                                if (fallback) {
                                                                    fallback.classList.remove('hidden');
                                                                    fallback.style.setProperty('display', 'grid', 'important');
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={cn("relative w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-purple-500/50 to-primary/50 border-2 border-background grid place-items-center", res.avatar_url ? "hidden" : "")}>
                                                        <Instagram className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-sm text-white group-hover:text-primary transition-colors duration-300">{res.handle}</p>
                                                        {res.is_verified && (
                                                            <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                                                        )}
                                                        {res.is_private && (
                                                            <Lock className="w-3 h-3 text-text-secondary/60" />
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-text-secondary/70 truncate max-w-[160px] font-medium">
                                                        {res.name || res.handle}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-text-secondary/40 group-hover:text-primary/70 transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                                                <ExternalLink className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        {res.bio && (
                                            <div className="mb-4 px-1 relative z-10">
                                                <p className="text-[11px] text-text-secondary/80 line-clamp-2 leading-relaxed">
                                                    {res.bio}
                                                </p>
                                            </div>
                                        )}

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 mb-5 relative z-10">
                                            <div className="text-center p-2 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-300">
                                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                                    <Users className="w-3.5 h-3.5 text-primary/70" />
                                                </div>
                                                <p className="text-sm font-extrabold text-white">{formatNumber(res.followers || 0)}</p>
                                                <p className="text-[8px] font-bold text-text-secondary/70 tracking-wider uppercase">Seguidores</p>
                                            </div>
                                            <div className="text-center p-2 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-300">
                                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                                    <UserPlus className="w-3.5 h-3.5 text-purple-400/70" />
                                                </div>
                                                <p className="text-sm font-extrabold text-white">{formatNumber(res.following || 0)}</p>
                                                <p className="text-[8px] font-bold text-text-secondary/70 tracking-wider uppercase">Seguindo</p>
                                            </div>
                                            <div className="text-center p-2 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-300">
                                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400/70" />
                                                </div>
                                                <p className="text-sm font-extrabold text-white">{formatNumber(res.post_count || 0)}</p>
                                                <p className="text-[8px] font-bold text-text-secondary/70 tracking-wider uppercase">Posts</p>
                                            </div>
                                        </div>

                                        {/* AI Analysis */}
                                        <div className="space-y-3 mb-5 p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.03] relative z-10">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-text-secondary font-medium">Scouting Match</span>
                                                <span className="font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(201,160,92,0.1)]">
                                                    {res.ai_score}/100
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(201,160,92,0.3)]"
                                                    style={{
                                                        width: `${res.ai_score}%`,
                                                        background: res.ai_score >= 70
                                                            ? 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))'
                                                            : res.ai_score >= 40
                                                                ? 'linear-gradient(90deg, #eab308, #facc15)'
                                                                : 'linear-gradient(90deg, #ef4444, #f87171)'
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.02]">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-text-secondary/60">Nicho Recomendado</span>
                                                    <span className="font-semibold text-white text-[11px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                        {res.ai_niche}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-text-secondary/60">Faixa Etária (IA)</span>
                                                    <span className="font-semibold text-white text-[11px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                                        {res.age_range}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business / Category badges */}
                                        {(res.is_business || res.business_category || res.external_url) && (
                                            <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                                                {res.is_business && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider">
                                                        <Briefcase className="w-2.5 h-2.5" /> Business
                                                    </span>
                                                )}
                                                {res.business_category && res.business_category !== 'None' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-bold max-w-[150px] truncate">
                                                        {res.business_category}
                                                    </span>
                                                )}
                                                {res.external_url && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-bold">
                                                        <Globe className="w-2.5 h-2.5" /> Website
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* AI Summary */}
                                        {res.ai_summary && (
                                            <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.01] border border-white/[0.02] text-left mb-5 relative z-10">
                                                <p className="text-[10px] text-text-secondary italic leading-relaxed font-medium">
                                                    "{res.ai_summary}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-4 border-t border-white/[0.05] relative z-10 mt-auto">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddLead(res);
                                            }}
                                            className="w-full py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-xs font-extrabold text-white hover:bg-gradient-to-r hover:from-primary hover:to-primary-light hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(201,160,92,0.35)] transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary-light group-hover:text-black group-hover:border-transparent"
                                        >
                                            <span>Adicionar ao Pipeline</span>
                                            <ArrowRight className="w-4 h-4 transition-transform duration-300 transform group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isSearching && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-outfit font-bold">Buscando perfis...</h3>
                            <p className="text-sm text-text-secondary max-w-sm">A IA está analisando perfis do Instagram. Isso pode levar alguns segundos.</p>
                        </div>
                    </div>
                )}

                {/* Empty State / Tips */}
                {!filters && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-6">
                        <div className="relative flex items-center justify-center w-28 h-28">
                            {/* Glowing concentric wave rings */}
                            <div className="absolute inset-0 rounded-full bg-primary/5 animate-[ping_3s_infinite] opacity-35"></div>
                            <div className="absolute inset-2 rounded-full bg-primary/10 animate-[ping_2s_infinite] opacity-50"></div>
                            <div className="absolute inset-4 rounded-full border border-primary/20 animate-pulse"></div>
                            
                            {/* Center radar disk */}
                            <div className="relative w-16 h-16 rounded-full bg-card border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(201,160,92,0.2)]">
                                <Target className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2 max-w-sm px-6">
                            <h3 className="text-xl font-outfit font-bold premium-gradient-text">O seu Radar está pronto</h3>
                            <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                Digite acima o perfil ideal que você deseja encontrar. Nossa IA fará o scouting completo no Instagram em tempo real.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Premium Notification Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300"
                    />

                    {/* Card container */}
                    <div className="relative w-full max-w-sm backdrop-blur-xl bg-card-glass border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-up">
                        {/* Glowing radial effect behind icon */}
                        <div className={cn(
                            "absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none",
                            modal.type === 'success' ? 'bg-success/40' : modal.type === 'warning' ? 'bg-amber-500/40' : 'bg-danger/40'
                        )} />

                        {/* Icon Container */}
                        <div className="flex justify-center">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg",
                                modal.type === 'success' 
                                    ? 'bg-success/10 border-success/20 text-success shadow-success/10' 
                                    : modal.type === 'warning' 
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10' 
                                        : 'bg-danger/10 border-danger/20 text-danger shadow-danger/10'
                            )}>
                                {modal.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
                                {modal.type === 'warning' && <Target className="w-8 h-8 text-amber-400" />}
                                {modal.type === 'error' && <Lock className="w-8 h-8 text-danger" />}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-outfit font-extrabold text-white tracking-tight">
                                {modal.title}
                            </h3>
                            <p className="text-xs text-text-secondary leading-relaxed px-2 font-medium">
                                {modal.message}
                            </p>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                                className={cn(
                                    "w-full py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 active:scale-[0.98] cursor-pointer",
                                    modal.type === 'success'
                                        ? 'bg-primary text-black hover:opacity-90 shadow-[0_5px_15px_rgba(201,160,92,0.3)]'
                                        : modal.type === 'warning'
                                            ? 'bg-amber-500 text-black hover:opacity-90 shadow-[0_5px_15px_rgba(245,158,11,0.3)]'
                                            : 'bg-danger text-white hover:opacity-90 shadow-[0_5px_15px_rgba(239,68,68,0.3)]'
                                )}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
