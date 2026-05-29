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
    Globe,
    Plus,
    Filter,
    Zap,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { captureAndAnalyzeLeadsAction, captureSimilarLeadsAction } from "@/app/actions/ai-actions";
import { leadService } from "@/services/lead-service";
import { ScoutingFilters } from "@/services/ai-service";
import { useAuth } from "@/lib/context/AuthContext";
import { creditService } from "@/services/credit-service";
import { useEffect } from "react";

const COUNTRIES = ["Brasil", "Portugal", "EUA", "Argentina", "México", "Espanha", "Colômbia"];
const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Italiano"];
const NICHES = ["Beleza / Skincare", "Moda / Fashion", "Fitness / Saúde", "Lifestyle", "Luxo / Premium", "Culinária", "Viagem", "Educação", "Maternidade", "Sustentabilidade", "Tecnologia", "Outro"];

function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace('.0', '') + 'k';
    return num.toString();
}

export default function CapturePage() {
    const { user } = useAuth();
    const [mode, setMode] = useState<'prompt' | 'lookalike'>('prompt');
    const [prompt, setPrompt] = useState("");
    const [quantity, setQuantity] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [showQty, setShowQty] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [balance, setBalance] = useState(380);

    // Results states
    const [results, setResults] = useState<any[]>([]);
    const [filters, setFilters] = useState<ScoutingFilters | null>(null);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [selectedToExport, setSelectedToExport] = useState<Set<string>>(new Set());

    // Fetch credits dynamically from Supabase
    useEffect(() => {
        if (user) {
            creditService.getUserCredits(user.id).then(c => {
                setBalance(c.balance);
            });
        }
    }, [user]);

    // Advanced filters from partner
    const [country, setCountry] = useState("Brasil");
    const [language, setLanguage] = useState("Português");
    const [niche, setNiche] = useState("");
    const [product, setProduct] = useState("");
    const [lookalike, setLookalike] = useState("");

    // Custom glowing notifications modal
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

    // Selection handlers
    const allSelected = results.length > 0 && selectedToExport.size === results.slice(0, quantity).filter(r => !addedIds.has(r.handle)).length;

    const toggleSelect = (handle: string) => {
        setSelectedToExport(prev => {
            const next = new Set(prev);
            next.has(handle) ? next.delete(handle) : next.add(handle);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const batchLeads = results.slice(0, quantity).filter(r => !addedIds.has(r.handle));
        if (allSelected) {
            setSelectedToExport(new Set());
        } else {
            setSelectedToExport(new Set(batchLeads.map(r => r.handle)));
        }
    };

    // Real single lead save
    const handleAddLead = async (lead: any) => {
        try {
            await leadService.createLead({
                handle: lead.handle,
                name: lead.name,
                platform: lead.platform || 'instagram',
                followers: lead.followers,
                niche: lead.ai_niche || lead.niche,
                ai_score: lead.ai_score || 50,
                ai_summary: lead.ai_summary || '',
                ai_characteristics: Array.isArray(lead.ai_characteristics) ? lead.ai_characteristics.join(", ") : lead.ai_characteristics || '',
                age_range: lead.age_range || '',
                bio: lead.bio || '',
                avatar_url: lead.avatar_url || '',
                external_link: lead.external_url || lead.external_link || '',
                status: 'new',
                updated_at: new Date().toISOString()
            });
            showNotification('success', 'Lead Adicionado!', `O perfil ${lead.handle} foi inserido no seu pipeline de scouting.`);
            setAddedIds(prev => new Set([...prev, lead.handle]));
            setSelectedToExport(prev => {
                const next = new Set(prev);
                next.delete(lead.handle);
                return next;
            });
        } catch (error: any) {
            console.error("Failed to add lead:", error);
            if (error.code === 'DUPLICATE_LEAD') {
                showNotification('warning', 'Bloqueio Anti-Duplicidade', error.message);
                setAddedIds(prev => new Set([...prev, lead.handle]));
                setSelectedToExport(prev => {
                    const next = new Set(prev);
                    next.delete(lead.handle);
                    return next;
                });
            } else if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                showNotification('warning', 'Perfil Duplicado', `O perfil ${lead.handle} já está cadastrado no seu pipeline.`);
                setAddedIds(prev => new Set([...prev, lead.handle]));
                setSelectedToExport(prev => {
                    const next = new Set(prev);
                    next.delete(lead.handle);
                    return next;
                });
            } else {
                showNotification('error', 'Erro no Banco', `Falha ao salvar lead: ${error.message || "Por favor, tente novamente."}`);
            }
        }
    };

    // Real batch save (multi-selection)
    const handleExportToPipeline = async () => {
        const toExport = results.slice(0, quantity).filter((r: any) => selectedToExport.has(r.handle) && !addedIds.has(r.handle));
        if (toExport.length === 0) return;

        setIsSearching(true);
        let successCount = 0;
        let duplicateCount = 0;
        let failCount = 0;

        const newAddedIds = new Set(addedIds);

        for (const lead of toExport) {
            try {
                await leadService.createLead({
                    handle: lead.handle,
                    name: lead.name,
                    platform: lead.platform || 'instagram',
                    followers: lead.followers,
                    niche: lead.ai_niche || lead.niche,
                    ai_score: lead.ai_score || 50,
                    ai_summary: lead.ai_summary || '',
                    ai_characteristics: Array.isArray(lead.ai_characteristics) ? lead.ai_characteristics.join(", ") : lead.ai_characteristics || '',
                    age_range: lead.age_range || '',
                    bio: lead.bio || '',
                    avatar_url: lead.avatar_url || '',
                    external_link: lead.external_url || lead.external_link || '',
                    status: 'new',
                    updated_at: new Date().toISOString()
                });
                newAddedIds.add(lead.handle);
                successCount++;
            } catch (error: any) {
                if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                    newAddedIds.add(lead.handle);
                    duplicateCount++;
                } else {
                    failCount++;
                }
            }
        }

        setAddedIds(newAddedIds);
        setSelectedToExport(new Set());
        setIsSearching(false);

        if (successCount > 0) {
            showNotification('success', 'Leads Exportados!', `${successCount} novos perfis foram inseridos no seu pipeline de scouting.${duplicateCount > 0 ? ` (${duplicateCount} já estavam cadastrados).` : ''}`);
        } else if (duplicateCount > 0) {
            showNotification('warning', 'Perfis Duplicados', `Todos os ${duplicateCount} perfis selecionados já estavam cadastrados no pipeline.`);
        } else if (failCount > 0) {
            showNotification('error', 'Falha na Exportação', `Ocorreu um erro ao salvar os perfis no banco de dados.`);
        }
    };

    // Real search handler combining both modes
    const handleSearch = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();

        const searchQuery = mode === 'prompt' ? prompt : lookalike;
        if (!searchQuery.trim()) return;

        if (balance < quantity) {
            showNotification('error', 'Créditos Insuficientes', `Essa busca requer ${quantity} créditos, mas você possui apenas ${balance} disponíveis.`);
            return;
        }

        setIsSearching(true);
        setResults([]);
        setFilters(null);
        setSelectedToExport(new Set());

        try {
            if (mode === 'prompt') {
                const { filters: extractedFilters, results: searchResults, creditsConsumed } = await captureAndAnalyzeLeadsAction(searchQuery, quantity);
                setResults(searchResults);
                setFilters(extractedFilters);

                // Consume credits from database dynamically (only for non-duplicate leads!)
                if (user && searchResults.length > 0 && creditsConsumed > 0) {
                    await creditService.consumeCredits(user.id, creditsConsumed);
                    setBalance(prev => Math.max(0, prev - creditsConsumed));
                }
            } else {
                const { results: searchResults, filters: extractedFilters, creditsConsumed } = await captureSimilarLeadsAction(searchQuery, quantity);
                setResults(searchResults);
                setFilters(extractedFilters);

                // Consume credits from database dynamically (only for non-duplicate leads!)
                if (user && searchResults.length > 0 && creditsConsumed > 0) {
                    await creditService.consumeCredits(user.id, creditsConsumed);
                    setBalance(prev => Math.max(0, prev - creditsConsumed));
                }
            }
        } catch (error: any) {
            console.error("Failed to search leads:", error);
            showNotification('error', 'Erro na Busca', error.message || 'Ocorreu um erro na conexão com a IA. Verifique se a sua chave de API do OpenAI é válida.');
        } finally {
            setIsSearching(false);
        }
    };

    const buildAutoPrompt = () => {
        const parts = [];
        if (product) parts.push(`produto: "${product}"`);
        if (niche) parts.push(`nicho: ${niche}`);
        if (country) parts.push(`país: ${country}`);
        if (language && language !== "Português") parts.push(`idioma: ${language}`);
        return parts.join(", ");
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <Header title="Captação Inteligente" subtitle="Use IA para identificar perfis ideais — Radar AI ou Lookalike." showActions={false} />

            {/* Mode tabs + advanced controls */}
            <div className="px-4 md:px-8 mt-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2">
                    {([{ id: 'prompt', label: 'Radar AI', icon: Sparkles }, { id: 'lookalike', label: 'Lookalike', icon: Zap }] as const).map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id);
                                setResults([]);
                                setFilters(null);
                                setSelectedToExport(new Set());
                            }}
                            className={cn("flex items-center gap-2 px-4 md:px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer",
                                mode === m.id ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-white/5 text-text-secondary hover:bg-white/10"
                            )}
                        >
                            <m.icon className="w-3.5 h-3.5" />
                            {m.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowFilters(!showFilters); setShowQty(false); }}
                        className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                            showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/10"
                        )}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filtros
                        {(country !== "Brasil" || language !== "Português" || niche || product) && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                    </button>
                    <button
                        onClick={() => { setShowQty(!showQty); setShowFilters(false); }}
                        className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                            showQty ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/10"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" />
                        {quantity} leads
                    </button>
                </div>
            </div>

            {/* Sliding advanced filters panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mx-4 md:mx-8 mt-4 p-5 glass-effect rounded-2xl border border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1"><Globe className="w-3 h-3" /> País</label>
                                <select
                                    value={country}
                                    onChange={e => setCountry(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all cursor-pointer text-white"
                                >
                                    {COUNTRIES.map(c => <option key={c} value={c} className="bg-neutral-900">{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Idioma</label>
                                <select
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all cursor-pointer text-white"
                                >
                                    {LANGUAGES.map(l => <option key={l} value={l} className="bg-neutral-900">{l}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nicho</label>
                                <select
                                    value={niche}
                                    onChange={e => setNiche(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all cursor-pointer text-white"
                                >
                                    <option value="" className="bg-neutral-900">Todos os nichos</option>
                                    {NICHES.map(n => <option key={n} value={n} className="bg-neutral-900">{n}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Produto / Oferta</label>
                                <input
                                    value={product}
                                    onChange={e => setProduct(e.target.value)}
                                    placeholder="Ex: Curso de Modelo"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all text-white placeholder:text-text-secondary/30"
                                />
                            </div>
                            {/* Auto prompt generator */}
                            {buildAutoPrompt() && (
                                <div className="col-span-full flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                                    <p className="text-xs text-text-secondary flex-1">Prompt auto-gerado: <span className="text-primary font-medium">{buildAutoPrompt()}</span></p>
                                    <button
                                        onClick={() => {
                                            setPrompt(buildAutoPrompt());
                                            setMode('prompt');
                                            showNotification('success', 'Prompt Aplicado', 'O prompt gerado pelos filtros foi copiado para a barra de busca.');
                                        }}
                                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        Usar
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sliding quantity panel */}
            <AnimatePresence>
                {showQty && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mx-4 md:mx-8 mt-4 p-5 glass-effect rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Limite de Resultados</p>
                                <span className="text-3xl font-outfit font-bold text-primary">{quantity}</span>
                            </div>
                            <input
                                type="range"
                                min={5}
                                max={50}
                                step={5}
                                value={quantity}
                                onChange={e => setQuantity(Number(e.target.value))}
                                className="w-full accent-primary cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                            />
                            <div className="flex justify-between text-[10px] text-text-secondary font-bold mt-2">
                                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(v => <span key={v}>{v}</span>)}
                            </div>
                            <p className="text-[11px] text-text-secondary mt-3">
                                Custo de busca: <span className="text-primary font-bold">{quantity} créditos</span> · Sua conta tem <span className="font-bold text-white">{balance} disponíveis</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scrollable Container */}
            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar flex-1">
                {/* Search Bar Area */}
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    {mode === 'prompt' ? (
                        /* Radar AI input */
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                            <div className="relative glass-effect rounded-[2rem] p-2.5 md:p-4 flex items-center gap-2 md:gap-4 bg-card/80 outline-none border border-white/5 group-focus-within:border-primary/30 transition-all">
                                <Sparkles className="w-5 h-5 md:w-6 h-6 text-primary ml-2 md:ml-4 shrink-0" />
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder={product ? `Ex: Perfis 5k-20k de ${niche || "beleza"} para ${product}...` : "Ex: Mulheres de 40 anos com 5k em São Paulo..."}
                                    className="flex-1 bg-transparent border-none outline-none text-sm md:text-lg placeholder:text-text-secondary/40 font-medium min-w-0 text-white"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching || !prompt.trim()}
                                    className="bg-primary text-black p-2.5 md:p-3 rounded-[1.25rem] md:rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 shrink-0 cursor-pointer flex items-center gap-2 font-bold"
                                >
                                    {isSearching ? <Loader2 className="w-5 h-5 md:w-6 h-6 animate-spin" /> : <Search className="w-5 h-5 md:w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Lookalike input */
                        <div className="glass-effect rounded-3xl p-6 border border-primary/20 space-y-5 max-w-2xl mx-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-primary animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold font-outfit text-white">Lookalike por Perfil</h3>
                                    <p className="text-xs text-text-secondary">Insira um perfil de referência para a IA extrair suas características e encontrar clones semelhantes.</p>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-bold">@</span>
                                <input
                                    type="text"
                                    value={lookalike}
                                    onChange={e => setLookalike(e.target.value.replace('@', ''))}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="ex: beatriz.santos"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-primary/40 transition-all font-medium text-white"
                                />
                            </div>
                            <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
                                <p className="text-xs text-amber-400 font-medium">⭐ A IA extrairá nicho, engajamento, visual e biografia do perfil de referência para moldar os critérios de busca.</p>
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching || !lookalike.trim()}
                                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                            >
                                {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando referencial...</> : <><Zap className="w-4 h-4" />Buscar Perfis Similares</>}
                            </button>
                        </div>
                    )}

                    {/* Quick Tags Carousel */}
                    {mode === 'prompt' && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:flex-wrap md:justify-center px-2 -mx-2 md:px-0 md:mx-0">
                            {["Beleza 18-30 anos", "Fashion 5k-20k", "Fitness SP", "Lifestyle Premium", "40+ anos", "Micro-influenciadoras"].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        setPrompt(tag);
                                        showNotification('success', 'Tag Selecionada', `A tag "${tag}" foi carregada na busca. Clique no botão de busca para pesquisar.`);
                                    }}
                                    className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-secondary hover:text-primary hover:border-primary/30 transition-all shrink-0 active:scale-95 cursor-pointer"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isSearching && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-outfit font-bold text-white">Radar AI em Ação...</h3>
                            <p className="text-sm text-text-secondary max-w-sm">Vasculhando bases e analisando perfis com inteligência artificial no Instagram. Isso pode levar de 1 a 3 minutos.</p>
                        </div>
                    </div>
                )}

                {/* Empty State / Glowing Radar concentric wave rings */}
                {!filters && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-6">
                        <div className="relative flex items-center justify-center w-28 h-28">
                            <div className="absolute inset-0 rounded-full bg-primary/5 animate-[ping_3s_infinite] opacity-35"></div>
                            <div className="absolute inset-2 rounded-full bg-primary/10 animate-[ping_2s_infinite] opacity-50"></div>
                            <div className="absolute inset-4 rounded-full border border-primary/20 animate-pulse"></div>

                            <div className="relative w-16 h-16 rounded-full bg-card border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(201,160,92,0.2)]">
                                <Target className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2 max-w-sm px-6">
                            <h3 className="text-xl font-outfit font-bold premium-gradient-text text-white">O seu Radar está pronto</h3>
                            <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                Digite acima as características do seu perfil ideal (ou use o Lookalike). A IA fará o scouting completo no Instagram em tempo real.
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {filters && !isSearching && results.length > 0 && (
                    <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
                        {/* Results Header with batch actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-white/5 px-2 gap-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                <p className="text-sm font-medium text-text-secondary">
                                    IA detectou:
                                    <span className="text-primary ml-1 font-bold">
                                        Nicho {filters.niche || "Geral"} • {filters.minFollowers !== undefined && filters.maxFollowers !== undefined ? `${formatNumber(filters.minFollowers)}-${formatNumber(filters.maxFollowers)}` : "Qualquer"} seg. • Idade aprox. {filters.ageRange || "qualquer"}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-6">
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-xs text-text-secondary hover:text-primary transition-colors font-bold uppercase tracking-wider cursor-pointer"
                                >
                                    {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                                </button>
                                {selectedToExport.size > 0 && (
                                    <button
                                        onClick={handleExportToPipeline}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer animate-scale-up"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                        Exportar {selectedToExport.size} para Pipeline
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Combined Premium Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {results.slice(0, quantity).map((res, i) => {
                                const added = addedIds.has(res.handle);
                                const checked = selectedToExport.has(res.handle);

                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            const username = res.handle.replace('@', '');
                                            window.open(`https://instagram.com/${username}`, '_blank');
                                        }}
                                        className={cn(
                                            "relative overflow-hidden backdrop-blur-md border rounded-[2rem] p-5 md:p-6 group hover:translate-y-[-6px] transition-all duration-500 cursor-pointer flex flex-col justify-between",
                                            checked ? "border-primary/40 bg-primary/[0.03] shadow-[0_20px_50px_rgba(201,160,92,0.1)]" :
                                                added ? "border-success/30 bg-success/[0.01]" :
                                                    "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(201,160,92,0.15)]"
                                        )}
                                    >
                                        {/* Glowing radial ambient background effect */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        {/* Individual Checkbox (disabled if already added) */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!added) toggleSelect(res.handle);
                                            }}
                                            className={cn("absolute top-5 right-5 w-5 h-5 rounded-md border flex items-center justify-center transition-all z-20 cursor-pointer",
                                                checked ? "bg-primary border-primary text-black" : "border-white/20 hover:border-primary/50",
                                                added ? "opacity-35 cursor-not-allowed border-white/5" : ""
                                            )}
                                            disabled={added}
                                        >
                                            {checked && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                                            {added && <CheckCircle2 className="w-3.5 h-3.5 text-success/80" />}
                                        </button>

                                        <div>
                                            {/* Header Section: Avatar + Handles + Icons */}
                                            <div className="flex items-start justify-between mb-5 pr-8 relative z-10">
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
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="font-bold text-sm text-white group-hover:text-primary transition-colors duration-300">
                                                                {res.handle.startsWith('@') ? res.handle : `@${res.handle}`}
                                                            </p>
                                                            {res.is_verified && (
                                                                <BadgeCheck className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                                                            )}
                                                            {res.is_private && (
                                                                <Lock className="w-3 h-3 text-text-secondary/60" />
                                                            )}
                                                            {res.isDuplicate && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30 text-[9px] font-extrabold uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                                                    Da Base
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-text-secondary/70 truncate max-w-[150px] font-medium">
                                                            {res.name || res.handle}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Profile Bio */}
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

                                            {/* AI Match Metrics */}
                                            <div className="space-y-3 mb-5 p-3.5 rounded-2xl bg-white/[0.01] border border-white/[0.03] relative z-10">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-text-secondary font-medium">Scouting Match</span>
                                                    <span className="font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(201,160,92,0.1)]">
                                                        {res.ai_score || 50}/100
                                                    </span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(201,160,92,0.3)]"
                                                        style={{
                                                            width: `${res.ai_score || 50}%`,
                                                            background: (res.ai_score || 50) >= 70
                                                                ? 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))'
                                                                : (res.ai_score || 50) >= 40
                                                                    ? 'linear-gradient(90deg, #eab308, #facc15)'
                                                                    : 'linear-gradient(90deg, #ef4444, #f87171)'
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.02]">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-text-secondary/60">Nicho Recomendado</span>
                                                        <span className="font-semibold text-white text-[11px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20">
                                                            {res.ai_niche || res.niche || "Geral"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-text-secondary/60">Faixa Etária (IA)</span>
                                                        <span className="font-semibold text-white text-[11px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                                            {res.age_range || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Business Category and Website tags */}
                                            {(res.is_business || res.business_category || res.external_url || res.external_link) && (
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
                                                    {(res.external_url || res.external_link) && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[9px] font-bold">
                                                            <Globe className="w-2.5 h-2.5" /> Website
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Contact Badges (WhatsApp, E-mail, Phone) from partner */}
                                            {(res.has_whatsapp || res.email || res.phone) && (
                                                <div className="flex gap-1.5 mb-4 flex-wrap relative z-10">
                                                    {res.has_whatsapp && (
                                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 shadow-sm">WhatsApp</span>
                                                    )}
                                                    {res.email && (
                                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[9px] font-bold text-blue-400 border border-blue-500/20 shadow-sm">E-mail</span>
                                                    )}
                                                    {res.phone && !res.has_whatsapp && (
                                                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-text-secondary border border-white/10 shadow-sm">Telefone</span>
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

                                        {/* Save Action CTA Button */}
                                        <div className="pt-4 border-t border-white/[0.05] relative z-10 mt-auto">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!added) handleAddLead(res);
                                                }}
                                                disabled={added}
                                                className={cn(
                                                    "w-full py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer",
                                                    added
                                                        ? "bg-success/10 text-success border border-success/20 cursor-default"
                                                        : "bg-white/[0.03] border border-white/[0.05] text-white hover:bg-gradient-to-r hover:from-primary hover:to-primary-light hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(201,160,92,0.35)] group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary-light group-hover:text-black group-hover:border-transparent"
                                                )}
                                            >
                                                {added ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Adicionado ao Pipeline</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Adicionar ao Pipeline</span>
                                                        <ArrowRight className="w-4 h-4 transition-transform duration-300 transform group-hover:translate-x-1" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Glowing Modal Dialog */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop blur overlay */}
                    <div
                        onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300"
                    />

                    {/* Glowing card panel */}
                    <div className="relative w-full max-w-sm backdrop-blur-xl bg-card-glass border border-white/10 rounded-[2.5rem] p-8 text-center space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-up z-10">
                        {/* Radial glowing mesh aura */}
                        <div className={cn(
                            "absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none",
                            modal.type === 'success' ? 'bg-success/40' : modal.type === 'warning' ? 'bg-amber-500/40' : 'bg-danger/40'
                        )} />

                        {/* Centered Glowing Icon */}
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

                        {/* Modal Header & Messages */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-outfit font-extrabold text-white tracking-tight">
                                {modal.title}
                            </h3>
                            <p className="text-xs text-text-secondary leading-relaxed px-2 font-medium">
                                {modal.message}
                            </p>
                        </div>

                        {/* Understood Action Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                                className={cn(
                                    "w-full py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 active:scale-[0.98] cursor-pointer",
                                    modal.type === 'success'
                                        ? 'bg-primary text-black hover:opacity-90 shadow-[0_5px_15px_rgba(201,160,92,0.3)] border-transparent'
                                        : modal.type === 'warning'
                                            ? 'bg-amber-500 text-black hover:opacity-90 shadow-[0_5px_15px_rgba(245,158,11,0.3)] border-transparent'
                                            : 'bg-danger text-white hover:opacity-90 shadow-[0_5px_15px_rgba(239,68,68,0.3)] border-transparent'
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
