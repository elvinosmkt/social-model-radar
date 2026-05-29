import { supabase } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";

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

                    const creditsReceived = creditInfo?.total_allocated ?? 0;
                    const creditsUsed = creditInfo?.total_consumed ?? 0;

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

                    // Fetch team name dynamically instead of showing the UUID
                    const { data: teamInfo } = await supabase
                        .from('teams')
                        .select('nome')
                        .eq('vendedor_id', vendedor.id)
                        .maybeSingle();

                    const teamName = teamInfo?.nome || "Time de Scouting";

                    return {
                        id: vendedor.id,
                        name: vendedor.nome,
                        email: vendedor.email,
                        team: teamName,
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

            return sellersWithStats;
        } catch (error) {
            console.warn("⚠️ Supabase: Falha ao buscar vendedores reais.", error);
            return [];
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

                    const creditsReceived = creditInfo?.total_allocated ?? 0;
                    const creditsUsed = creditInfo?.total_consumed ?? 0;

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

            return webscoutersWithStats;
        } catch (error) {
            console.warn("⚠️ Supabase: Falha ao buscar webscouters reais.", error);
            return [];
        }
    },

    async createVendedor(data: any): Promise<any> {
        // 1. Supabase Auth signup using temporary non-persisting client
        const tempSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    nome: data.name,
                    role: 'vendedor',
                    initial_credits: Number(data.initialCredits)
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao gerar conta.");

        // At this point, public.users and public.credits profiles are automatically created by the trigger handle_new_user()
        // with the correct role ('vendedor') and initial_credits.

        try {
            // 2. Insert the Team in public.teams table
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .insert([{
                    nome: data.teamName,
                    vendedor_id: authData.user.id
                }])
                .select()
                .single();

            if (teamError) throw teamError;

            // 3. Link the Vendedor to this team by updating team_id in public.users
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({ team_id: teamData.id })
                .eq('id', authData.user.id);

            if (userUpdateError) throw userUpdateError;

            // 4. Deduct initial credits from Admin's balance
            const initialCredits = Number(data.initialCredits);
            if (initialCredits > 0) {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    const { data: adminCredits, error: creditsError } = await supabase
                        .from('credits')
                        .select('balance')
                        .eq('user_id', currentUser.id)
                        .single();

                    if (!creditsError && adminCredits) {
                        const { error: deductError } = await supabase
                            .from('credits')
                            .update({
                                balance: adminCredits.balance - initialCredits
                            })
                            .eq('user_id', currentUser.id);
                        if (deductError) console.error("Error deducting admin balance:", deductError);
                    }
                }
            }

        } catch (dbErr: any) {
            console.error("Erro ao configurar equipe/perfis no banco:", dbErr);
            throw new Error(`Cadastro no Auth foi feito, mas falhou ao configurar perfil/equipe: ${dbErr.message}`);
        }

        return authData.user;
    },

    async createWebscouter(data: any): Promise<any> {
        // Get the active seller (creator)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error("Usuário não autenticado.");

        // Get the seller's profile to find their team_id
        const { data: sellerProfile, error: profileError } = await supabase
            .from('users')
            .select('team_id')
            .eq('id', currentUser.id)
            .single();

        if (profileError || !sellerProfile) {
            throw new Error("Erro ao carregar perfil do vendedor atual para vincular equipe.");
        }

        // 1. Supabase Auth signup for webscouter using temporary non-persisting client
        const tempSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    nome: data.name,
                    role: 'webscouter',
                    initial_credits: Number(data.initialCredits)
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Erro ao gerar conta.");

        // At this point, public.users and public.credits profiles are automatically created by the trigger handle_new_user()
        // with the correct role ('webscouter') and initial_credits.

        try {
            // 2. Insert user profile vinculation (vendedor_id and team_id)
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    vendedor_id: currentUser.id,
                    team_id: sellerProfile.team_id
                })
                .eq('id', authData.user.id);

            if (updateError) throw updateError;

            // 3. Deduct initial credits from Vendedor's balance
            const initialCredits = Number(data.initialCredits);
            if (initialCredits > 0) {
                const { data: sellerCredits, error: creditsError } = await supabase
                    .from('credits')
                    .select('balance')
                    .eq('user_id', currentUser.id)
                    .single();
                
                if (creditsError) throw creditsError;
                if ((sellerCredits?.balance || 0) < initialCredits) {
                    throw new Error("Saldo do vendedor insuficiente para alocar créditos iniciais.");
                }

                const { error: deductError } = await supabase
                    .from('credits')
                    .update({
                        balance: sellerCredits.balance - initialCredits
                    })
                    .eq('user_id', currentUser.id);

                if (deductError) throw deductError;
            }

        } catch (dbErr: any) {
            console.error("Erro ao vincular webscouter à equipe:", dbErr);
            throw new Error(`Cadastro no Auth foi feito, mas falhou ao vincular à equipe: ${dbErr.message}`);
        }

        return authData.user;
    },

    async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase.rpc('delete_user', { target_user_id: userId });
        if (error) throw error;
    }
};
