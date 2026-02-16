export interface DMTemplate {
    id: string;
    name: string;
    content: string;
    category: 'initial' | 'followup' | 'closing';
}

export const dmTemplates: DMTemplate[] = [
    {
        id: '1',
        name: 'Abordagem Inicial (Elogio)',
        category: 'initial',
        content: 'Olá {name}, tudo bem? Vi seu perfil aqui no Radar e achei seu conteúdo de {niche} incrível! Gostaríamos de conversar sobre uma possível parceria. Teria interesse?'
    },
    {
        id: '2',
        name: 'Abordagem Profissional',
        category: 'initial',
        content: 'Bom dia @{handle}, sou da Blend Softwares e estamos selecionando novos perfis para nossa base de modelos de {niche}. Vimos que você tem um ótimo engajamento. Podemos conversar?'
    },
    {
        id: '3',
        name: 'Follow-up (2 dias)',
        category: 'followup',
        content: 'Oi {name}, passando para ver se você recebeu minha última mensagem. Adoraríamos contar com você em nosso radar!'
    }
];

export const templateService = {
    getTemplates() {
        return dmTemplates;
    },

    hydrateTemplate(content: string, lead: { name?: string, handle: string, niche?: string }) {
        return content
            .replace(/{name}/g, lead.name || lead.handle)
            .replace(/{handle}/g, lead.handle.replace('@', ''))
            .replace(/{niche}/g, lead.niche || 'conteúdo');
    }
};
