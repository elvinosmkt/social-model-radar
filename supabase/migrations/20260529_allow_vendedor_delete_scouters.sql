-- ==========================================================
-- DWS SCOUTER — ALLOW VENDEDORES TO DELETE THEIR OWN SCOUTERS
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ==========================================================

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    executor_role TEXT;
    scouter_vendedor_id UUID;
BEGIN
    -- 1. Obter papel (role) de quem está executando a função
    SELECT role INTO executor_role FROM public.users WHERE id = auth.uid();

    -- 2. Obter o vendedor_id do usuário que será deletado
    SELECT vendedor_id INTO scouter_vendedor_id FROM public.users WHERE id = target_user_id;

    -- 3. Validar permissões: Permitido se for Admin OR se for o Vendedor do Scouter alvo
    IF (executor_role = 'admin') OR (auth.uid() = scouter_vendedor_id) THEN
        -- Deletar da tabela auth.users (cascateia para public.users, public.credits, etc.)
        DELETE FROM auth.users WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Você não tem permissões para remover este scouter.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
