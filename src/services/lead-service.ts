import { supabase } from "@/lib/supabase/client";

export interface Lead {
    id: string;
    platform: 'instagram' | 'tiktok';
    platform_id?: string;
    handle: string;
    name?: string;
    bio?: string;
    followers?: number;
    age_range?: string;
    avatar_url?: string;
    external_link?: string;
    email?: string;
    phone?: string;
    location?: string;
    status: 'new' | 'approaching' | 'approached' | 'in_conversation' | 'selected' | 'converted' | 'lost';
    niche?: string;
    ai_summary?: string;
    ai_characteristics?: string;
    ai_score?: number;
    tags?: string[];
    assigned_to?: string;
    created_at?: string;
    updated_at: string;
}

export interface Interaction {
    id: string;
    lead_id: string;
    user_id?: string;
    type: 'note' | 'status_change' | 'dm_sent' | 'response_received';
    content: string;
    created_at: string;
}

export const leadService = {
    async getLeads() {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Lead[];
    },

    async getLeadById(id: string) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async createLead(lead: Partial<Lead>) {
        // Obter o usuário autenticado para vinculação automática (RLS compliant)
        const { data: { user } } = await supabase.auth.getUser();

        const leadWithUser = {
            ...lead,
            assigned_to: lead.assigned_to || user?.id || null
        };

        const { data, error } = await supabase
            .from('leads')
            .insert([leadWithUser])
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async updateLead(id: string, updates: Partial<Lead>) {
        const { data, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    },

    async deleteLead(id: string) {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getInteractions(leadId: string): Promise<Interaction[]> {
        console.log("Fetching interactions for lead from Supabase:", leadId);
        const { data, error } = await supabase
            .from('interactions')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // If no interactions found yet, insert default "Lead captado"
        if (data.length === 0) {
            const defaultInteraction = {
                lead_id: leadId,
                type: 'status_change' as const,
                content: 'Lead captado via Radar AI'
            };
            await this.addInteraction(leadId, defaultInteraction);
            
            // Re-fetch
            const { data: refetched } = await supabase
                .from('interactions')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });
            return (refetched || [defaultInteraction]) as Interaction[];
        }

        return data as Interaction[];
    },

    async addInteraction(leadId: string, interaction: Omit<Interaction, "id" | "created_at">): Promise<void> {
        const { error } = await supabase
            .from('interactions')
            .insert([{
                lead_id: leadId,
                user_id: interaction.user_id || null,
                type: interaction.type,
                content: interaction.content
            }]);

        if (error) throw error;
    },

    async updateStatus(leadId: string, status: Lead['status']): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', leadId);

        if (error) throw error;

        // Auto-log status change
        await this.addInteraction(leadId, {
            lead_id: leadId,
            type: 'status_change',
            content: `Status alterado para ${status.replace('_', ' ')}`
        });
    },

    async getStatusStats() {
        const { data, error } = await supabase
            .from('leads')
            .select('status');

        if (error) throw error;

        const counts: Record<string, number> = {
            new: 0,
            approaching: 0,
            approached: 0,
            in_conversation: 0,
            selected: 0,
            converted: 0,
            lost: 0
        };

        data?.forEach(lead => {
            if (lead.status in counts) {
                counts[lead.status]++;
            }
        });

        return [
            { name: 'Novos', value: counts.new, color: '#3B82F6' },
            { name: 'Para Abordar', value: counts.approaching, color: '#8B5CF6' },
            { name: 'Abordados', value: counts.approached, color: '#F59E0B' },
            { name: 'Em Conversa', value: counts.in_conversation, color: '#EC4899' },
            { name: 'Selecionados', value: counts.selected, color: '#10B981' },
        ];
    },

    async getNicheStats() {
        const { data, error } = await supabase
            .from('leads')
            .select('niche');

        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach(lead => {
            if (lead.niche) {
                const name = lead.niche.charAt(0).toUpperCase() + lead.niche.slice(1).toLowerCase();
                counts[name] = (counts[name] || 0) + 1;
            }
        });

        const total = data?.filter(lead => lead.niche).length || 0;

        const sorted = Object.entries(counts)
            .map(([name, value]) => ({ 
                name, 
                value: total > 0 ? Math.round((value / total) * 100) : 0 
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);

        if (sorted.length === 0) {
            return [
                { name: 'Beauty', value: 0 },
                { name: 'Fashion', value: 0 },
                { name: 'Lifestyle', value: 0 },
                { name: 'Fitness', value: 0 },
            ];
        }

        return sorted;
    },

    async getComparisonLeads(): Promise<Lead[]> {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('ai_score', { ascending: false })
            .limit(3);

        if (error) throw error;
        return data as Lead[];
    },

    async getRecentActivities() {
        const { data, error } = await supabase
            .from('interactions')
            .select(`
                id,
                lead_id,
                type,
                content,
                created_at,
                leads:lead_id ( handle )
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Failed to fetch activities:", error);
            return [];
        }

        return data as any[];
    }
};
