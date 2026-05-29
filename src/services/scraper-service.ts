import { ApifyClient } from 'apify-client';
import { ScoutingFilters } from "./ai-service";

export interface ScrapedLead {
    handle: string;
    name: string;
    bio: string;
    followers: number;
    following: number;
    platform: 'instagram' | 'tiktok';
    avatar_url?: string;
    post_count?: number;
    is_verified?: boolean;
    is_business?: boolean;
    business_category?: string;
    external_url?: string;
    is_private?: boolean;
}

export const scraperService = {
    async searchLeads(filters: ScoutingFilters, customToken?: string): Promise<ScrapedLead[]> {
        console.log("🚀 Iniciando busca real no Instagram via Apify...");
        console.log("🔍 Filtros recebidos:", JSON.stringify(filters, null, 2));

        const token = customToken || process.env.APIFY_API_TOKEN || '';

        if (!token) {
            console.error("❌ Token do Apify não configurado!");
            throw new Error("Configuração ausente: APIFY_API_TOKEN");
        }

        const client = new ApifyClient({ token });

        const limit = filters.limit || 10;

        try {
            // Lógica de Detecção de Handle: Só considera handle se começar com @
            const isHandle = filters.niche?.startsWith('@');

            let items: any[] = [];

            if (isHandle) {
                // ═══════════════════════════════════════════
                // MODO PERFIL: Busca direta por um @handle
                // Usa: apify/instagram-profile-scraper
                // ═══════════════════════════════════════════
                const username = filters.niche?.replace('@', '');
                console.log(`👤 Modo Perfil para: ${username}`);

                const input = {
                    "usernames": [username],
                };

                const run = await client.actor("apify/instagram-profile-scraper").call(input);
                const dataset = await client.dataset(run.defaultDatasetId).listItems();
                items = dataset.items;
            } else {
                // ═══════════════════════════════════════════════════
                // MODO DESCOBERTA: Busca por keywords brasileiras
                // Usa: apify/instagram-search-scraper + instagram-profile-scraper
                //
                // Estratégia de Duas Etapas:
                // 1. Busca por keywords para descobrir usernames relevantes.
                // 2. Consulta em lote dos perfis para obter biografia, seguidores e detalhes reais.
                // ═══════════════════════════════════════════════════

                const keywords: string[] = [];

                if (filters.searchKeywords && filters.searchKeywords.length > 0) {
                    // Usar até 5 keywords da IA (já em português)
                    keywords.push(...filters.searchKeywords.slice(0, 5));
                } else if (filters.niche) {
                    // Fallback: adicionar "brasil" ao nicho
                    keywords.push(`${filters.niche} brasil`);
                    keywords.push(`${filters.niche} brasileira`);
                } else {
                    keywords.push('modelo brasileira');
                    keywords.push('influencer brasil');
                }

                // Sanitizar keywords: Apify proíbe caracteres especiais
                // Regex permitido: ^[^!?.,:;\-+=*&%$#@/\~^|<>()[\]{}"'`]+(?:,[^!?.,:;\-+=*&%$#@/\~^|<>()[\]{}"'`]+)*$
                const sanitizedKeywords = keywords
                    .map(kw => kw.replace(/[!?.,:;\\\-+=*&%$#@/~^|<>()\[\]{}"'`]/g, ' ').replace(/\s+/g, ' ').trim())
                    .filter(kw => kw.length > 0);

                console.log("🔍 Keywords sanitizadas para busca:", sanitizedKeywords);

                // Formato correto: search é string separada por vírgulas SEM espaço após a vírgula
                const searchString = sanitizedKeywords.join(',');
                const searchLimit = Math.max(50, limit * 3);

                const input = {
                    "search": searchString,
                    "searchType": "user",
                    "searchLimit": searchLimit, // 50 por keyword × 5 keywords = ~250 candidatos
                    "enhanceUserSearchWithFacebookPage": false,
                };

                console.log("📦 1. Executando busca de usuários no Apify...", JSON.stringify(input, null, 2));

                const searchRun = await client.actor("apify/instagram-search-scraper").call(input);
                const searchDataset = await client.dataset(searchRun.defaultDatasetId).listItems();
                const searchItems = searchDataset.items;

                console.log(`📊 ${searchItems.length} perfis brutos encontrados na busca.`);

                // Obter usernames únicos
                const seenUsernames = new Set<string>();
                const uniqueUsernames: string[] = [];

                 for (const item of searchItems) {
                     const username = ((item as any).username || (item as any).ownerUsername || (item as any).id) as string | undefined;
                     if (username && !seenUsernames.has(username)) {
                         seenUsernames.add(username);
                         uniqueUsernames.push(username);
                     }
                 }

                // Limitar para os perfis mais relevantes para enriquecer (2x mais do que o limite solicitado)
                const usernamesToScrape = uniqueUsernames.slice(0, Math.max(20, limit * 2));
                console.log(`👤 2. Enriquecendo detalhes de ${usernamesToScrape.length} perfis:`, usernamesToScrape);

                if (usernamesToScrape.length > 0) {
                    const profileInput = {
                        "usernames": usernamesToScrape,
                    };
                    const profileRun = await client.actor("apify/instagram-profile-scraper").call(profileInput);
                    const profileDataset = await client.dataset(profileRun.defaultDatasetId).listItems();
                    items = profileDataset.items;
                } else {
                    items = [];
                }
            }

            // Log dos dados brutos para debug
            if (items.length > 0) {
                console.log(`📊 ${items.length} resultados brutos retornados`);
                console.log("📊 Exemplo do primeiro perfil:", JSON.stringify({
                    username: items[0].username,
                    fullName: items[0].fullName,
                    followersCount: items[0].followersCount,
                    followsCount: items[0].followsCount,
                    postsCount: items[0].postsCount,
                    biography: items[0].biography?.substring(0, 80),
                    verified: items[0].verified,
                    private: items[0].private,
                }, null, 2));
            }

            if (!items || items.length === 0) {
                console.warn("⚠️ Nenhum resultado encontrado no Apify.");
                return [];
            }

            // ═══════════════════════════════════════════
            // DEDUPLICAÇÃO: Remover perfis repetidos
            // (pode vir duplicado de múltiplas keywords)
            // ═══════════════════════════════════════════
            const seenUsernames = new Set<string>();
            const uniqueItems = items.filter((item: any) => {
                const username = item.username || item.ownerUsername || item.id;
                if (!username || seenUsernames.has(username)) return false;
                seenUsernames.add(username);
                return true;
            });

            // ═══════════════════════════════════════════
            // FILTRAGEM POR SEGUIDORES (no scraper!)
            // Aplica o filtro ANTES de mapear, para
            // garantir que só perfis dentro da faixa passem
            // ═══════════════════════════════════════════
            let filteredItems = uniqueItems;
            if (filters.minFollowers || filters.maxFollowers) {
                const minF = filters.minFollowers || 0;
                const maxF = filters.maxFollowers || 999_999_999;
                filteredItems = uniqueItems.filter((item: any) => {
                    const followers = item.followersCount || 0;
                    return followers >= minF && followers <= maxF;
                });
                console.log(`📊 Filtro de seguidores (${minF}-${maxF}): ${uniqueItems.length} únicos → ${filteredItems.length} na faixa`);

                // Se nenhum resultado passou no filtro de seguidores, NÃO fazer fallback
                if (filteredItems.length === 0) {
                    console.warn(`⚠️ Nenhum perfil encontrado na faixa ${minF}-${maxF} seguidores.`);
                    // Retornar os top 10 mais próximos da faixa, ordenados por proximidade
                    filteredItems = uniqueItems
                        .filter((item: any) => !item.private) // Pelo menos remover privados
                        .sort((a: any, b: any) => {
                            const aFollowers = a.followersCount || 0;
                            const bFollowers = b.followersCount || 0;
                            const aDist = Math.min(Math.abs(aFollowers - minF), Math.abs(aFollowers - maxF));
                            const bDist = Math.min(Math.abs(bFollowers - minF), Math.abs(bFollowers - maxF));
                            return aDist - bDist;
                        })
                        .slice(0, 5);
                    console.log(`📊 Retornando ${filteredItems.length} perfis mais próximos da faixa`);
                }
            }

            // Filtrar perfis privados
            const publicItems = filteredItems.filter((item: any) => !item.private);

            // Limitar para no máximo {limit} resultados
            const limitedItems = publicItems.slice(0, limit);

            console.log(`✅ Pipeline: ${items.length} brutos → ${uniqueItems.length} únicos → ${filteredItems.length} filtrados → ${publicItems.length} públicos → ${limitedItems.length} retornados`);

            // ═══════════════════════════════════════════════════
            // MAPEAMENTO ROBUSTO dos campos da Apify
            // ═══════════════════════════════════════════════════
            return limitedItems.map((item: any) => {
                const username = item.username || item.ownerUsername || item.id;
                return {
                    handle: username ? `@${username}` : "perfil",
                    name: item.fullName || username || "Model",
                    bio: item.biography || item.description || "",
                    followers: item.followersCount || 0,
                    following: item.followsCount || 0,
                    platform: 'instagram' as const,
                    avatar_url: item.profilePicUrlHD || item.profilePicUrl || "",
                    post_count: item.postsCount || 0,
                    is_verified: item.verified || false,
                    is_business: item.isBusinessAccount || false,
                    business_category: item.businessCategoryName || "",
                    external_url: item.externalUrl || "",
                    is_private: item.private || false,
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
