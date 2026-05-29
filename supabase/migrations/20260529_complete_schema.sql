-- ==========================================================
-- DWS SCOUTER — UNIFIED DATABASE SCHEMA INITIALIZATION
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ==========================================================

-- 1. Criar Tabela de Usuários Públicos (Perfis)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'webscouter')),
    vendedor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    team_id UUID,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'new', 'inactive')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ultimo_acesso TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS para usuários
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Limpar e recriar políticas de RLS de usuários
DROP POLICY IF EXISTS "Usuários podem ler todos os perfis" ON public.users;
CREATE POLICY "Usuários podem ler todos os perfis" 
    ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar o próprio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil ou por Admins/Vendedores" ON public.users;
CREATE POLICY "Usuários podem atualizar próprio perfil ou por Admins/Vendedores" 
    ON public.users FOR UPDATE USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'vendedor'
        )
    );

-- 2. Criar Tabela de Equipes (Teams)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    vendedor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer usuário logado pode visualizar equipes" ON public.teams;
CREATE POLICY "Qualquer usuário logado pode visualizar equipes" 
    ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Vendedores podem gerenciar suas equipes" ON public.teams;
DROP POLICY IF EXISTS "Vendedores e Admins podem gerenciar equipes" ON public.teams;
CREATE POLICY "Vendedores e Admins podem gerenciar equipes" 
    ON public.teams FOR ALL USING (
        vendedor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Criar Tabela de Saldos e Créditos (Credits)
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_allocated INTEGER NOT NULL DEFAULT 0 CHECK (total_allocated >= 0),
    total_consumed INTEGER NOT NULL DEFAULT 0 CHECK (total_consumed >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem visualizar os próprios créditos" ON public.credits;
CREATE POLICY "Usuários podem visualizar os próprios créditos" 
    ON public.credits FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins e Vendedores podem ver créditos da equipe" ON public.credits;
CREATE POLICY "Admins e Vendedores podem ver créditos da equipe" 
    ON public.credits FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'vendedor')
        )
    );

DROP POLICY IF EXISTS "Admins e donos podem atualizar créditos" ON public.credits;
CREATE POLICY "Admins e donos podem atualizar créditos" 
    ON public.credits FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'vendedor')
        )
    );

-- 4. Criar Tabela de Histórico Global de Leads (Anti-Duplicidade Master)
CREATE TABLE IF NOT EXISTS public.leads_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL DEFAULT 'instagram',
    name TEXT,
    bio TEXT,
    followers INTEGER,
    following INTEGER,
    post_count INTEGER,
    email TEXT,
    phone TEXT,
    has_whatsapp BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    external_url TEXT,
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.leads_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários logados podem ver a master list de leads" ON public.leads_master;
CREATE POLICY "Usuários logados podem ver a master list de leads" 
    ON public.leads_master FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários logados podem cadastrar na master list de leads" ON public.leads_master;
CREATE POLICY "Usuários logados podem cadastrar na master list de leads" 
    ON public.leads_master FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Criar Tabela de Leads do Pipeline (Locais)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL DEFAULT 'instagram',
    platform_id TEXT,
    handle TEXT UNIQUE NOT NULL,
    name TEXT,
    bio TEXT,
    followers INTEGER,
    age_range TEXT,
    avatar_url TEXT,
    external_link TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    status TEXT DEFAULT 'new',
    niche TEXT,
    ai_summary TEXT,
    ai_characteristics TEXT,
    ai_score INTEGER,
    tags TEXT[],
    assigned_to UUID REFERENCES auth.users(id),
    lead_master_id UUID REFERENCES public.leads_master(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    vendedor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários logados podem ler leads" ON public.leads;
CREATE POLICY "Usuários logados podem ler leads" 
    ON public.leads FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários logados podem inserir leads" ON public.leads;
CREATE POLICY "Usuários logados podem inserir leads" 
    ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários logados podem atualizar leads" ON public.leads;
CREATE POLICY "Usuários logados podem atualizar leads" 
    ON public.leads FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Criar índices de performance nos leads
CREATE INDEX IF NOT EXISTS idx_leads_handle ON public.leads(handle);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- 6. Criar Tabela de Interações (interactions)
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    type TEXT, -- 'note', 'status_change', 'dm_sent', 'response_received'
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários logados podem ver interações" ON public.interactions;
CREATE POLICY "Usuários logados podem ver interações" 
    ON public.interactions FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários logados podem inserir interações" ON public.interactions;
CREATE POLICY "Usuários logados podem inserir interações" 
    ON public.interactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Criar Trigger de Cadastro de Novos Usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'webscouter';
    initial_balance INTEGER := 0;
    meta_role TEXT;
    meta_credits TEXT;
BEGIN
    meta_role := NEW.raw_user_meta_data->>'role';
    meta_credits := NEW.raw_user_meta_data->>'initial_credits';

    -- 1. Determinar o role
    IF meta_role IS NOT NULL AND meta_role IN ('admin', 'vendedor', 'webscouter') THEN
        default_role := meta_role;
    ELSIF NEW.email LIKE 'admin%' THEN
        default_role := 'admin';
    ELSIF NEW.email LIKE 'vendedor%' OR NEW.email LIKE 'carlos%' THEN
        default_role := 'vendedor';
    ELSE
        default_role := 'webscouter';
    END IF;

    -- 2. Determinar o saldo de créditos iniciais
    IF meta_credits IS NOT NULL THEN
        initial_balance := meta_credits::INTEGER;
    ELSIF default_role = 'admin' THEN
        initial_balance := 10000;
    ELSIF default_role = 'vendedor' THEN
        initial_balance := 2000;
    ELSE
        initial_balance := 100;
    END IF;

    -- Inserir perfil na tabela pública de usuários
    INSERT INTO public.users (id, nome, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        default_role,
        'active'
    )
    ON CONFLICT (id) DO UPDATE 
    SET role = EXCLUDED.role,
        nome = EXCLUDED.nome;

    -- Inserir registro na tabela pública de créditos
    INSERT INTO public.credits (user_id, balance, total_allocated)
    VALUES (
        NEW.id,
        initial_balance,
        initial_balance
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET balance = EXCLUDED.balance,
        total_allocated = EXCLUDED.total_allocated;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar a trigger de novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Criar/Resetar Administrador de Produção
DELETE FROM auth.users WHERE email = 'admin@dwsscouter.com';

INSERT INTO auth.users (
    id, 
    instance_id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    role, 
    aud, 
    confirmation_token, 
    email_change, 
    email_change_token_new, 
    recovery_token
)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@dwsscouter.com',
    crypt('DWS@2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"nome":"Administrador"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
);

-- 9. Função RPC segura para deletar usuários (apenas Admins)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Verificar se o executor é um administrador real
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem deletar usuários.';
    END IF;

    -- 2. Deletar da tabela auth.users (cascateia para public.users, public.credits, etc.)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
