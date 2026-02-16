import { ApifyClient } from 'apify-client';
import { ScoutingFilters } from "./ai-service";

export interface ScrapedLead {
    handle: string;
    name: string;
    bio: string;
    followers: number;
    platform: 'instagram' | 'tiktok';
    avatar_url?: string;
    post_count?: number;
    is_verified?: boolean;
}

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || '',
});

export const scraperService = {
    async searchLeads(filters: ScoutingFilters): Promise<ScrapedLead[]> {
        console.log("🚀 Iniciando busca real no Instagram via Apify...");
        console.log("🔍 Filtros recebidos:", JSON.stringify(filters, null, 2));

        if (!process.env.APIFY_API_TOKEN) {
            console.error("❌ Token do Apify não configurado no .env.local!");
            throw new Error("Configuração ausente: APIFY_API_TOKEN");
        }

        try {
            // Lógica de Detecção de Handle: Só considera handle se começar com @
            const isHandle = filters.niche?.startsWith('@');

            let items: any[] = [];

            if (isHandle) {
                // Modo Perfil: Busca direta por um @handle
                const username = filters.niche?.replace('@', '');
                console.log(`👤 Modo Perfil para: ${username}`);

                const input = {
                    "usernames": [username],
                };

                // Usando o scraper de perfil oficial
                const run = await client.actor("apify/instagram-profile-scraper").call(input);
                const dataset = await client.dataset(run.defaultDatasetId).listItems();
                items = dataset.items;
            } else {
                // Modo Descoberta: Usa PALAVRA-CHAVE
                const query = filters.searchKeywords && filters.searchKeywords.length > 0
                    ? filters.searchKeywords[0]
                    : (filters.niche || 'modelos');

                console.log("🔍 Ativando modo Descoberta com query:", query);

                // Usando o Instagram Scraper versátil que suporta busca por palavra-chave
                const input = {
                    "search": query,
                    "searchType": "user",
                    "resultsLimit": 10
                };

                const run = await client.actor("apify/instagram-scraper").call(input);
                const dataset = await client.dataset(run.defaultDatasetId).listItems();
                items = dataset.items;
            }

            if (!items || items.length === 0) {
                console.warn("⚠️ Nenhum resultado encontrado no Apify.");
                return [];
            }

            // Mapeamento Robusto: O formato varia entre atores
            return items.map((item: any) => {
                const username = item.username || item.ownerUsername || item.id;
                return {
                    handle: username ? `@${username}` : "perfil",
                    name: item.fullName || item.fullName || username || "Model",
                    bio: item.biography || item.description || "",
                    followers: item.followersCount || item.followersCount || 0,
                    platform: 'instagram',
                    avatar_url: item.profilePicUrl || item.profilePicUrl || "",
                    post_count: item.postsCount || 0,
                    is_verified: item.verified || false
                };
            });

        } catch (error: any) {
            console.error("❌ Erro detalhado do Apify:", error.message || error);
            if (error.response?.data) {
                console.error("📦 Dados da resposta do erro:", JSON.stringify(error.response.data));
            }
            throw new Error(`Falha na extração (Apify): ${error.message}`);
        }
    }
};
