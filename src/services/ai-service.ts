import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";

export interface AIAnalysisResult {
    score: number;
    niche: string;
    summary: string;
    characteristics: string[];
    age_range: string;
    potential?: string;
}

export interface ScoutingFilters {
    niche?: string;
    minFollowers?: number;
    maxFollowers?: number;
    ageRange?: string;
    platforms?: string[];
    searchKeywords?: string[];
}

export const aiService = {
    async processScoutingPrompt(prompt: string): Promise<ScoutingFilters> {
        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: `Você é um especialista em Scouting de Modelos e Influenciadores para a equipe do Dilson Stein, o maior descobridor de talentos do mundo.
                        Sua tarefa é extrair critérios de busca rigorosos de um prompt para encontrar modelos, atrizes e atores com alto potencial comercial e gerar KEYWORDS em PORTUGUÊS BRASILEIRO.
                        
                        Critérios importantes para o Dilson Stein:
                        - Atributos físicos específicos (cor de cabelo, biotipo) se informados.
                        - Engajamento (presença digital, não apenas seguidores).
                        - Faixa etária comercial.
                        
                        REGRAS OBRIGATÓRIAS PARA AS KEYWORDS:
                        1. SEMPRE em PORTUGUÊS BRASILEIRO.
                        2. Devem ser termos que brasileiros usam em bios, hashtags e nomes de perfil.
                        3. Use termos curtos e populares no Instagram Brasil.
                        4. SEMPRE inclua pelo menos um termo geográfico brasileiro (ex: "brasil", "brasileira", "br", "são paulo", "rio").
                        5. NÃO use frases longas ou descritivas.
                        6. Pense em como brasileiros se descrevem no Instagram.
                        7. NUNCA use caracteres especiais como + ! ? . : ; = * & % $ # @ nas keywords. Use apenas letras, números e espaços.
                        8. IMPORTANTE (Foco Local): Se o usuário especificar uma localização geográfica (cidade, estado ou região, ex: 'Curitiba', 'Paraná', 'CWB'), pelo menos 3 das 5 keywords geradas DEVEM conter obrigatoriamente essa localização específica ou suas abreviações locais populares (ex: 'curitiba', 'cwb', 'pr') para maximizar a precisão regional.
                        
                        REGRAS PARA A FAIXA DE SEGUIDORES (minFollowers e maxFollowers):
                        1. Se o usuário fornecer um número alvo específico (ex: "200k", "200 mil", "50k", etc.), crie uma faixa de tolerância inteligente de aproximadamente ±40% ao redor desse valor para maximizar as chances de encontrar perfis ideais e próximos da meta (ex: para "200k" defina minFollowers: 120000 e maxFollowers: 280000; para "50k" defina minFollowers: 30000 e maxFollowers: 70000).
                        2. Se o usuário especificar limites explícitos de mínimo (ex: "mínimo de 100k", "mais de 100k", "pelo menos 100k"), defina apenas o minFollowers correspondente e deixe o maxFollowers como null.
                        3. Se o usuário especificar limites explícitos de máximo (ex: "até 50k", "no máximo 50k", "menos de 50k"), defina apenas o maxFollowers correspondente e deixe o minFollowers como null.
                        
                        Retorne um JSON com:
                        - niche: Tema principal (ex: "fashion", "commercial", "fitness").
                        - minFollowers: Número exato conforme as regras acima. Se o usuário não especificar, use null.
                        - maxFollowers: Número exato conforme as regras acima. Se o usuário não especificar, use null.
                        - ageRange: Texto (ex: "18-25", "40-50"). Se não especificado, use null.
                        - searchKeywords: Lista de EXATAMENTE 5 termos de busca OTIMIZADOS para o Instagram em português brasileiro (ex: ["modelo ruiva brasil", "new face ruiva", "atriz ruiva"]).
                        
                        Prompt do usuário: "${prompt}"`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            const parsed = JSON.parse(content || "{}") as ScoutingFilters;
            console.log("🧠 IA gerou keywords:", parsed.searchKeywords);
            return parsed;
        } catch (error) {
            console.error("Prompt processing failed:", error);
            return {};
        }
    },

    async analyzeProfile(handle: string, bio: string, platform: string): Promise<AIAnalysisResult> {
        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: `Você é um Scout Sênior do Dilson Stein especializado em agenciamento de grandes marcas e marcas brasileiras.
            Analise o perfil e dê uma nota de 0 a 100 baseada no potencial de agenciamento para grandes marcas.
            
            CRITÉRIOS DE AVALIAÇÃO:
            - Se o perfil NÃO parece ser brasileiro (bio em outro idioma, localização fora do Brasil), dê score BAIXO (0-30).
            - Se o perfil parece ser brasileiro, avalie normalmente (0-100) considerando: Estética, qualidade das fotos, bio, nicho e engajamento.
            
            Retorne um JSON com:
            - score: número (0-100)
            - niche: nicho exato (ex: "Fashion High End", "Comercial de TV", "Publicidade")
            - summary: resumo do perfil em PT-BR (breve)
            - characteristics: array de strings (ex: ["Ruiva", "Pele Clara", "Estilo Casual"])
            - age_range: estimativa de idade baseada na bio/fotos
            - potential: "Alto", "Médio" ou "Baixo"
            
            Retorne APENAS o JSON.`
                    },
                    {
                        role: "user",
                        content: `Plataforma: ${platform}\nHandle: ${handle}\nBio: ${bio}`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content || "{}") as AIAnalysisResult;
        } catch (error) {
            return { score: 50, niche: "N/A", summary: "Erro na análise.", characteristics: [], age_range: "N/A" };
        }
    },

    async generateFiltersFromProfile(profileData: any): Promise<ScoutingFilters> {
        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: `Você é um especialista em Lookalike de Modelos. 
                        Receba os dados de um perfil de SUCESSO e gere filtros para encontrar perfis similares.
                        
                        Retorne um JSON com:
                        - niche: Mesmo nicho do perfil.
                        - minFollowers: Baseado no perfil atual.
                        - maxFollowers: 2x o perfil atual.
                        - ageRange: Mesma faixa.
                        - searchKeywords: 5 termos para achar perfis IDÊNTICOS (ex: se é loira fitness, use ["modelo loira fitness", "atleta bikini loira"]).`
                    },
                    {
                        role: "user",
                        content: JSON.stringify(profileData)
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content || "{}") as ScoutingFilters;
        } catch (error) {
            console.error("Lookalike analysis failed:", error);
            return {};
        }
    }
};
