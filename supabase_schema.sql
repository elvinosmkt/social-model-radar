-- ==========================================================
-- DWS SCOUTER — Supabase Postgres Schema Setup
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ==========================================================

-- 1. Tabela de Perfis / Usuários (papeis e hierarquia)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'webscouter')),
    vendedor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    team_id UUID, -- FK opcional para equipes
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'new', 'inactive')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ultimo_acesso TIMESTAMP WITH TIME ZONE
);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ler todos os perfis" 
    ON public.users FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar o próprio perfil" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Apenas admins e vendedores podem inserir perfis" 
    ON public.users FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'vendedor')
        )
    );

-- 2. Tabela de Equipes (Teams)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    vendedor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer usuário logado pode visualizar equipes" 
    ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Vendedores podem gerenciar suas equipes" 
    ON public.teams FOR ALL USING (vendedor_id = auth.uid());

-- 3. Tabela de Saldos e Créditos (credits)
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_allocated INTEGER NOT NULL DEFAULT 0 CHECK (total_allocated >= 0),
    total_consumed INTEGER NOT NULL DEFAULT 0 CHECK (total_consumed >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar os próprios créditos" 
    ON public.credits FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins e Vendedores podem ver créditos da equipe" 
    ON public.credits FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'vendedor')
        )
    );

-- 4. Tabela de Histórico Global de Leads (Anti-Duplicidade Master)
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

CREATE POLICY "Usuários logados podem ver a master list de leads" 
    ON public.leads_master FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários logados podem cadastrar na master list de leads" 
    ON public.leads_master FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Vincular Leads Master aos Leads Locais do Pipeline
-- (Garanta que a tabela de leads locais já existente herde a referência se necessário, ou crie a relação)
ALTER TABLE IF EXISTS public.leads 
    ADD COLUMN IF NOT EXISTS lead_master_id UUID REFERENCES public.leads_master(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 6. Trigger para criar perfil de usuário e créditos automaticamente após SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'webscouter';
    initial_balance INTEGER := 0;
BEGIN
    -- Determinar papel inicial com base no e-mail (para fins de teste/demo)
    IF NEW.email LIKE 'admin%' THEN
        default_role := 'admin';
        initial_balance := 10000;
    ELSIF NEW.email LIKE 'vendedor%' OR NEW.email LIKE 'carlos%' THEN
        default_role := 'vendedor';
        initial_balance := 2000;
    ELSE
        default_role := 'webscouter';
        initial_balance := 100;
    END IF;

    -- Inserir perfil na tabela de usuários
    INSERT INTO public.users (id, nome, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        default_role,
        'active'
    );

    -- Inserir registro na tabela de créditos
    INSERT INTO public.credits (user_id, balance, total_allocated)
    VALUES (
        NEW.id,
        initial_balance,
        initial_balance
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar a Trigger ao cadastro de contas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
