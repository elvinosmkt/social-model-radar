"use server";

import { aiService, ScoutingFilters, AIAnalysisResult } from "@/services/ai-service";
import { scraperService, ScrapedLead } from "@/services/scraper-service";

export async function processScoutingPromptAction(userPrompt: string): Promise<ScoutingFilters> {
    return await aiService.processScoutingPrompt(userPrompt);
}

export async function captureAndAnalyzeLeadsAction(userPrompt: string) {
    console.log("🎬 Iniciando Ação de Captação para:", userPrompt);
    let activeFilters: ScoutingFilters = { niche: userPrompt };

    // 1. Process prompt into filters (Try AI first)
    try {
        const aiFilters = await aiService.processScoutingPrompt(userPrompt);
        console.log("🧠 Filtros da IA:", JSON.stringify(aiFilters));
        if (aiFilters && Object.keys(aiFilters).length > 0) {
            activeFilters = aiFilters;
        }
    } catch (error) {
        console.warn("⚠️ AI processing failed:", error);
        // Fallback to activeFilters already initialized with niche: userPrompt
    }

    // 2. Discover leads (Real Scraper)
    const rawLeads = await scraperService.searchLeads(activeFilters);

    // 3. Filtragem Lógica (Seguidores)
    let filteredLeads = rawLeads;
    if (activeFilters.minFollowers || activeFilters.maxFollowers) {
        filteredLeads = rawLeads.filter(lead => {
            const min = activeFilters.minFollowers || 0;
            const max = activeFilters.maxFollowers || 1000000000;
            return lead.followers >= min && lead.followers <= max;
        });
    }

    const leadsToAnalyze = filteredLeads.length > 0 ? filteredLeads : rawLeads.slice(0, 5);

    // 4. Analyze each lead (with error handling for AI quota)
    const analyzedResults = await Promise.all(
        leadsToAnalyze.map(async (lead: ScrapedLead) => {
            let ai_niche = "Pendente";
            let ai_score = 50;
            let ai_summary = "Análise indisponível (verifique créditos da API)";
            let age_range = "N/A";

            try {
                const analysis = await aiService.analyzeProfile(lead.handle, lead.bio, lead.platform);
                ai_niche = analysis.niche;
                ai_score = analysis.score;
                ai_summary = analysis.summary;
                age_range = analysis.age_range;
            } catch (e) {
                // Silently fail AI analysis and keep defaults
            }

            return {
                ...lead,
                ai_score,
                ai_niche,
                ai_summary,
                age_range
            };
        })
    );

    return {
        filters: activeFilters,
        results: analyzedResults
    };
}

export async function analyzeProfileSingle(handle: string, bio: string, platform: string): Promise<AIAnalysisResult> {
    return await aiService.analyzeProfile(handle, bio, platform);
}
