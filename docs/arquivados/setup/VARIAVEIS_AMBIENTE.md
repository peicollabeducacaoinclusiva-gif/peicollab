# 🔐 Variáveis de Ambiente - PEI Collab Monorepo V3.0

## Template para .env.local

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# ============================================================================
# PEI COLLAB MONOREPO V3.0 - ENVIRONMENT VARIABLES
# ============================================================================

# ----------------------------------------------------------------------------
# SUPABASE (Obrigatório)
# ----------------------------------------------------------------------------
VITE_SUPABASE_URL=https://fximylewmvsllkdczovj.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Service Role Key (apenas para scripts backend)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# ----------------------------------------------------------------------------
# URLs DOS APPS (Produção)
# ----------------------------------------------------------------------------
VITE_PEI_COLLAB_URL=https://pei.seudominio.com
VITE_GESTAO_ESCOLAR_URL=https://gestao.seudominio.com
VITE_PLANO_AEE_URL=https://aee.seudominio.com
VITE_BLOG_URL=https://blog.seudominio.com

# ----------------------------------------------------------------------------
# URLs DOS APPS (Desenvolvimento)
# ----------------------------------------------------------------------------
# Descomente estas linhas para desenvolvimento local:
# VITE_PEI_COLLAB_URL=http://localhost:5173
# VITE_GESTAO_ESCOLAR_URL=http://localhost:5174
# VITE_PLANO_AEE_URL=http://localhost:5175
# VITE_BLOG_URL=http://localhost:5176

# ----------------------------------------------------------------------------
# API E CONFIGURAÇÕES
# ----------------------------------------------------------------------------
VITE_API_URL=https://fximylewmvsllkdczovj.supabase.co
VITE_DEBUG_MODE=false
VITE_OFFLINE_MODE=false

# ----------------------------------------------------------------------------
# NOTIFICAÇÕES PUSH (Opcional)
# ----------------------------------------------------------------------------
VITE_VAPID_PUBLIC_KEY=sua-vapid-public-key-aqui
VITE_VAPID_PRIVATE_KEY=sua-vapid-private-key-aqui

# ----------------------------------------------------------------------------
# OPENAI (Opcional - Para geração de PEIs com IA)
# ----------------------------------------------------------------------------
OPENAI_API_KEY=sua-openai-api-key-aqui

# ----------------------------------------------------------------------------
# ANALYTICS (Opcional)
# ----------------------------------------------------------------------------
VITE_VERCEL_ANALYTICS_ID=seu-analytics-id
VITE_GOOGLE_ANALYTICS_ID=seu-ga-id

# ----------------------------------------------------------------------------
# MONOREPO CONFIG
# ----------------------------------------------------------------------------
NODE_ENV=development
TURBO_TEAM=pei-collab
TURBO_TOKEN=seu-turbo-token
```

## Como Obter as Credenciais

### Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie:
   - **URL**: `VITE_SUPABASE_URL`
   - **anon/public key**: `VITE_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI (Opcional)

1. Acesse: https://platform.openai.com/
2. Vá em **API Keys**
3. Crie uma nova chave
4. Copie para `OPENAI_API_KEY`

### VAPID Keys (Opcional - Notificações Push)

```bash
# Gerar VAPID keys
npm run generate:vapid
```

## Variáveis por Ambiente

### Desenvolvimento Local

```env
NODE_ENV=development
VITE_DEBUG_MODE=true
VITE_PEI_COLLAB_URL=http://localhost:5173
VITE_GESTAO_ESCOLAR_URL=http://localhost:5174
VITE_PLANO_AEE_URL=http://localhost:5175
VITE_BLOG_URL=http://localhost:5176
```

### Staging

```env
NODE_ENV=staging
VITE_DEBUG_MODE=true
VITE_PEI_COLLAB_URL=https://pei-staging.seudominio.com
VITE_GESTAO_ESCOLAR_URL=https://gestao-staging.seudominio.com
VITE_PLANO_AEE_URL=https://aee-staging.seudominio.com
VITE_BLOG_URL=https://blog-staging.seudominio.com
```

### Produção

```env
NODE_ENV=production
VITE_DEBUG_MODE=false
VITE_PEI_COLLAB_URL=https://pei.seudominio.com
VITE_GESTAO_ESCOLAR_URL=https://gestao.seudominio.com
VITE_PLANO_AEE_URL=https://aee.seudominio.com
VITE_BLOG_URL=https://blog.seudominio.com
```

## Configuração na Vercel

Para cada app deployado na Vercel:

1. Acesse o projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione todas as variáveis necessárias
4. Selecione os ambientes (Production, Preview, Development)
5. Salve e faça redeploy

## Segurança ⚠️

### Nunca Commite:
- ❌ `.env.local`
- ❌ `.env`
- ❌ Qualquer arquivo com credenciais reais

### Sempre Use:
- ✅ `.env.example` (sem valores reais)
- ✅ `.gitignore` para excluir arquivos .env
- ✅ Variáveis de ambiente da Vercel/plataforma

## Variáveis Obrigatórias vs Opcionais

### ⚠️ Obrigatórias (Sistema não funciona sem)

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### 📋 Recomendadas (Para funcionalidades completas)

```env
SUPABASE_SERVICE_ROLE_KEY  # Para scripts backend
VITE_PEI_COLLAB_URL        # Para links entre apps
VITE_GESTAO_ESCOLAR_URL
VITE_PLANO_AEE_URL
VITE_BLOG_URL
```

### 🎁 Opcionais (Features extras)

```env
OPENAI_API_KEY             # Geração de PEIs com IA
VITE_VAPID_PUBLIC_KEY      # Push notifications
VITE_VAPID_PRIVATE_KEY
VITE_VERCEL_ANALYTICS_ID   # Analytics
VITE_GOOGLE_ANALYTICS_ID
```

## Troubleshooting

### Erro: "Supabase URL não configurada"

```bash
# Verifique se o arquivo .env.local existe
ls -la .env.local

# Verifique o conteúdo
cat .env.local | grep VITE_SUPABASE
```

### Erro: "Cannot read environment variables"

```bash
# Reinicie o servidor de desenvolvimento
pnpm dev
```

### Variáveis não são carregadas

1. Certifique-se que o arquivo é `.env.local` (não `.env`)
2. Reinicie o servidor após adicionar variáveis
3. Variáveis devem começar com `VITE_` para serem acessíveis no frontend

---

**Importante**: Mantenha suas credenciais seguras e nunca as compartilhe publicamente! 🔒

