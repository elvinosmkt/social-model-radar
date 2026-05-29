"use server";

import { aiService, ScoutingFilters, AIAnalysisResult } from "@/services/ai-service";
import { scraperService, ScrapedLead } from "@/services/scraper-service";
import { supabase } from "@/lib/supabase/client";

export async function processScoutingPromptAction(userPrompt: string): Promise<ScoutingFilters> {
    return await aiService.processScoutingPrompt(userPrompt);
}

export async function captureAndAnalyzeLeadsAction(userPrompt: string, limit: number = 10) {
    console.log(`🎬 Iniciando Ação de Captação para: "${userPrompt}" | Limite: ${limit}`);
    let activeFilters: ScoutingFilters = { niche: userPrompt, limit };

    // 1. Process prompt into filters (Try AI first)
    try {
        const aiFilters = await aiService.processScoutingPrompt(userPrompt);
        console.log("🧠 Filtros da IA extraídos:", JSON.stringify(aiFilters));
        if (aiFilters && Object.keys(aiFilters).length > 0) {
            activeFilters = {
                ...aiFilters,
                limit
            };
        }
    } catch (error) {
        console.warn("⚠️ AI processing failed:", error);
    }

    // 2. Discover leads (Real Scraper)
    const leads = await scraperService.searchLeads(activeFilters);
    console.log(`📊 Scraper retornou ${leads.length} leads já filtrados`);

    // 3. Database Anti-duplicity Check
    let existingHandles = new Set<string>();
    try {
        const handles = leads.map(l => l.handle.toLowerCase());
        if (handles.length > 0) {
            const { data: masterLeads } = await supabase
                .from('leads_master')
                .select('handle')
                .in('handle', handles);
            if (masterLeads) {
                existingHandles = new Set(masterLeads.map(l => l.handle.toLowerCase()));
            }
        }
    } catch (e) {
        console.warn("⚠️ Anti-duplicity database query bypassed:", e);
    }

    // 4. Analyze each lead with AI
    const analyzedResults = await Promise.all(
        leads.map(async (lead: ScrapedLead) => {
            const handleLower = lead.handle.toLowerCase();
            const isDuplicate = existingHandles.has(handleLower);

            let ai_niche = activeFilters.niche || "Pendente";
            let ai_score = 50;
            let ai_summary = "Análise indisponível (verifique créditos da API)";
            let age_range = activeFilters.ageRange || "N/A";
            let ai_characteristics: string[] = [];

            try {
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
                // Silently fail AI analysis
            }

            return {
                ...lead,
                ai_score,
                ai_niche,
                ai_summary,
                age_range,
                ai_characteristics,
                isDuplicate
            };
        })
    );

    // 5. Ordenar por AI score
    const sortedResults = analyzedResults.sort((a, b) => b.ai_score - a.ai_score);

    // Calculate actual credits consumed (only new/non-duplicate leads)
    const creditsConsumed = leads.filter(l => !existingHandles.has(l.handle.toLowerCase())).length;

    return {
        filters: activeFilters,
        results: sortedResults,
        creditsConsumed
    };
}

export async function analyzeProfileSingle(handle: string, bio: string, platform: string): Promise<AIAnalysisResult> {
    return await aiService.analyzeProfile(handle, bio, platform);
}

export async function captureSimilarLeadsAction(targetHandle: string, limit: number = 10) {
    console.log(`👯 Iniciando Busca por Similaridade para: @${targetHandle} | Limite: ${limit}`);
    const cleanHandle = targetHandle.replace('@', '').trim().toLowerCase();

    // 1. Get Target Profile Info (real scrape) - limit search to 1 profile for reference
    const targetResults = await scraperService.searchLeads({ niche: `@${cleanHandle}`, limit: 1 });

    if (!targetResults || targetResults.length === 0) {
        throw new Error(`Perfil de referência @${cleanHandle} não foi localizado no Instagram. Verifique se o perfil existe e é público.`);
    }

    const targetProfile = targetResults[0];
    console.log("👤 Perfil de referência localizado com sucesso:", targetProfile.handle);

    // 2. Generate Lookalike Filters from profile data with AI
    const lookalikeFilters = await aiService.generateFiltersFromProfile(targetProfile);
    console.log("🧠 Filtros Lookalike extraídos pela IA:", JSON.stringify(lookalikeFilters));

    // Inject limit
    const activeFilters: ScoutingFilters = {
        ...lookalikeFilters,
        limit
    };

    // 3. Search similar profiles using the lookalike filters directly
    console.log("🔍 Buscando perfis similares com os filtros lookalike...");
    const leads = await scraperService.searchLeads(activeFilters);
    console.log(`📊 Scraper retornou ${leads.length} candidatos lookalike`);

    // 4. UX Guard: Exclude the reference profile itself from the results
    const filteredLeads = leads.filter(lead => {
        const leadHandle = lead.handle.replace('@', '').trim().toLowerCase();
        return leadHandle !== cleanHandle;
    });

    // 5. Database Anti-duplicity Check
    let existingHandles = new Set<string>();
    try {
        const handles = filteredLeads.map(l => l.handle.toLowerCase());
        if (handles.length > 0) {
            const { data: masterLeads } = await supabase
                .from('leads_master')
                .select('handle')
                .in('handle', handles);
            if (masterLeads) {
                existingHandles = new Set(masterLeads.map(l => l.handle.toLowerCase()));
            }
        }
    } catch (e) {
        console.warn("⚠️ Anti-duplicity database query bypassed:", e);
    }

    // 6. Analyze each lead with AI
    const analyzedResults = await Promise.all(
        filteredLeads.map(async (lead: ScrapedLead) => {
            const handleLower = lead.handle.toLowerCase();
            const isDuplicate = existingHandles.has(handleLower);

            let ai_niche = activeFilters.niche || "Pendente";
            let ai_score = 50;
            let ai_summary = "Análise Lookalike indisponível";
            let age_range = activeFilters.ageRange || "N/A";
            let ai_characteristics: string[] = [];

            try {
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
                // Ignore AI analysis errors
            }

            return {
                ...lead,
                ai_score,
                ai_niche,
                ai_summary,
                age_range,
                ai_characteristics,
                isDuplicate
            };
        })
    );

    // 7. Sort by AI score
    const sortedResults = analyzedResults.sort((a, b) => b.ai_score - a.ai_score);

    // Calculate actual credits consumed (only new/non-duplicate leads)
    const creditsConsumed = filteredLeads.filter(l => !existingHandles.has(l.handle.toLowerCase())).length;

    return {
        filters: activeFilters,
        results: sortedResults,
        creditsConsumed
    };
}
