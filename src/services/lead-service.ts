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
        const { data, error } = await supabase
            .from('leads')
            .insert([lead])
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
        console.log("Fetching interactions for lead:", leadId);
        // Simulation
        return [
            { id: "1", lead_id: leadId, type: "status_change", content: "Lead captado via Radar AI", created_at: new Date().toISOString() }
        ];
    },

    async addInteraction(leadId: string, interaction: Omit<Interaction, "id" | "created_at">): Promise<void> {
        // Mock add
        console.log(`Adding interaction to ${leadId}:`, interaction);
    },

    async updateStatus(leadId: string, status: Lead['status']): Promise<void> {
        // Mock status update
        console.log(`Updating lead ${leadId} status to: ${status}`);

        // Auto-log status change
        await this.addInteraction(leadId, {
            lead_id: leadId,
            type: 'status_change',
            content: `Status alterado para ${status.replace('_', ' ')}`
        });
    },
    async getStatusStats() {
        // Mock stats based on different statuses
        return [
            { name: 'Novos', value: 120, color: '#00F5FF' },
            { name: 'Abordados', value: 85, color: '#3B82F6' },
            { name: 'Em Conversa', value: 45, color: '#F59E0B' },
            { name: 'Selecionados', value: 12, color: '#10B981' },
        ];
    },

    async getNicheStats() {
        return [
            { name: 'Beauty', value: 45 },
            { name: 'Fashion', value: 30 },
            { name: 'Lifestyle', value: 15 },
            { name: 'Fitness', value: 10 },
        ];
    },

    async getComparisonLeads(): Promise<Lead[]> {
        return [
            {
                id: "1",
                handle: "@isabella.f",
                name: "Isabella Ferreira",
                status: "new",
                ai_score: 92,
                followers: 45000,
                niche: "Beauty",
                updated_at: new Date().toISOString(),
                platform: "instagram"
            },
            {
                id: "2",
                handle: "@adriana_m40",
                name: "Adriana Medeiros",
                status: "approaching",
                ai_score: 85,
                followers: 12000,
                niche: "Fashion",
                updated_at: new Date().toISOString(),
                platform: "instagram"
            },
            {
                id: "3",
                handle: "@carol_style",
                name: "Carolina Santos",
                status: "in_conversation",
                ai_score: 78,
                followers: 8500,
                niche: "Lifestyle",
                updated_at: new Date().toISOString(),
                platform: "instagram"
            }
        ];
    }
};
