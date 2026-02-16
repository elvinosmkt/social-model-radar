import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Você é um especialista em Scouting de Modelos. 
                        Sua tarefa é extrair critérios de busca rigorosos de um prompt.
                        
                        Retorne um JSON com:
                        - niche: Tema principal (ex: "fitness", "classic", "fashion").
                        - minFollowers: Número (ex: 2000).
                        - maxFollowers: Número (ex: 5000).
                        - ageRange: Texto (ex: "40-60").
                        - searchKeywords: Lista de 3-5 termos de busca para Instagram (ex: ["modelos 40 anos", "mature model brasil", "agenciada 40+"]).
                        
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
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Você é um Scout especializado em agenciamento de modelos e influenciadores.
            Análise do perfil JSON: score (0-100), niche, summary (PT-BR), characteristics (array), age_range.
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
    }
};
