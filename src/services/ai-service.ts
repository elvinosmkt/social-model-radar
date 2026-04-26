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
}

export interface ScoutingFilters {
    niche?: string;
    minFollowers?: number;
    maxFollowers?: number;
    ageRange?: string;
    platforms?: string[];
    searchKeywords?: string[]; // New field for better discovery
}

export const aiService = {
    async processScoutingPrompt(prompt: string): Promise<ScoutingFilters> {
        try {
            const response = await openai.chat.completions.create({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: `Você é um Scout Master da equipe de Dilson Stein, o maior descobridor de talentos do mundo. 
                        Sua tarefa é extrair critérios de busca rigorosos de um prompt para encontrar modelos, atrizes e atores com alto potencial comercial.
                        
                        Critérios importantes para o Dilson Stein:
                        - Atributos físicos específicos (cor de cabelo, biotipo).
                        - Engajamento (não apenas seguidores, mas presença digital).
                        - Faixa etária comercial.
                        
                        Retorne um JSON com:
                        - niche: Tema principal (ex: "fashion", "commercial", "fitness").
                        - minFollowers: Número (ex: 2000).
                        - maxFollowers: Número (ex: 5000).
                        - ageRange: Texto (ex: "18-25").
                        - searchKeywords: Lista de 5 termos de busca OTIMIZADOS para o Instagram (ex: ["modelo ruiva brasil", "new face ruiva", "atriz ruiva iniciante"]).
                        
                        Prompt: "${prompt}"`
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content || "{}") as ScoutingFilters;
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
                        content: `Você é um Scout Sênior do Dilson Stein. 
            Analise o perfil e dê uma nota de 0 a 100 baseada no potencial de agenciamento para grandes marcas.
            Considere: Estética, qualidade das fotos, bio e nicho.
            
            Retorne um JSON: 
            - score: número (0-100)
            - niche: nicho exato (ex: "Fashion High End", "Comercial de TV", "Publicidade")
            - summary: resumo do perfil em PT-BR
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
