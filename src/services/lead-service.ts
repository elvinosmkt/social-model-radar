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
    has_whatsapp?: boolean;
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
    async getScopedQuery(tableName: string, selectColumns: string = '*'): Promise<any> {
        const { data: { user } } = await supabase.auth.getUser();
        console.log(`[getScopedQuery] Fetch user session:`, user ? `${user.email} (${user.id})` : 'No authenticated user session found');
        
        if (!user) {
            console.log(`[getScopedQuery] Falling back to unfiltered query for ${tableName}`);
            return supabase.from(tableName).select(selectColumns);
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn(`[getScopedQuery] Failed to fetch profile for user ${user.id}:`, profileError.message);
        }

        const role = profile?.role || 'webscouter';
        console.log(`[getScopedQuery] Resolved role: "${role}" for table: "${tableName}"`);
        
        let query = supabase.from(tableName).select(selectColumns);

        if (role === 'admin') {
            console.log(`[getScopedQuery] Admin role: returning full access query for ${tableName}`);
            return query;
        }

        if (tableName === 'leads') {
            if (role === 'vendedor') {
                console.log(`[getScopedQuery] Vendedor role: filtering leads by vendedor_id = ${user.id}`);
                query = query.eq('vendedor_id', user.id);
            } else {
                console.log(`[getScopedQuery] Webscouter role: filtering leads by assigned_to = ${user.id}`);
                query = query.eq('assigned_to', user.id);
            }
        }

        if (tableName === 'interactions') {
            if (role === 'vendedor') {
                const { data: teamLeads } = await supabase
                    .from('leads')
                    .select('id')
                    .eq('vendedor_id', user.id);
                
                const leadIds = teamLeads?.map(l => l.id) || [];
                console.log(`[getScopedQuery] Vendedor role: filtering interactions by team lead IDs (count: ${leadIds.length})`);
                if (leadIds.length > 0) {
                    query = query.in('lead_id', leadIds);
                } else {
                    query = query.eq('lead_id', '00000000-0000-0000-0000-000000000000');
                }
            } else {
                console.log(`[getScopedQuery] Webscouter/Admin role: filtering interactions by user_id = ${user.id}`);
                query = query.eq('user_id', user.id);
            }
        }

        return { query };
    },

    async getLeads() {
        const { query } = await this.getScopedQuery('leads', '*');
        const { data, error } = await query
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
        // 1. Obter o usuário autenticado para vinculação automática (RLS compliant)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado.");

        let teamId: string | null = null;
        let vendedorId: string | null = null;

        try {
            const { data: profile } = await supabase
                .from('users')
                .select('team_id, vendedor_id')
                .eq('id', user.id)
                .single();
            if (profile) {
                teamId = profile.team_id || null;
                vendedorId = profile.vendedor_id || null;
            }
        } catch (e) {
            console.warn("⚠️ Não foi possível recuperar metadados de equipe do perfil do usuário:", e);
        }

        const handleLower = lead.handle?.replace('@', '').trim().toLowerCase();
        if (!handleLower) throw new Error("O identificador (handle) do lead é obrigatório.");

        // 2. Check in leads_master for duplicate blocking rules
        let masterId: string | null = null;
        try {
            const { data: existingMaster } = await supabase
                .from('leads_master')
                .select('id')
                .eq('handle', handleLower)
                .maybeSingle();

            if (existingMaster) {
                masterId = existingMaster.id;

                // Check if this master lead is already active under another team or scouter
                const { data: existingLocalLead } = await supabase
                    .from('leads')
                    .select('id, team_id, status, assigned_to')
                    .eq('lead_master_id', masterId)
                    .neq('status', 'lost')
                    .maybeSingle();

                if (existingLocalLead) {
                    let ownerLabel = "outra equipe";
                    if (existingLocalLead.team_id) {
                        const { data: teamData } = await supabase
                            .from('teams')
                            .select('nome')
                            .eq('id', existingLocalLead.team_id)
                            .maybeSingle();
                        if (teamData?.nome) {
                            ownerLabel = `a equipe "${teamData.nome}"`;
                        }
                    } else if (existingLocalLead.assigned_to) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('nome')
                            .eq('id', existingLocalLead.assigned_to)
                            .maybeSingle();
                        if (userData?.nome) {
                            ownerLabel = `o scouter "${userData.nome}"`;
                        }
                    }

                    const duplicateError = new Error(`Este perfil já está na base. Vinculado a ${ownerLabel}.`) as any;
                    duplicateError.code = "DUPLICATE_LEAD";
                    throw duplicateError;
                }
            } else {
                // Not in leads_master, register it
                const { data: newMaster, error: createMasterErr } = await supabase
                    .from('leads_master')
                    .insert([{
                        handle: handleLower,
                        platform: lead.platform || 'instagram',
                        name: lead.name || null,
                        bio: lead.bio || null,
                        followers: lead.followers || 0,
                        avatar_url: lead.avatar_url || null,
                        external_url: lead.external_link || null,
                        email: lead.email || null,
                        phone: lead.phone || null,
                        has_whatsapp: lead.has_whatsapp || false,
                        last_scraped_at: new Date().toISOString()
                    }])
                    .select('id')
                    .single();

                if (createMasterErr) throw createMasterErr;
                if (newMaster) {
                    masterId = newMaster.id;
                }
            }
        } catch (e: any) {
            if (e.code === "DUPLICATE_LEAD") throw e;
            console.warn("⚠️ Banco: Bypass ou falha temporária de RLS/leads_master:", e.message);
        }

        // 3. Inserir lead local associando ao leads_master e preenchendo hierarquia
        const leadWithUser = {
            ...lead,
            handle: handleLower,
            assigned_to: lead.assigned_to || user.id,
            lead_master_id: masterId,
            team_id: teamId,
            vendedor_id: vendedorId
        };

        const { data, error } = await supabase
            .from('leads')
            .insert([leadWithUser])
            .select()
            .single();

        if (error) {
            if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
                const dupError = new Error(`O perfil @${handleLower} já está cadastrado no seu pipeline.`) as any;
                dupError.code = "DUPLICATE_LEAD";
                throw dupError;
            }
            throw error;
        }
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
                ...interaction,
                lead_id: leadId,
                user_id: interaction.user_id || null
            }]);

        if (error) throw error;
    },

    async updateStatus(leadId: string, status: Lead['status']): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', leadId);

        if (error) throw error;

        let activeUserId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) activeUserId = user.id;
        } catch (e) {}

        // Auto-log status change
        await this.addInteraction(leadId, {
            lead_id: leadId,
            type: 'status_change',
            content: `Status alterado para ${status.replace('_', ' ')}`,
            user_id: activeUserId || undefined
        });
    },

    async getStatusStats() {
        const { query } = await this.getScopedQuery('leads', 'status');
        const { data, error } = await query;

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

        data?.forEach((lead: any) => {
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
        const { query } = await this.getScopedQuery('leads', 'niche');
        const { data, error } = await query;

        if (error) throw error;

        const counts: Record<string, number> = {};
        data?.forEach((lead: any) => {
            if (lead.niche) {
                const name = lead.niche.charAt(0).toUpperCase() + lead.niche.slice(1).toLowerCase();
                counts[name] = (counts[name] || 0) + 1;
            }
        });

        const total = data?.filter((lead: any) => lead.niche).length || 0;

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
        const { query } = await this.getScopedQuery('leads', '*');
        const { data, error } = await query
            .order('ai_score', { ascending: false })
            .limit(3);

        if (error) throw error;
        return data as Lead[];
    },

    async getRecentActivities() {
        try {
            const { query } = await this.getScopedQuery('interactions', `
                id,
                lead_id,
                type,
                content,
                created_at,
                leads:lead_id ( handle )
            `);
            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error("Failed to fetch activities:", error);
                return [];
            }

            return data as any[];
        } catch (e) {
            console.error("Error in getRecentActivities:", e);
            return [];
            }
        },

    async getDailyApproachesCount(userId: string): Promise<number> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { count, error } = await supabase
                .from('interactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .in('type', ['dm_sent', 'status_change'])
                .gte('created_at', today.toISOString());

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error("Failed to fetch daily approaches count:", error);
            return 0;
        }
    }
};
