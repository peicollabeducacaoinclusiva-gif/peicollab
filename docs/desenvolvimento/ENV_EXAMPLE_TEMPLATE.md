# .env.example - Template de Configuração

Copie este conteúdo para um arquivo `.env` na raiz do projeto.

```bash
# ============================================================================
# PEI COLLAB - CONFIGURAÇÕES DE AMBIENTE
# ============================================================================
# ⚠️ IMPORTANTE: NUNCA commite o arquivo .env no git
# ============================================================================

# SUPABASE - Configurações do Banco de Dados
VITE_SUPABASE_URL=https://[seu-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# OPENAI - Configuração da API para geração de conteúdo com IA
OPENAI_API_KEY=sua_openai_api_key_aqui

# Database URL (para scripts de migração)
DATABASE_URL=postgresql://postgres:[SUA_SENHA]@db.[project-ref].supabase.co:5432/postgres

# VAPID Keys (para notificações push - opcional)
VITE_VAPID_PUBLIC_KEY=sua_vapid_public_key_aqui
VITE_VAPID_PRIVATE_KEY=sua_vapid_private_key_aqui

# Application URLs
VITE_APP_URL=https://your-app.vercel.app
VITE_API_URL=https://[seu-project-ref].supabase.co

# Production flags
VITE_DEBUG_MODE=false
VITE_OFFLINE_MODE=false
```

## ⚠️ Notas de Segurança

1. **SUPABASE_SERVICE_ROLE_KEY**: ⚠️ MUITO SENSÍVEL - Use APENAS em scripts Node.js e Edge Functions
2. **OPENAI_API_KEY**: ⚠️ SENSÍVEL - Configure como secret no Supabase para Edge Functions
3. NUNCA commite o arquivo `.env` no git

