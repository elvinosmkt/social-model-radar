-- ==========================================================
-- DWS SCOUTER — REAL DATABASE SEED DATA SCRIPT
-- Execute este script no SQL Editor do seu painel do Supabase.
-- ==========================================================

-- 1. LIMPAR REGISTROS ANTERIORES PARA EVITAR CONFLITOS DE IDS E EMAILS
DELETE FROM auth.users WHERE email IN (
    'carlos@dwsscouter.com', 'patricia@dwsscouter.com', 'rodrigo@dwsscouter.com',
    'rafaela@dwsscouter.com', 'bruno@dwsscouter.com', 'camila@dwsscouter.com', 
    'diego@dwsscouter.com', 'thiago@dwsscouter.com'
);

-- 2. CADASTRAR VENDEDORES E WEBSCOUTERS NO AUTH DO SUPABASE
-- Vendedores
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
('c1c1c1c1-1111-1111-1111-111111111111', 'carlos@dwsscouter.com', crypt('vendedor123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Carlos Mendes"}', now(), now(), 'authenticated', 'authenticated'),
('p2p2p2p2-2222-2222-2222-222222222222', 'patricia@dwsscouter.com', crypt('vendedor123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Patricia Lima"}', now(), now(), 'authenticated', 'authenticated'),
('r3r3r3r3-3333-3333-3333-333333333333', 'rodrigo@dwsscouter.com', crypt('vendedor123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Rodrigo Faria"}', now(), now(), 'authenticated', 'authenticated');

-- Webscouters
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
('w1w1w1w1-1111-1111-1111-111111111111', 'rafaela@dwsscouter.com', crypt('scout123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Rafaela Costa"}', now(), now(), 'authenticated', 'authenticated'),
('w2w2w2w2-2222-2222-2222-222222222222', 'bruno@dwsscouter.com', crypt('scout123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Bruno Matos"}', now(), now(), 'authenticated', 'authenticated'),
('w3w3w3w3-3333-3333-3333-333333333333', 'camila@dwsscouter.com', crypt('scout123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Camila Torres"}', now(), now(), 'authenticated', 'authenticated'),
('w4w4w4w4-4444-4444-4444-444444444444', 'diego@dwsscouter.com', crypt('scout123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Diego Alves"}', now(), now(), 'authenticated', 'authenticated'),
('w5w5w5w5-5555-5555-5555-555555555555', 'thiago@dwsscouter.com', crypt('scout123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"nome":"Thiago Santos"}', now(), now(), 'authenticated', 'authenticated');

-- 3. CRIAR EQUIPES NA TABELA PUBLIC.TEAMS
INSERT INTO public.teams (id, nome, vendedor_id)
VALUES 
('t1t1t1t1-1111-1111-1111-111111111111', 'Time Alpha', 'c1c1c1c1-1111-1111-1111-111111111111'),
('t2t2t2t2-2222-2222-2222-222222222222', 'Time Omega', 'p2p2p2p2-2222-2222-2222-222222222222'),
('t3t3t3t3-3333-3333-3333-333333333333', 'Time Nexus', 'r3r3r3r3-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- 4. AJUSTAR RELACIONAMENTOS, NOMES E TIMINGS NA TABELA PUBLIC.USERS
-- (O trigger handle_new_user ja criou as linhas, agora adicionamos as vinculações)
UPDATE public.users SET nome = 'Carlos Mendes', team_id = 't1t1t1t1-1111-1111-1111-111111111111' WHERE id = 'c1c1c1c1-1111-1111-1111-111111111111';
UPDATE public.users SET nome = 'Patricia Lima', team_id = 't2t2t2t2-2222-2222-2222-222222222222' WHERE id = 'p2p2p2p2-2222-2222-2222-222222222222';
UPDATE public.users SET nome = 'Rodrigo Faria', team_id = 't3t3t3t3-3333-3333-3333-333333333333' WHERE id = 'r3r3r3r3-3333-3333-3333-333333333333';

-- Vinculações de Webscouters com seus Vendedores e equipes
UPDATE public.users SET nome = 'Rafaela Costa', vendedor_id = 'c1c1c1c1-1111-1111-1111-111111111111', team_id = 't1t1t1t1-1111-1111-1111-111111111111' WHERE id = 'w1w1w1w1-1111-1111-1111-111111111111';
UPDATE public.users SET nome = 'Bruno Matos', vendedor_id = 'c1c1c1c1-1111-1111-1111-111111111111', team_id = 't1t1t1t1-1111-1111-1111-111111111111' WHERE id = 'w2w2w2w2-2222-2222-2222-222222222222';
UPDATE public.users SET nome = 'Camila Torres', vendedor_id = 'p2p2p2p2-2222-2222-2222-222222222222', team_id = 't2t2t2t2-2222-2222-2222-222222222222' WHERE id = 'w3w3w3w3-3333-3333-3333-333333333333';
UPDATE public.users SET nome = 'Diego Alves', vendedor_id = 'p2p2p2p2-2222-2222-2222-222222222222', team_id = 't2t2t2t2-2222-2222-2222-222222222222' WHERE id = 'w4w4w4w4-4444-4444-4444-444444444444';
UPDATE public.users SET nome = 'Thiago Santos', vendedor_id = 'r3r3r3r3-3333-3333-3333-333333333333', team_id = 't3t3t3t3-3333-3333-3333-333333333333' WHERE id = 'w5w5w5w5-5555-5555-5555-555555555555';

-- 5. AJUSTAR CRÉDITOS NA TABELA PUBLIC.CREDITS
-- Carlos Mendes (2000 recebidos, 1100 alocados a equipe = balance de 900)
UPDATE public.credits SET balance = 900, total_allocated = 2000, total_consumed = 0 WHERE user_id = 'c1c1c1c1-1111-1111-1111-111111111111';
-- Patricia Lima (1500 recebidos, 1200 alocados a equipe = balance de 300)
UPDATE public.credits SET balance = 300, total_allocated = 1500, total_consumed = 0 WHERE user_id = 'p2p2p2p2-2222-2222-2222-222222222222';
-- Rodrigo Faria (800 recebidos, 600 alocados a equipe = balance de 200)
UPDATE public.credits SET balance = 200, total_allocated = 800, total_consumed = 0 WHERE user_id = 'r3r3r3r3-3333-3333-3333-333333333333';

-- Webscouters (recebem do vendedor)
UPDATE public.credits SET balance = 288, total_allocated = 600, total_consumed = 312 WHERE user_id = 'w1w1w1w1-1111-1111-1111-111111111111';
UPDATE public.credits SET balance = 100, total_allocated = 500, total_consumed = 400 WHERE user_id = 'w2w2w2w2-2222-2222-2222-222222222222';
UPDATE public.credits SET balance = 450, total_allocated = 700, total_consumed = 250 WHERE user_id = 'w3w3w3w3-3333-3333-3333-333333333333';
UPDATE public.credits SET balance = 300, total_allocated = 500, total_consumed = 200 WHERE user_id = 'w4w4w4w4-4444-4444-4444-444444444444';
UPDATE public.credits SET balance = 20, total_allocated = 600, total_consumed = 580 WHERE user_id = 'w5w5w5w5-5555-5555-5555-555555555555';

-- 6. CRIAR LEADS REAIS NA TABELA PUBLIC.LEADS (Associados a equipes, vendedores e scouters)
DELETE FROM public.leads;

INSERT INTO public.leads (platform, handle, name, followers, status, niche, ai_score, assigned_to, vendedor_id, team_id, created_at)
VALUES 
('instagram', 'julia_models', 'Julia Silveira', 42000, 'converted', 'Fashion', 94, 'w1w1w1w1-1111-1111-1111-111111111111', 'c1c1c1c1-1111-1111-1111-111111111111', 't1t1t1t1-1111-1111-1111-111111111111', now() - interval '2 days'),
('instagram', 'isadora_fit', 'Isadora Guedes', 12500, 'converted', 'Fitness', 88, 'w1w1w1w1-1111-1111-1111-111111111111', 'c1c1c1c1-1111-1111-1111-111111111111', 't1t1t1t1-1111-1111-1111-111111111111', now() - interval '3 days'),
('instagram', 'clara_style', 'Ana Clara Cruz', 28000, 'in_conversation', 'Beauty', 91, 'w1w1w1w1-1111-1111-1111-111111111111', 'c1c1c1c1-1111-1111-1111-111111111111', 't1t1t1t1-1111-1111-1111-111111111111', now() - interval '1 day'),
('instagram', 'larissa.agency', 'Larissa Mendes', 51000, 'approached', 'Fashion', 96, 'w1w1w1w1-1111-1111-1111-111111111111', 'c1c1c1c1-1111-1111-1111-111111111111', 't1t1t1t1-1111-1111-1111-111111111111', now()),

('instagram', 'beatriz_fit', 'Beatriz Santos', 18200, 'converted', 'Fitness', 90, 'w2w2w2w2-2222-2222-2222-222222222222', 'c1c1c1c1-1111-1111-1111-111111111111', 't1t1t1t1-1111-1111-1111-111111111111', now() - interval '4 days'),
('instagram', 'carol.mendes', 'Carol Mendes', 33500, 'in_conversation', 'Lifestyle', 92, 'w2w2w2w2-2222-2222-2222-222222222222', 'c1c1c1c1-1111-1111-1111-111111111111', 't1t1t1t1-1111-1111-1111-111111111111', now() - interval '5 hours'),

('instagram', 'lorena_beauty', 'Lorena Lima', 64000, 'converted', 'Beauty', 95, 'w3w3w3w3-3333-3333-3333-333333333333', 'p2p2p2p2-2222-2222-2222-222222222222', 't2t2t2t2-2222-2222-2222-222222222222', now() - interval '1 day'),
('instagram', 'patricia.scout', 'Paty Souza', 8900, 'approached', 'Lifestyle', 85, 'w3w3w3w3-3333-3333-3333-333333333333', 'p2p2p2p2-2222-2222-2222-222222222222', 't2t2t2t2-2222-2222-2222-222222222222', now() - interval '2 days'),

('instagram', 'gabriela_m', 'Gabriela Matos', 22100, 'in_conversation', 'Fashion', 89, 'w4w4w4w4-4444-4444-4444-444444444444', 'p2p2p2p2-2222-2222-2222-222222222222', 't2t2t2t2-2222-2222-2222-222222222222', now() - interval '12 hours'),
('instagram', 'leticia.scout', 'Leticia Cruz', 14000, 'new', 'Fashion', 91, 'w4w4w4w4-4444-4444-4444-444444444444', 'p2p2p2p2-2222-2222-2222-222222222222', 't2t2t2t2-2222-2222-2222-222222222222', now()),

('instagram', 'vivian.models', 'Vivian Faria', 48000, 'converted', 'Beauty', 97, 'w5w5w5w5-5555-5555-5555-555555555555', 'r3r3r3r3-3333-3333-3333-333333333333', 't3t3t3t3-3333-3333-3333-333333333333', now() - interval '3 days'),
('instagram', 'renata_viana', 'Renata Viana', 95000, 'approached', 'Fashion', 98, 'w5w5w5w5-5555-5555-5555-555555555555', 'r3r3r3r3-3333-3333-3333-333333333333', 't3t3t3t3-3333-3333-3333-333333333333', now() - interval '2 days');
