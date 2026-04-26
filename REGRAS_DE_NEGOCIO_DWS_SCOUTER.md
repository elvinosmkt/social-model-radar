# DWS SCOUTER — Documento de Regras de Negócio
**Versão:** 1.0 — Para repasse ao programador back-end  
**Plataforma:** Digital Web Scouter  
**Stack front-end entregue:** Next.js 16 + React 19 + TypeScript + Tailwind v4 + Supabase (a conectar)

---

## 1. PAPÉIS E HIERARQUIA

### 1.1 Estrutura de Roles

```
ADM
 └── VENDEDOR (N vendedores por ADM)
      └── WEBSCOUTER (N webscoutersers por Vendedor)
```

| Role        | Descrição |
|-------------|-----------|
| **ADM**     | Acesso total. Gerencia vendedores, equipes, créditos globais, métricas consolidadas. |
| **VENDEDOR**| Tem um saldo de créditos de busca. Distribui créditos para seus webscoutersers. Vê métricas da própria equipe. Pode cadastrar e vincular webscoutersers. |
| **WEBSCOUTER** | Membro da equipe de um Vendedor. Usa créditos alocados pelo Vendedor. Realiza as captações e abordagens. |

---

## 2. AUTENTICAÇÃO E LOGIN

- Login único por e-mail + senha
- Após login, redirecionar conforme role:
  - `ADM` → `/admin`
  - `VENDEDOR` → `/dashboard` (visão vendedor)
  - `WEBSCOUTER` → `/dashboard` (visão webscouter)
- JWT com campo `role` no payload
- Sessão persistente (refresh token)
- Primeiro acesso com senha temporária (força troca)

---

## 3. SISTEMA DE CRÉDITOS

### 3.1 Fluxo de créditos

```
ADM define saldo global
    ↓
Vendedor recebe saldo (ex: 2.000 créditos/mês)
    ↓
Vendedor distribui para cada Webscouter (ex: 200 por webscouter)
    ↓
Cada busca de lead = consumo de N créditos (1 crédito por lead buscado)
    ↓
Se webscouter atingir o limite → busca bloqueada até Vendedor recarregar
```

### 3.2 Regras de limite
- Webscouter não pode iniciar uma busca se `créditos_disponíveis < quantidade_solicitada`
- Sistema exibe aviso antes de confirmar a busca: "Esta busca vai consumir X créditos. Você tem Y disponíveis."
- ADM pode ver consumo em tempo real de todos os vendedores e webscoutersers

### 3.3 Tabela `credits`
```sql
id, user_id, balance, total_allocated, total_consumed, updated_at
```

---

## 4. GESTÃO DE USUÁRIOS

### 4.1 Quem pode cadastrar quem

| Ator    | Pode cadastrar |
|---------|----------------|
| ADM     | Vendedor, Webscouter, vincular Webscouter a qualquer Vendedor |
| Vendedor| Webscouter (vinculado automaticamente à sua equipe) |
| Webscouter | Nenhum |

### 4.2 Campos do usuário
```
id, nome, email, senha_hash, role, vendedor_id (FK → vendedor),
team_id (FK → equipe), creditos_limite, creditos_usados, status (ativo/inativo),
criado_em, ultimo_acesso
```

### 4.3 Equipe (Time)
- Um Vendedor tem 1 equipe
- Equipe tem N Webscoutersers
- Tabela `teams`: `id, nome, vendedor_id, criado_em`
- Tabela `team_members`: `id, team_id, user_id, criado_em`

---

## 5. CAPTAÇÃO INTELIGENTE

### 5.1 Modos de busca

#### Modo 1 — Radar AI (Prompt)
- Usuário descreve o perfil em linguagem natural
- Parâmetros disponíveis na UI (enriquecem o prompt enviado à IA):
  - **País** (padrão: Brasil)
  - **Idioma** (padrão: Português)
  - **Nicho** (ex: Beleza, Moda, Fitness, etc.)
  - **Produto / Oferta** (ex: "curso de modelo para mulheres")
  - **Quantidade de leads** (slider 5–50)
- Prompt final enviado à IA: combinação do texto livre + filtros selecionados

#### Modo 2 — Look-alike (Similaridade) ⭐ PRIORIDADE ALTA
- Usuário insere um `@handle` do Instagram (perfil de cliente que já comprou, ou público-alvo)
- IA analisa o perfil de referência via Apify (scraping) + OpenAI
- Extrai: nicho, faixa etária, engajamento, estética, localização
- Busca perfis com "DNA semelhante"
- **Por que é ouro:** elimina a necessidade de descrever o cliente ideal — já existe um exemplo real

#### Futuro: Upload de perfil ideal
- Upload de foto ou URL do perfil de referência
- IA extrai características visuais e de conteúdo

### 5.2 Dados a captar por lead
```
handle, nome, bio, seguidores, engajamento, nicho, faixa_etária,
localização, email, telefone, tem_whatsapp_vinculado, avatar_url,
score_ia, resumo_ia, características_ia, plataforma
```

### 5.3 WhatsApp vinculado ao Instagram
- Verificar via Apify se o perfil tem número de WhatsApp na bio ou link
- Caso positivo: badge "WA" no card do lead + botão direto para abrir conversa (`wa.me/{número}`)
- Se tiver email: badge "EMAIL" no card

### 5.4 Exportar resultados
- Checkbox individual ou "Selecionar todos"
- Filtrar por score antes de exportar (ex: só score > 80)
- Botão "Exportar X para Pipeline" → move leads selecionados direto para coluna "Novos" do Pipeline
- Não consome créditos extras na exportação

---

## 6. PIPELINE (KANBAN)

### 6.1 Colunas (status)
```
Novos → Para Abordar → Abordados → Em Conversa → Selecionados → Convertidos / Descartados
```

### 6.2 Funcionalidades
- **Drag & drop** entre colunas (estilo Trello) — já implementado no front
- **Mudança de status** direto no card via dropdown — já implementado
- **Botão WhatsApp** no card se tiver número (`wa.me/`)
- **Abrir detalhe** do lead via clique
- Campos editáveis dentro do card/detalhe

### 6.3 Visibilidade
- Webscouter: vê apenas seus próprios leads
- Vendedor: vê leads de toda a equipe
- ADM: vê todos os leads de todos os vendedores

---

## 7. DETALHES DO LEAD (PAINEL LATERAL)

### 7.1 Abas

**Informações**
- Status atual + botões para mudar
- Stats rápidos: score, seguidores, nicho
- Análise da IA (resumo + características)
- Dados do perfil: plataforma, idade, localização
- Biografia captada

**Análise do Webscouter**
- Campo livre de texto para anotações pessoais
- Campos editáveis: nome, email, telefone
- Indicador de duplicidade: "Este perfil já está sendo trabalhado por [X]"

**Timeline**
- Registro cronológico de todas as ações:
  - Lead captado (data + score)
  - Mudança de status (de → para)
  - DM enviada (qual template)
  - Resposta recebida
  - Notas adicionadas pelo webscouter
- Campo para adicionar nova nota manualmente

---

## 8. ANTI-DUPLICIDADE (BANCO CRUZADO)

### 8.1 Regra central
> Um mesmo handle/perfil só pode estar sendo trabalhado por UM webscouter/equipe por vez.

### 8.2 Fluxo de verificação
```
1. Usuário vai captar ou adicionar lead ao pipeline
2. Sistema verifica em tabela global `leads_master` se o handle já existe
3. Se EXISTS e status ≠ 'lost' → bloqueia e exibe: "Este perfil já está na base. Vinculado a [Equipe X]."
4. Se EXISTS e status = 'lost' → permite reativar
5. Se NOT EXISTS → cria normalmente
```

### 8.3 Não consome créditos extras
- Se o lead já existe no banco (qualquer equipe/vendedor):
  - Sistema traz os dados do banco sem fazer nova busca via API
  - Nenhum crédito é debitado
  - Exibe badge "Da base" no card

### 8.4 Tabela `leads_master` (global)
```sql
id, handle, platform, name, bio, followers, email, phone,
has_whatsapp, avatar_url, last_scraped_at, created_at
```

### 8.5 Tabela `leads` (por equipe/webscouter)
```sql
id, lead_master_id (FK), webscouter_id, team_id, vendedor_id,
status, ai_score, ai_summary, ai_characteristics, ai_niche,
age_range, assigned_at, updated_at
```

---

## 9. MÉTRICAS E DASHBOARDS

### 9.1 Dashboard do Webscouter
- Leads captados (total e neste mês)
- Leads abordados
- Taxa de resposta (respostas / abordagens)
- Taxa de conversão (convertidos / abordados)
- Meta diária de abordagens vs. realizado
- Créditos usados / disponíveis

### 9.2 Dashboard do Vendedor
- Todas as métricas acima agregadas por webscouter da equipe
- Ranking interno de performance
- Leads por status (visão Kanban resumida)
- Consumo de créditos da equipe

### 9.3 Dashboard do ADM
- Métricas globais: todos os vendedores
- Por vendedor: leads, conversão, resposta, créditos consumidos
- Por equipe: idem
- Leads bloqueados por anti-duplicidade (quantos e quais)
- Gráficos: volume de captação por semana, funil de conversão

### 9.4 KPIs principais
| KPI | Fórmula |
|-----|---------|
| Taxa de Resposta | Respostas / DMs Enviadas × 100 |
| Taxa de Conversão | Convertidos / Abordados × 100 |
| Score Médio | Média dos ai_score dos leads captados |
| Custo por Lead | Créditos gastos / Leads captados |
| Eficiência | Convertidos / Créditos gastos |

---

## 10. TEMPLATES DE ABORDAGEM

- Templates de DM pré-definidos por ADM/Vendedor
- Variáveis dinâmicas: `{{handle}}`, `{{nome}}`, `{{nicho}}`, `{{produto}}`
- Webscouter seleciona e personaliza antes de enviar
- Todo envio registrado na timeline do lead

---

## 11. BANCO DE DADOS — RESUMO DAS TABELAS

```
users              → id, nome, email, senha, role, vendedor_id, team_id, credits_limit, credits_used
teams              → id, nome, vendedor_id
team_members       → id, team_id, user_id
credits            → id, user_id, balance, total_allocated, total_consumed
leads_master       → id, handle, platform, dados_gerais, last_scraped_at
leads              → id, lead_master_id, webscouter_id, team_id, vendedor_id, status, score, notas
interactions       → id, lead_id, user_id, type, content, created_at
dm_templates       → id, nome, content, created_by, is_global
duplicate_blocks   → id, handle, blocked_at, blocked_for_team_id, resolved_at
```

---

## 12. INTEGRAÇÕES NECESSÁRIAS

| Serviço | Uso |
|---------|-----|
| **Supabase** | Banco de dados + Auth |
| **Apify** | Scraping do Instagram (perfis, seguidores, WhatsApp na bio) |
| **OpenAI GPT-4o-mini** | Análise e score dos perfis, geração de filtros |
| **WhatsApp API** (futuro) | Envio de mensagens direto pela plataforma |

---

## 13. FLUXO COMPLETO DE USO

```
1. ADM cria Vendedor → define cota de créditos
2. Vendedor cria Webscouter → aloca créditos
3. Webscouter faz login → vê dashboard pessoal
4. Webscouter vai em Captação → configura filtros (país, idioma, nicho, produto)
5. Webscouter digita prompt ou coloca handle para look-alike
6. IA busca perfis → retorna resultados com score, dados de contato, badges WA/Email
7. Sistema verifica anti-duplicidade → filtra leads já existentes no banco
8. Webscouter seleciona leads e exporta para Pipeline
9. Créditos debitados apenas dos leads novos (não duplicados)
10. No Pipeline: lead aparece na coluna "Novos"
11. Webscouter arrasta para "Para Abordar" → manda DM pelo Instagram ou WhatsApp
12. Registra interação na Timeline do lead
13. Atualiza status conforme evolução
14. Vendedor acompanha métricas da equipe em tempo real
15. ADM vê performance consolidada de todas as equipes
```

---

## 14. PRIORIDADES DE DESENVOLVIMENTO (SUGESTÃO)

| Prioridade | Feature |
|------------|---------|
| 🔴 P0 | Auth completo (login, roles, JWT) |
| 🔴 P0 | Banco de dados (Supabase) — tabelas users, leads, interactions |
| 🔴 P0 | Sistema de créditos (saldo, limite, consumo) |
| 🔴 P0 | Anti-duplicidade (leads_master) |
| 🟠 P1 | Integração Apify (scraping real de perfis) |
| 🟠 P1 | Integração OpenAI (score + análise) |
| 🟠 P1 | Look-alike funcional |
| 🟡 P2 | Métricas em tempo real (Supabase Realtime) |
| 🟡 P2 | Templates de DM |
| 🟢 P3 | WhatsApp API |
| 🟢 P3 | Upload de perfil ideal (imagem) |

---

*Documento gerado para repasse ao desenvolvedor back-end — DWS Scouter / Antigravity Agency*
