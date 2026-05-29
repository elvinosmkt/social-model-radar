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
    searchKeywords?: string[];
}

export const aiService = {
    async processScoutingPrompt(prompt: string): Promise<ScoutingFilters> {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Você é um especialista em Scouting de Modelos e Influenciadores BRASILEIROS no Instagram.
                        Sua tarefa é extrair critérios de busca e gerar KEYWORDS em PORTUGUÊS BRASILEIRO que realmente existem no Instagram Brasil.
                        
                        REGRAS OBRIGATÓRIAS PARA AS KEYWORDS:
                        1. SEMPRE em PORTUGUÊS BRASILEIRO.
                        2. Devem ser termos que brasileiros usam em bios, hashtags e nomes de perfil.
                        3. Use termos curtos e populares no Instagram Brasil.
                        4. SEMPRE inclua pelo menos um termo geográfico brasileiro (ex: "brasil", "brasileira", "br", "são paulo", "rio").
                        5. NÃO use frases longas ou descritivas.
                        6. Pense em como brasileiros se descrevem no Instagram.
                        7. NUNCA use caracteres especiais como + ! ? . : ; = * & % $ # @ nas keywords. Use apenas letras, números e espaços.
                        8. IMPORTANTE (Foco Local): Se o usuário especificar uma localização geográfica (cidade, estado ou região, ex: 'Curitiba', 'Paraná', 'CWB'), pelo menos 3 das 5 keywords geradas DEVEM conter obrigatoriamente essa localização específica ou suas abreviações locais populares (ex: 'curitiba', 'cwb', 'pr') para maximizar a precisão regional.
                        
                        Exemplos de BOAS keywords:
                        - Para "mulheres 40 anos fitness em curitiba": ["fitness curitiba", "madura curitiba", "cwb fitness", "influencer curitiba", "curitiba pr"]
                        - Para "modelos femininas": ["modelo brasileira", "modelo br", "fashion brasil", "influencer moda"]
                        - Para "beleza": ["beleza brasileira", "maquiadora", "skincare brasil", "beauty influencer br"]
                        - Para "lifestyle": ["lifestyle brasil", "influenciadora", "blogueira brasileira", "dicas estilo"]
                        - Para "moda": ["moda brasileira", "estilo brasileiro", "fashionista br", "look do dia"]
                        
                        REGRAS PARA A FAIXA DE SEGUIDORES (minFollowers e maxFollowers):
                        1. Se o usuário fornecer um número alvo específico (ex: "200k", "200 mil", "50k", etc.), crie uma faixa de tolerância inteligente de aproximadamente ±40% ao redor desse valor para maximizar as chances de encontrar perfis ideais e próximos da meta (ex: para "200k" defina minFollowers: 120000 e maxFollowers: 280000; para "50k" defina minFollowers: 30000 e maxFollowers: 70000).
                        2. Se o usuário especificar limites explícitos de mínimo (ex: "mínimo de 100k", "mais de 100k", "pelo menos 100k"), defina apenas o minFollowers correspondente e deixe o maxFollowers como null.
                        3. Se o usuário especificar limites explícitos de máximo (ex: "até 50k", "no máximo 50k", "menos de 50k"), defina apenas o maxFollowers correspondente e deixe o minFollowers como null.
                        
                        Retorne um JSON com:
                        - niche: Tema principal em português (ex: "fitness", "moda", "beleza", "lifestyle").
                        - minFollowers: Número exato conforme as regras acima. Se o usuário não especificar, use null.
                        - maxFollowers: Número exato conforme as regras acima. Se o usuário não especificar, use null.
                        - ageRange: Texto (ex: "40-50", "25-35"). Se não especificado, use null.
                        - searchKeywords: Lista de EXATAMENTE 5 termos CURTOS em PORTUGUÊS BRASILEIRO seguindo as regras de keywords.
                        
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
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `Você é um Scout especializado em agenciamento de modelos e influenciadores BRASILEIROS.
            Analise o perfil e determine se é brasileiro ou não.
            
            CRITÉRIOS DE AVALIAÇÃO:
            - Se o perfil NÃO parece ser brasileiro (bio em outro idioma, localização fora do Brasil), dê score BAIXO (0-30).
            - Se o perfil parece ser brasileiro, avalie normalmente (0-100).
            - Considere: idioma da bio, localização, tipo de conteúdo, engajamento.
            
            Retorne JSON com: score (0-100), niche (em PT-BR), summary (PT-BR, breve), characteristics (array), age_range.
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
