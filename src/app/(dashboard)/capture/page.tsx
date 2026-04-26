"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import {
    Sparkles, Search, Instagram, CheckCircle2, Loader2, Target,
    Plus, SlidersHorizontal, Users, Globe, Filter, ChevronDown,
    ArrowRight, Zap, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ── Mock profiles ────────────────────────────────────────────────
const MOCK_PROFILES = [
    { handle: "@bella.marie",     name: "Bella Marie",      followers: 18500, ai_score: 94, ai_niche: "Beleza",     age_range: "24", ai_summary: "Influenciadora de beleza com forte engajamento em skincare clean. Público feminino 18-35 altamente fiel.", ai_characteristics: "Estética minimalista, público 18-35, alto CTR nos Reels.", platform: "instagram", phone: "+55 41 99001-1111", email: "bella@mail.com",    has_whatsapp: true  },
    { handle: "@renata_off",      name: "Renata Oliveira",  followers: 8200,  ai_score: 88, ai_niche: "Moda",       age_range: "31", ai_summary: "Criadora de conteúdo de moda com foco em looks acessíveis. Excelente fit para marcas mid-market.", ai_characteristics: "Alta autenticidade, lifestyle aspiracional, engajamento 4.2%.", platform: "instagram", has_whatsapp: false },
    { handle: "@carol.style.br",  name: "Carolina Santos",  followers: 32000, ai_score: 91, ai_niche: "Moda",       age_range: "27", ai_summary: "Fashion blogger com presença premium e portfólio robusto de parcerias.", ai_characteristics: "Storytelling visual, audiência AB, multilinguagem.", platform: "instagram", phone: "+55 11 98002-2222", email: "carol@style.com", has_whatsapp: true  },
    { handle: "@adriana_m40",     name: "Adriana Medeiros", followers: 12000, ai_score: 85, ai_niche: "Lifestyle",  age_range: "42", ai_summary: "Referência lifestyle para o público 35+. Autenticidade e autoridade.", ai_characteristics: "Nicho valorizado, seguidores engajados, fidelidade alta.", platform: "instagram", has_whatsapp: false },
    { handle: "@bia.fitness",     name: "Beatriz Almeida",  followers: 55000, ai_score: 79, ai_niche: "Fitness",    age_range: "26", ai_summary: "Influenciadora fitness e bem-estar com comunidade muito ativa.", ai_characteristics: "Posting consistente, stories diários, comunidade ativa.", platform: "instagram", phone: "+55 21 99003-3333", has_whatsapp: true  },
    { handle: "@lua.creator",     name: "Luanda Ferreira",  followers: 9800,  ai_score: 92, ai_niche: "Beleza",     age_range: "22", ai_summary: "Criadora em ascensão rápida. Crescimento orgânico excepcional.", ai_characteristics: "Crescimento +38% últimos 3 meses, vídeos virais, premium.", platform: "instagram", phone: "+55 51 98004-4444", email: "lua@creator.com", has_whatsapp: true  },
    { handle: "@thalita.looks",   name: "Thalita Costa",    followers: 14200, ai_score: 83, ai_niche: "Moda",       age_range: "29", ai_summary: "Referência local em moda com forte identidade visual.", ai_characteristics: "Identidade visual coesa, público regional fiel.", platform: "instagram", has_whatsapp: false },
    { handle: "@mari.premium",    name: "Mariana Pires",    followers: 7600,  ai_score: 96, ai_niche: "Luxo",       age_range: "35", ai_summary: "Microinfluenciadora premium com audiência ultra-segmentada AB.", ai_characteristics: "Engajamento 6.8%, audiência AB, editorial premium.", platform: "instagram", phone: "+55 11 99005-5555", email: "mari@premium.com", has_whatsapp: true  },
    { handle: "@priscila.fit",    name: "Priscila Gomes",   followers: 21000, ai_score: 80, ai_niche: "Wellness",   age_range: "33", ai_summary: "Criadora wellness holística: fitness, mindfulness, nutrição.", ai_characteristics: "Comunidade engajada, múltiplas categorias, aberta a parcerias.", platform: "instagram", has_whatsapp: false },
    { handle: "@juju.modaetc",   name: "Juliana Ramos",    followers: 43000, ai_score: 87, ai_niche: "Moda",       age_range: "25", ai_summary: "Influenciadora de moda jovem com alto volume de conteúdo.", ai_characteristics: "Frequência alta, público 18-28, forte no Instagram.", platform: "instagram", phone: "+55 11 97006-6666", has_whatsapp: true  },
    { handle: "@nana.beauty",     name: "Fernanda Lima",    followers: 6500,  ai_score: 89, ai_niche: "Beleza",     age_range: "28", ai_summary: "Especialista em maquiagem artística. Conteúdo técnico valorizado.", ai_characteristics: "Autoridade técnica, nicho premium, ótima reputação.", platform: "instagram", email: "nana@beauty.com", has_whatsapp: false },
    { handle: "@gabi.style",      name: "Gabriela Torres",  followers: 28500, ai_score: 84, ai_niche: "Sustentab.", age_range: "30", ai_summary: "Moda consciente e sustentável. Valor de marca elevado.", ai_characteristics: "Posicionamento diferenciado, audiência consciente.", platform: "instagram", phone: "+55 21 96007-7777", has_whatsapp: true  },
];

const COUNTRIES = ["Brasil", "Portugal", "EUA", "Argentina", "México", "Espanha", "Colômbia"];
const LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês", "Italiano"];
const NICHES    = ["Beleza / Skincare", "Moda / Fashion", "Fitness / Saúde", "Lifestyle", "Luxo / Premium", "Culinária", "Viagem", "Educação", "Maternidade", "Sustentabilidade", "Tecnologia", "Outro"];

export default function CapturePage() {
    const [mode, setMode] = useState<'prompt' | 'lookalike'>('prompt');
    const [prompt, setPrompt]         = useState("");
    const [quantity, setQuantity]     = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [showQty, setShowQty]       = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults]       = useState<any[]>([]);
    const [addedIds, setAddedIds]     = useState<Set<string>>(new Set());
    const [detectedInfo, setDetectedInfo] = useState<string | null>(null);
    const [selectedToExport, setSelectedToExport] = useState<Set<string>>(new Set());

    // Filtros avançados
    const [country,  setCountry]  = useState("Brasil");
    const [language, setLanguage] = useState("Português");
    const [niche,    setNiche]    = useState("");
    const [product,  setProduct]  = useState("");
    const [lookalike, setLookalike] = useState("");

    const allSelected = results.length > 0 && selectedToExport.size === results.length;

    const toggleSelect = (handle: string) => {
        setSelectedToExport(prev => {
            const next = new Set(prev);
            next.has(handle) ? next.delete(handle) : next.add(handle);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) { setSelectedToExport(new Set()); }
        else { setSelectedToExport(new Set(results.map((r: any) => r.handle))); }
    };

    const handleExportToPipeline = () => {
        const toExport = results.filter((r: any) => selectedToExport.has(r.handle));
        setAddedIds(prev => new Set([...prev, ...toExport.map((r: any) => r.handle)]));
        alert(`${toExport.length} leads exportados para o Pipeline!`);
    };

    const handleSearch = async () => {
        if (mode === 'prompt' && !prompt.trim()) return;
        if (mode === 'lookalike' && !lookalike.trim()) return;
        setIsSearching(true);
        setResults([]);
        setDetectedInfo(null);
        setSelectedToExport(new Set());

        await new Promise(r => setTimeout(r, 2200));

        const shuffled = [...MOCK_PROFILES].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(quantity, MOCK_PROFILES.length));

        const nicheLabel = niche || (prompt.toLowerCase().includes("beleza") ? "Beleza" : prompt.toLowerCase().includes("moda") ? "Moda" : "Geral");
        setDetectedInfo(`${nicheLabel} · ${country} · ${language} · ${quantity} perfis`);
        setResults(selected);
        setIsSearching(false);
    };

    const buildAutoPrompt = () => {
        const parts = [];
        if (product) parts.push(`produto: "${product}"`);
        if (niche)   parts.push(`nicho: ${niche}`);
        if (country) parts.push(`país: ${country}`);
        if (language && language !== "Português") parts.push(`idioma: ${language}`);
        return parts.join(", ");
    };

    return (
        <div className="flex flex-col h-screen">
            <Header title="Captação Inteligente" subtitle="Use IA para identificar perfis ideais — Radar AI ou Lookalike." showActions={false} />

            {/* Mode tabs + controles */}
            <div className="px-8 mt-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2">
                    {([{ id: 'prompt', label: 'Radar AI', icon: Sparkles }, { id: 'lookalike', label: 'Lookalike', icon: Zap }] as const).map(m => (
                        <button key={m.id} onClick={() => { setMode(m.id); setResults([]); setDetectedInfo(null); }}
                            className={cn("flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                mode === m.id ? "bg-primary text-black shadow-lg shadow-primary/20" : "bg-white/5 text-text-secondary hover:bg-white/10"
                            )}>
                            <m.icon className="w-3.5 h-3.5" />
                            {m.label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setShowFilters(!showFilters); setShowQty(false); }}
                        className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                            showFilters ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/10"
                        )}>
                        <Filter className="w-3.5 h-3.5" />
                        Filtros
                        {(country !== "Brasil" || language !== "Português" || niche || product) && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                    </button>
                    <button onClick={() => { setShowQty(!showQty); setShowFilters(false); }}
                        className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                            showQty ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/5 text-text-secondary hover:bg-white/10"
                        )}>
                        <Users className="w-3.5 h-3.5" />
                        {quantity} leads
                    </button>
                </div>
            </div>

            {/* Painel de filtros */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mx-8 mt-4 p-5 glass-effect rounded-2xl border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1"><Globe className="w-3 h-3" /> País</label>
                                <select value={country} onChange={e => setCountry(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all cursor-pointer">
                                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Idioma</label>
                                <select value={language} onChange={e => setLanguage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all cursor-pointer">
                                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Nicho</label>
                                <select value={niche} onChange={e => setNiche(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all cursor-pointer">
                                    <option value="">Todos os nichos</option>
                                    {NICHES.map(n => <option key={n}>{n}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Produto / Oferta</label>
                                <input value={product} onChange={e => setProduct(e.target.value)}
                                    placeholder="Ex: Curso de Modelo"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/40 transition-all" />
                            </div>
                            {/* Auto prompt */}
                            {buildAutoPrompt() && (
                                <div className="col-span-full flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                                    <p className="text-xs text-text-secondary flex-1">Prompt auto-gerado: <span className="text-primary font-medium">{buildAutoPrompt()}</span></p>
                                    <button onClick={() => setPrompt(buildAutoPrompt())} className="text-[10px] font-bold text-primary hover:underline">Usar</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Painel de quantidade */}
            <AnimatePresence>
                {showQty && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mx-8 mt-4 p-5 glass-effect rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Quantidade de Leads</p>
                                <span className="text-3xl font-outfit font-bold text-primary">{quantity}</span>
                            </div>
                            <input type="range" min={5} max={50} step={5} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                                className="w-full accent-primary cursor-pointer" />
                            <div className="flex justify-between text-[10px] text-text-secondary font-bold mt-1.5">
                                {[5,10,15,20,25,30,35,40,45,50].map(v => <span key={v}>{v}</span>)}
                            </div>
                            <p className="text-[11px] text-text-secondary mt-3">
                                Custo estimado: <span className="text-primary font-bold">{quantity} créditos</span> · Você tem <span className="font-bold">380 disponíveis</span>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-8 pt-4 space-y-6 overflow-y-auto flex-1">
                {/* Barra de busca */}
                <div className="max-w-4xl mx-auto w-full">
                    {mode === 'prompt' ? (
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur opacity-20 group-focus-within:opacity-100 transition duration-700" />
                            <div className="relative glass-effect rounded-[2rem] p-4 flex items-center gap-4 border border-white/5 group-focus-within:border-primary/30 transition-all">
                                <Sparkles className="w-6 h-6 text-primary ml-4 flex-shrink-0" />
                                <input
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder={`Ex: Mulheres 18-30 anos, ${niche || "beleza"}, 5k-20k seguidores em ${country}${product ? `, para ${product}` : ""}...`}
                                    className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-text-secondary/40 font-medium"
                                />
                                <button onClick={handleSearch} disabled={isSearching || !prompt.trim()}
                                    className="bg-primary text-black px-5 py-2.5 rounded-2xl font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 flex-shrink-0">
                                    {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" />Buscando…</> : <><Search className="w-4 h-4" />Buscar</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Lookalike mode */
                        <div className="glass-effect rounded-2xl p-6 border border-primary/20 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold font-outfit">Look-alike por Perfil</h3>
                                    <p className="text-xs text-text-secondary">Insira um perfil de referência — cliente que já comprou, ou público ideal — e a IA encontra perfis similares.</p>
                                </div>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-bold">@</span>
                                <input
                                    value={lookalike}
                                    onChange={e => setLookalike(e.target.value.replace('@', ''))}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="handle.do.perfil.referencia"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-primary/40 transition-all font-medium"
                                />
                            </div>
                            <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
                                <p className="text-xs text-amber-400 font-medium">⭐ Isso é ouro — a IA extrai características do perfil inserido (nicho, faixa etária, engajamento, estilo) e busca perfis com DNA semelhante.</p>
                            </div>
                            <button onClick={handleSearch} disabled={isSearching || !lookalike.trim()}
                                className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                                {isSearching ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando perfil…</> : <><Zap className="w-4 h-4" />Encontrar Similares</>}
                            </button>
                        </div>
                    )}

                    {/* Tags rápidas */}
                    {mode === 'prompt' && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {["Beleza 18-30 anos", "Fashion 5k-20k", "Fitness SP", "Lifestyle Premium", "40+ anos", "Micro-influenciadoras"].map(tag => (
                                <button key={tag} onClick={() => setPrompt(tag)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-secondary hover:text-primary hover:border-primary/30 transition-all">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading */}
                {isSearching && (
                    <div className="flex flex-col items-center py-16 space-y-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                            <div className="absolute -inset-2 rounded-3xl border border-primary/10 animate-ping" />
                        </div>
                        <p className="font-bold">Radar em ação…</p>
                        <p className="text-sm text-text-secondary">Analisando {quantity} perfis{mode === 'lookalike' ? ` similares a @${lookalike}` : ''}</p>
                    </div>
                )}

                {/* Resultados */}
                {detectedInfo && !isSearching && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto w-full space-y-5">
                        {/* Header resultados */}
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                <p className="text-sm font-medium text-text-secondary">
                                    IA detectou: <span className="text-primary font-bold">{detectedInfo}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={toggleSelectAll} className="text-xs text-text-secondary hover:text-primary transition-colors font-bold">
                                    {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                                </button>
                                {selectedToExport.size > 0 && (
                                    <button onClick={handleExportToPipeline}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-black text-xs font-bold hover:opacity-90 transition-all shadow shadow-primary/20">
                                        <ArrowRight className="w-3.5 h-3.5" />
                                        Exportar {selectedToExport.size} para Pipeline
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {results.map((res, i) => {
                                const added   = addedIds.has(res.handle);
                                const checked = selectedToExport.has(res.handle);
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                        className={cn("glass-effect rounded-2xl p-5 border transition-all duration-200 relative",
                                            checked ? "border-primary/40 bg-primary/5" :
                                            added   ? "border-success/30 bg-success/5" :
                                            "border-white/5 hover:border-primary/20 hover:translate-y-[-2px]"
                                        )}>
                                        {/* Checkbox */}
                                        <button onClick={() => !added && toggleSelect(res.handle)}
                                            className={cn("absolute top-4 right-4 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                checked ? "bg-primary border-primary" : "border-white/20 hover:border-primary/50"
                                            )}>
                                            {checked && <CheckCircle2 className="w-3 h-3 text-black" />}
                                        </button>

                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4 pr-6">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                                {res.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{res.handle}</p>
                                                <div className="flex items-center gap-1 text-[10px] text-text-secondary font-bold uppercase">
                                                    <Instagram className="w-3 h-3" /><span>Instagram</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="space-y-1.5 mb-3">
                                            {[
                                                ["Seguidores", res.followers?.toLocaleString('pt-BR')],
                                                ["Nicho",      res.ai_niche],
                                                ["Idade",      `${res.age_range} anos`],
                                            ].map(([k, v]) => (
                                                <div key={k} className="flex justify-between text-xs">
                                                    <span className="text-text-secondary">{k}</span>
                                                    <span className="font-bold">{v}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Score bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="text-text-secondary font-bold uppercase">Score IA</span>
                                                <span className={cn("font-outfit font-bold", res.ai_score >= 90 ? "text-primary" : res.ai_score >= 80 ? "text-blue-400" : "text-text-secondary")}>{res.ai_score}/100</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full" style={{ width: `${res.ai_score}%` }} />
                                            </div>
                                        </div>

                                        {/* Badges de contato */}
                                        <div className="flex gap-1.5 mb-3 flex-wrap">
                                            {res.has_whatsapp && (
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">WhatsApp</span>
                                            )}
                                            {res.email && (
                                                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[9px] font-bold text-blue-400 border border-blue-500/20">E-mail</span>
                                            )}
                                            {res.phone && !res.has_whatsapp && (
                                                <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-text-secondary border border-white/10">Tel</span>
                                            )}
                                        </div>

                                        {/* Summary */}
                                        <p className="text-[10px] text-text-secondary italic leading-relaxed line-clamp-2 mb-3">"{res.ai_summary}"</p>

                                        {/* CTA */}
                                        <button onClick={() => { handleSearch(); setAddedIds(p => new Set([...p, res.handle])); }}
                                            disabled={added}
                                            className={cn("w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                                added ? "bg-success/10 text-success border border-success/20 cursor-default"
                                                      : "bg-white/5 border border-white/5 hover:bg-primary hover:text-black hover:border-primary"
                                            )}>
                                            {added ? <><CheckCircle2 className="w-3.5 h-3.5" />Adicionado</> : <><Plus className="w-3.5 h-3.5" />Pipeline</>}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Empty state */}
                {!detectedInfo && !isSearching && (
                    <div className="flex flex-col items-center py-20 text-center space-y-4 opacity-40">
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                            <Target className="w-10 h-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-outfit font-bold">Radar Pronto</h3>
                            <p className="text-sm text-text-secondary max-w-sm">Descreva o perfil ideal ou use o Lookalike para encontrar perfis similares a um cliente que já comprou.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
