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
    // O scraper já filtra por seguidores, remove privados, e limita a 10 resultados
    const leads = await scraperService.searchLeads(activeFilters);
    console.log(`📊 Scraper retornou ${leads.length} leads já filtrados`);

    // 3. Analyze each lead with AI (with error handling for AI quota)
    const analyzedResults = await Promise.all(
        leads.map(async (lead: ScrapedLead) => {
            let ai_niche = "Pendente";
            let ai_score = 50;
            let ai_summary = "Análise indisponível (verifique créditos da API)";
            let age_range = "N/A";
            let ai_characteristics: string[] = [];

            try {
                // Passar mais contexto para a IA gerar análises mais precisas
                const enrichedBio = [
                    lead.bio,
                    lead.followers ? `Seguidores: ${lead.followers}` : '',
                    lead.post_count ? `Posts: ${lead.post_count}` : '',
                    lead.is_business ? 'Conta Business' : '',
                    lead.business_category ? `Categoria: ${lead.business_category}` : '',
                ].filter(Boolean).join(' | ');
                const analysis = await aiService.analyzeProfile(lead.handle, enrichedBio, lead.platform);
                ai_niche = analysis.niche;
                ai_score = analysis.score;
                ai_summary = analysis.summary;
                age_range = analysis.age_range;
                ai_characteristics = analysis.characteristics || [];
            } catch (e) {
                // Silently fail AI analysis and keep defaults
            }

            return {
                ...lead,
                ai_score,
                ai_niche,
                ai_summary,
                age_range,
                ai_characteristics
            };
        })
    );

    // 4. Ordenar por AI score (perfis brasileiros e relevantes primeiro)
    const sortedResults = analyzedResults.sort((a, b) => b.ai_score - a.ai_score);

    return {
        filters: activeFilters,
        results: sortedResults
    };
}

export async function analyzeProfileSingle(handle: string, bio: string, platform: string): Promise<AIAnalysisResult> {
    return await aiService.analyzeProfile(handle, bio, platform);
}

export async function captureSimilarLeadsAction(targetHandle: string) {
    console.log("👯 Iniciando Busca por Similaridade para:", targetHandle);

    // 1. Get Target Profile Info
    const cleanHandle = targetHandle.replace('@', '');
    const targetResults = await scraperService.searchLeads({ niche: `@${cleanHandle}` });

    if (!targetResults || targetResults.length === 0) {
        throw new Error("Perfil alvo não encontrado para análise de similaridade.");
    }

    const targetProfile = targetResults[0];

    // 2. Generate Lookalike Filters
    const lookalikeFilters = await aiService.generateFiltersFromProfile(targetProfile);
    console.log("🧠 Filtros Lookalike gerados:", JSON.stringify(lookalikeFilters));

    // 3. Search similar profiles
    return await captureAndAnalyzeLeadsAction(lookalikeFilters.searchKeywords?.[0] || lookalikeFilters.niche || targetProfile.bio);
}
