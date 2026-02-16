"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import {
    Sparkles,
    Search,
    Mic,
    Instagram,
    CheckCircle2,
    Loader2,
    AlertCircle,
    ArrowRight,
    TrendingUp,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoutingFilters } from "@/services/ai-service";
import { leadService } from "@/services/lead-service";
import { captureAndAnalyzeLeadsAction } from "@/app/actions/ai-actions";

export default function CapturePage() {
    const [prompt, setPrompt] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [filters, setFilters] = useState<ScoutingFilters | null>(null);

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
                status: 'new',
                updated_at: new Date().toISOString()
            });
            alert(`Lead ${lead.handle} adicionado ao pipeline!`);
        } catch (error) {
            console.error("Failed to add lead:", error);
            alert("Erro ao adicionar lead.");
        }
    };

    const handleSearch = async () => {
        if (!prompt) return;
        setIsSearching(true);
        setResults([]);

        try {
            const data = await captureAndAnalyzeLeadsAction(prompt);
            setFilters(data.filters);
            setResults(data.results);
        } catch (error) {
            console.error("Search failed:", error);
            alert("Ocorreu um erro na conexão com a IA. Verifique sua chave de API.");
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

            <div className="p-8 space-y-8 overflow-y-auto">
                {/* Search Bar Area */}
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
                        <div className="relative glass-effect rounded-[2rem] p-4 flex items-center gap-4 bg-card/80 outline-none border-white/5 group-focus-within:border-primary/30 transition-all">
                            <Sparkles className="w-6 h-6 text-primary ml-4" />
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Ex: Mulheres de 40 anos com 5k a 20k seguidores..."
                                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-text-secondary/50 font-medium"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="bg-primary text-black p-3 rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                            >
                                {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        {["@fashion", "40+ anos", "Beleza", "5k - 20k seguidores", "Fitness"].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setPrompt(tag)}
                                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-secondary hover:text-primary hover:border-primary/30 transition-all"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Area */}
                {filters && (
                    <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
                        <div className="flex items-center gap-3 py-2 border-b border-white/5 px-2">
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <p className="text-sm font-medium text-text-secondary">
                                IA detectou:
                                <span className="text-primary ml-1">
                                    Nicho {filters.niche || "Geral"} • {filters.minFollowers !== undefined && filters.maxFollowers !== undefined ? `${filters.minFollowers / 1000}k-${filters.maxFollowers / 1000}k` : "Qualquer"} seguidores • Idade aprox. {filters.ageRange || "qualquer"}
                                </span>
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((res, i) => (
                                <div key={i} className="glass-effect rounded-3xl p-6 group hover:translate-y-[-4px] transition-all duration-300">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-card border border-white/10" />
                                            <div>
                                                <p className="font-bold">{res.handle}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-bold uppercase">
                                                    <Instagram className="w-3 h-3" />
                                                    <span>Instagram</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-text-secondary hover:text-primary transition-colors">
                                            <TrendingUp className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Seguidores</span>
                                            <span className="font-bold">{res.followers?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">AI Score</span>
                                            <span className="font-bold text-primary">{res.ai_score}/100</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-text-secondary">Nicho / Idade</span>
                                            <span className="font-bold">{res.ai_niche} • {res.age_range}</span>
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-[10px] text-text-secondary italic line-clamp-2 leading-relaxed">
                                                {res.ai_summary}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => handleAddLead(res)}
                                                className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-bold hover:bg-primary hover:text-black hover:border-primary transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-black group-hover:border-primary"
                                            >
                                                <span>Adicionar ao Pipeline</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State / Tips */}
                {!filters && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
                        <Target className="w-16 h-16 text-text-secondary" />
                        <div className="space-y-1">
                            <h3 className="text-xl font-outfit font-bold">O seu Radar está pronto</h3>
                            <p className="text-sm text-text-secondary max-w-sm">Digite acima as características do perfil que você deseja encontrar na rede social.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
