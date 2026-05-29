import { supabase } from "@/lib/supabase/client";

export interface UserProfile {
    id: string;
    nome: string;
    email: string;
    role: 'admin' | 'vendedor' | 'webscouter';
    vendedor_id?: string;
    team_id?: string;
    status: 'active' | 'warning' | 'new' | 'inactive';
    criado_em: string;
    ultimo_acesso?: string;
}

// ── Mock fallbacks in case SQL Editor script hasn't been run ──
const MOCK_VENDEDORES = [
    {
        id: "v1", name: "Carlos Mendes", email: "carlos@dwsscouter.com",
        team: "Time Alpha", teamId: "t1",
        creditsReceived: 2000, creditsDistributed: 1100, creditsUsed: 712,
        webscoutersCount: 2, leadsTotal: 163, leadsApproached: 125,
        leadsConverted: 13, responseRate: 44, conversionRate: 10.4,
        status: "active", lastSeen: "há 10 min"
    },
    {
        id: "v2", name: "Patricia Lima", email: "patricia@dwsscouter.com",
        team: "Time Omega", teamId: "t2",
        creditsReceived: 1500, creditsDistributed: 1200, creditsUsed: 450,
        webscoutersCount: 2, leadsTotal: 85, leadsApproached: 62,
        leadsConverted: 6, responseRate: 38, conversionRate: 9.7,
        status: "active", lastSeen: "há 2h"
    },
    {
        id: "v3", name: "Rodrigo Faria", email: "rodrigo@dwsscouter.com",
        team: "Time Nexus", teamId: "t3",
        creditsReceived: 800, creditsDistributed: 600, creditsUsed: 580,
        webscoutersCount: 1, leadsTotal: 44, leadsApproached: 38,
        leadsConverted: 2, responseRate: 22, conversionRate: 5.3,
        status: "warning", lastSeen: "há 1 dia"
    },
];

const MOCK_WEBSCOUTERS = [
    { id: "w1", name: "Rafaela Costa",  email: "rafaela@dwsscouter.com",  vendedorId: "v1", team: "Time Alpha", creditsReceived: 600, creditsUsed: 312, leadsTotal: 89,  leadsApproached: 67, leadsConverted: 8, responseRate: 42, conversionRate: 11.9, status: "active",  lastSeen: "há 5 min" },
    { id: "w2", name: "Bruno Matos",    email: "bruno@dwsscouter.com",    vendedorId: "v1", team: "Time Alpha", creditsReceived: 500, creditsUsed: 400, leadsTotal: 74,  leadsApproached: 58, leadsConverted: 5, responseRate: 38, conversionRate:  8.6, status: "active",  lastSeen: "há 1h"   },
    { id: "w3", name: "Camila Torres",  email: "camila@dwsscouter.com",   vendedorId: "v2", team: "Time Omega", creditsReceived: 700, creditsUsed: 250, leadsTotal: 51,  leadsApproached: 38, leadsConverted: 4, responseRate: 55, conversionRate: 10.5, status: "active",  lastSeen: "há 3h"   },
    { id: "w4", name: "Diego Alves",    email: "diego@dwsscouter.com",    vendedorId: "v2", team: "Time Omega", creditsReceived: 500, creditsUsed: 200, leadsTotal: 34,  leadsApproached: 24, leadsConverted: 2, responseRate: 28, conversionRate:  8.3, status: "warning", lastSeen: "há 3 dias"},
    { id: "w5", name: "Thiago Santos",  email: "thiago@dwsscouter.com",   vendedorId: "v3", team: "Time Nexus", creditsReceived: 600, creditsUsed: 580, leadsTotal: 44,  leadsApproached: 38, leadsConverted: 2, responseRate: 22, conversionRate:  5.3, status: "warning", lastSeen: "há 2 dias"},
];

export const userService = {
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as UserProfile;
        } catch (error) {
            console.warn("⚠️ Supabase: Falha ao carregar perfil do usuário real, usando perfil de desenvolvimento.");
            // Fallback safe based on demo users
            return null;
        }
    },

    async getSellers(): Promise<any[]> {
        try {
            // Fetch real sellers
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'vendedor');

            if (error) throw error;

            const sellersWithStats = await Promise.all(
                users.map(async (vendedor: any) => {
                    // Fetch webscouters under this seller
                    const { data: scouts } = await supabase
                        .from('users')
                        .select('id')
                        .eq('vendedor_id', vendedor.id);

                    const scoutIds = scouts?.map(s => s.id) || [];

                    // Fetch leads count
                    let leadsTotal = 0;
                    let leadsApproached = 0;
                    let leadsConverted = 0;

                    if (scoutIds.length > 0) {
                        const { data: leads } = await supabase
                            .from('leads')
                            .select('status')
                            .in('assigned_to', scoutIds);

                        leadsTotal = leads?.length || 0;
                        leadsApproached = leads?.filter(l => ['approached', 'in_conversation', 'selected', 'converted'].includes(l.status)).length || 0;
                        leadsConverted = leads?.filter(l => ['selected', 'converted'].includes(l.status)).length || 0;
                    }

                    // Fetch credits from credits table
                    const { data: creditInfo } = await supabase
                        .from('credits')
                        .select('balance, total_allocated, total_consumed')
                        .eq('user_id', vendedor.id)
                        .single();

                    const creditsReceived = creditInfo?.total_allocated || 2000;
                    const creditsUsed = creditInfo?.total_consumed || 0;

                    // Calculate distributed credits
                    let creditsDistributed = 0;
                    if (scoutIds.length > 0) {
                        const { data: scoutCredits } = await supabase
                            .from('credits')
                            .select('total_allocated')
                            .in('user_id', scoutIds);
                        creditsDistributed = scoutCredits?.reduce((sum, c) => sum + (c.total_allocated || 0), 0) || 0;
                    }

                    const conversionRate = leadsApproached > 0 ? Number(((leadsConverted / leadsApproached) * 100).toFixed(1)) : 0;

                    return {
                        id: vendedor.id,
                        name: vendedor.nome,
                        email: vendedor.email,
                        team: vendedor.team_id || "Time de Scouting",
                        webscoutersCount: scoutIds.length,
                        creditsReceived,
                        creditsDistributed,
                        creditsUsed,
                        leadsTotal,
                        leadsApproached,
                        leadsConverted,
                        conversionRate,
                        responseRate: 40, // Simulated rate or fetched from interactions
                        status: vendedor.status,
                        lastSeen: "ativo"
                    };
                })
            );

            if (sellersWithStats.length === 0) return MOCK_VENDEDORES;
            return sellersWithStats;
        } catch (error) {
            console.warn("⚠️ Supabase: Usando dados mockados para Vendedores.");
            return MOCK_VENDEDORES;
        }
    },

    async getWebscouters(vendedorId?: string): Promise<any[]> {
        try {
            let query = supabase.from('users').select('*').eq('role', 'webscouter');
            if (vendedorId) {
                query = query.eq('vendedor_id', vendedorId);
            }

            const { data: users, error } = await query;
            if (error) throw error;

            const webscoutersWithStats = await Promise.all(
                users.map(async (scout: any) => {
                    // Fetch leads count
                    const { data: leads } = await supabase
                        .from('leads')
                        .select('status')
                        .eq('assigned_to', scout.id);

                    const leadsTotal = leads?.length || 0;
                    const leadsApproached = leads?.filter(l => ['approached', 'in_conversation', 'selected', 'converted'].includes(l.status)).length || 0;
                    const leadsConverted = leads?.filter(l => ['selected', 'converted'].includes(l.status)).length || 0;
                    const conversionRate = leadsApproached > 0 ? Number(((leadsConverted / leadsApproached) * 100).toFixed(1)) : 0;

                    // Fetch credits from credits table
                    const { data: creditInfo } = await supabase
                        .from('credits')
                        .select('balance, total_allocated, total_consumed')
                        .eq('user_id', scout.id)
                        .single();

                    const creditsReceived = creditInfo?.total_allocated || 500;
                    const creditsUsed = creditInfo?.total_consumed || 0;

                    return {
                        id: scout.id,
                        name: scout.nome,
                        email: scout.email,
                        vendedorId: scout.vendedor_id,
                        team: "Time de Scouting",
                        creditsReceived,
                        creditsUsed,
                        leadsTotal,
                        leadsApproached,
                        leadsConverted,
                        conversionRate,
                        responseRate: 35, // Simulated response rate
                        status: scout.status,
                        lastSeen: "ativo"
                    };
                })
            );

            if (webscoutersWithStats.length === 0) {
                return vendedorId ? MOCK_WEBSCOUTERS.filter(w => w.vendedorId === vendedorId) : MOCK_WEBSCOUTERS;
            }
            return webscoutersWithStats;
        } catch (error) {
            console.warn("⚠️ Supabase: Usando dados mockados para Webscouters.");
            return vendedorId ? MOCK_WEBSCOUTERS.filter(w => w.vendedorId === vendedorId) : MOCK_WEBSCOUTERS;
        }
    },

    async createVendedor(data: any): Promise<any> {
        // 1. Supabase Auth signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    nome: data.name,
                    role: 'vendedor'
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao gerar conta.");

        // 2. Insert user record into public.users table (trigger handles this but reinforcement is safer)
        try {
            await supabase.from('users').insert([{
                id: authData.user.id,
                nome: data.name,
                email: data.email,
                role: 'vendedor',
                team_id: data.teamName,
                status: 'active'
            }]);

            // Set initial credits
            await supabase.from('credits').insert([{
                user_id: authData.user.id,
                balance: Number(data.initialCredits),
                total_allocated: Number(data.initialCredits)
            }]);
        } catch (e) {
            console.warn("Pre-existing profile setup complete via database trigger:", e);
        }

        return authData.user;
    },

    async createWebscouter(data: any): Promise<any> {
        // Get the active seller (creator)
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // 1. Supabase Auth signup for webscouter
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    nome: data.name,
                    role: 'webscouter'
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao gerar conta.");

        // 2. Insert user profile with vinculation
        try {
            await supabase.from('users').insert([{
                id: authData.user.id,
                nome: data.name,
                email: data.email,
                role: 'webscouter',
                vendedor_id: currentUser?.id,
                status: 'active'
            }]);

            // Set initial credits
            await supabase.from('credits').insert([{
                user_id: authData.user.id,
                balance: Number(data.initialCredits),
                total_allocated: Number(data.initialCredits)
            }]);
        } catch (e) {
            console.warn("Profile setup complete via trigger:", e);
        }

        return authData.user;
    }
};
