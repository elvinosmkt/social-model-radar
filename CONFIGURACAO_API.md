# 🔑 Guia de Configuração de Chaves de API

Este projeto requer **3 chaves de API** para funcionar corretamente. Siga os passos abaixo para configurá-las.

---

## 📋 Chaves Necessárias

### 1. **OpenAI API Key** (OBRIGATÓRIA)
**Finalidade:** Análise inteligente de perfis e processamento de prompts de scouting com GPT-4.

**Como obter:**
1. Acesse: https://platform.openai.com/api-keys
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave (começa com `sk-proj-...`)
5. **⚠️ IMPORTANTE:** Você precisará adicionar créditos na sua conta OpenAI

**Formato:**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 2. **Supabase** (OBRIGATÓRIA)
**Finalidade:** Banco de dados para armazenar leads e autenticação de usuários.

**Como obter:**
1. Acesse: https://app.supabase.com
2. Crie um novo projeto (ou use um existente)
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Formato:**
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Configuração adicional do Supabase:**
- Execute os scripts SQL da pasta `supabase/` para criar as tabelas necessárias
- Configure as políticas de segurança (RLS) conforme necessário

---

### 3. **Apify API Token** (OBRIGATÓRIA)
**Finalidade:** Scraping de perfis do Instagram para descoberta de modelos.

**Como obter:**
1. Acesse: https://console.apify.com/account/integrations
2. Crie uma conta gratuita (inclui $5 de crédito)
3. Vá em **Settings** → **Integrations**
4. Copie o **API Token** (começa com `apify_api_...`)

**Formato:**
```
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Atores do Apify utilizados:**
- `apify/instagram-profile-scraper` - Para buscar perfis específicos
- `apify/instagram-scraper` - Para descoberta por palavras-chave

---

## ⚙️ Como Configurar

### Passo 1: Criar arquivo `.env.local`
Na raiz do projeto, crie um arquivo chamado `.env.local`:

```bash
# No terminal (PowerShell)
Copy-Item .env.local.example .env.local
```

Ou crie manualmente o arquivo `.env.local` na raiz do projeto.

### Passo 2: Adicionar as chaves
Abra o arquivo `.env.local` e substitua os valores de exemplo pelas suas chaves reais:

```env
OPENAI_API_KEY=sua-chave-openai-aqui
NEXT_PUBLIC_SUPABASE_URL=sua-url-supabase-aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-supabase-aqui
APIFY_API_TOKEN=seu-token-apify-aqui
```

### Passo 3: Reiniciar o servidor
Se o servidor já estiver rodando, reinicie-o para carregar as novas variáveis:

```bash
# Pare o servidor (Ctrl+C) e execute novamente:
npm run dev
```

---

## 🔒 Segurança

- ✅ O arquivo `.env.local` já está no `.gitignore` - suas chaves **NÃO** serão commitadas
- ❌ **NUNCA** compartilhe suas chaves de API publicamente
- ❌ **NUNCA** faça commit de arquivos `.env.local` no Git
- ✅ Use `.env.local.example` como referência (sem chaves reais)

---

## 🧪 Verificar Configuração

Após configurar, você pode testar se as APIs estão funcionando:

1. **OpenAI:** Tente fazer uma análise de perfil na interface
2. **Supabase:** Verifique se os leads são salvos no banco
3. **Apify:** Faça uma busca por modelos usando o prompt de scouting

---

## 💰 Custos Estimados

| Serviço | Plano Gratuito | Custo Estimado |
|---------|----------------|----------------|
| **OpenAI** | $5 de crédito inicial | ~$0.01-0.05 por análise (GPT-4o) |
| **Supabase** | 500MB DB + 2GB bandwidth | Gratuito para projetos pequenos |
| **Apify** | $5 de crédito inicial | ~$0.10-0.50 por 100 perfis |

**Estimativa total para testes:** Gratuito com os créditos iniciais

---

## ❓ Problemas Comuns

### "OPENAI_API_KEY não configurado"
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Confirme que a chave começa com `sk-proj-` ou `sk-`
- Reinicie o servidor de desenvolvimento

### "Configuração ausente: APIFY_API_TOKEN"
- Verifique se adicionou o token no `.env.local`
- Confirme que o token começa com `apify_api_`
- Verifique se tem créditos na conta Apify

### "Supabase connection error"
- Confirme que a URL está correta (deve terminar com `.supabase.co`)
- Verifique se a chave anon é a correta (é uma string JWT longa)
- Confirme que o projeto Supabase está ativo

---

## 📞 Suporte

Se tiver problemas com a configuração:
1. Verifique se todas as 3 chaves estão no `.env.local`
2. Confirme que não há espaços extras antes/depois das chaves
3. Reinicie o servidor após qualquer alteração
4. Verifique os logs do console para mensagens de erro específicas
