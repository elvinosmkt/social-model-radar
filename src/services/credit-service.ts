import { supabase } from "@/lib/supabase/client";

export interface UserCredits {
    balance: number;
    total_allocated: number;
    total_consumed: number;
}

export const creditService = {
    async getUserCredits(userId: string): Promise<UserCredits> {
        try {
            const { data, error } = await supabase
                .from('credits')
                .select('balance, total_allocated, total_consumed')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data as UserCredits;
        } catch (error) {
            console.warn("⚠️ Supabase: Falha ao buscar créditos reais.", error);
            return {
                balance: 0,
                total_allocated: 0,
                total_consumed: 0
            };
        }
    },

    async distributeCredits(vendedorId: string, webscouterId: string, amount: number): Promise<void> {
        try {
            // 1. Get current balance of seller
            const { data: sellerCredits, error: err1 } = await supabase
                .from('credits')
                .select('balance')
                .eq('user_id', vendedorId)
                .single();

            if (err1) throw err1;
            if ((sellerCredits?.balance || 0) < amount) {
                throw new Error("Saldo de créditos insuficiente para realizar a distribuição.");
            }

            // 2. Perform transactional updates (deduct from seller, add to webscouter)
            const { error: err2 } = await supabase
                .from('credits')
                .update({ 
                    balance: sellerCredits.balance - amount 
                })
                .eq('user_id', vendedorId);

            if (err2) throw err2;

            const { data: scoutCredits, error: err3 } = await supabase
                .from('credits')
                .select('balance, total_allocated')
                .eq('user_id', webscouterId)
                .single();

            if (err3) throw err3;

            const { error: err4 } = await supabase
                .from('credits')
                .update({
                    balance: (scoutCredits?.balance || 0) + amount,
                    total_allocated: (scoutCredits?.total_allocated || 0) + amount,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', webscouterId);

            if (err4) throw err4;
        } catch (error: any) {
            console.error("Failed to distribute credits in database:", error);
            throw new Error(error.message || "Falha na transação de créditos do Supabase.");
        }
    },

    async consumeCredits(userId: string, amount: number): Promise<void> {
        try {
            const { data: credits, error: err1 } = await supabase
                .from('credits')
                .select('balance, total_consumed')
                .eq('user_id', userId)
                .single();

            if (err1) throw err1;
            if ((credits?.balance || 0) < amount) {
                throw new Error("Créditos insuficientes para executar a captação.");
            }

            const { error: err2 } = await supabase
                .from('credits')
                .update({
                    balance: credits.balance - amount,
                    total_consumed: (credits.total_consumed || 0) + amount,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId);

            if (err2) throw err2;
        } catch (error: any) {
            console.error("❌ Erro no controle de créditos:", error.message);
            // Propagate insufficient credits and connection issues to caller
            throw error;
        }
    }
};
