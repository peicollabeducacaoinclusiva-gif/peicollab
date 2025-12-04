# Aplicação das Migrations de Consolidação

**Data:** 28/01/2025  
**Status:** ✅ **Pronto para Aplicação**

---

## 📋 RESUMO

Migrations criadas e ajustadas para serem idempotentes e seguras. As migrations verificam se as tabelas existem antes de tentar migrar dados.

---

## ✅ MIGRATIONS CRIADAS

### 1. `20250228000001_consolidate_consents.sql`

**Objetivo:** Consolidar `data_consents` → `consents`

**Características:**
- ✅ Idempotente: verifica se tabelas existem antes de migrar
- ✅ Não quebra se tabelas não existirem
- ✅ Cria view de compatibilidade
- ✅ Marca tabela antiga como DEPRECATED

**Ordem de Aplicação:**
1. Primeiro aplicar: `20251127112858_create_consent_system.sql` (cria tabela `consents`)
2. Depois aplicar: `20250228000001_consolidate_consents.sql` (migra dados)

---

### 2. `20250228000002_consolidate_audit.sql`

**Objetivo:** Consolidar `audit_log` e `audit_logs` → `audit_events`

**Características:**
- ✅ Idempotente: verifica se tabelas existem antes de migrar
- ✅ Migra de ambas as tabelas antigas
- ✅ Cria view de compatibilidade
- ✅ Marca tabelas antigas como DEPRECATED

**Ordem de Aplicação:**
1. Primeiro aplicar: `20251127112538_create_audit_system.sql` (cria tabela `audit_events`)
2. Depois aplicar: `20250228000002_consolidate_audit.sql` (migra dados)

---

## 🔧 MIDDLEWARE DE AUDITORIA CRIADO

### Arquivo: `packages/database/src/audit/auditMiddleware.ts`

**Funcionalidades:**
- ✅ `logEvent()` - Grava evento genérico
- ✅ `logCreate()` - Helper para criação
- ✅ `logUpdate()` - Helper para atualização
- ✅ `logDelete()` - Helper para exclusão
- ✅ `logRead()` - Helper para leitura
- ✅ `logExport()` - Helper para export
- ✅ `logAnonymize()` - Helper para anonimização
- ✅ `withAudit()` - Wrapper para instrumentar funções

**Uso:**
```typescript
import { auditMiddleware } from '@pei/database/audit';

// Em serviços críticos
await auditMiddleware.logCreate(
  tenantId,
  'pei',
  peiId,
  { source: 'create_pei' }
);
```

---

## 🚀 JOB DE RETENÇÃO CRIADO

### Edge Function: `supabase/functions/apply-retention/index.ts`

**Funcionalidades:**
- ✅ Aplica regras de retenção para um tenant específico
- ✅ Suporta aplicar para todos os tenants (`forceAllTenants`)
- ✅ Suporta dry-run (simulação sem alterações)
- ✅ Retorna estatísticas detalhadas
- ✅ Trata erros gracefulmente

**Uso:**
```bash
# Aplicar para um tenant
curl -X POST https://your-project.supabase.co/functions/v1/apply-retention \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "uuid", "dryRun": false}'

# Aplicar para todos os tenants
curl -X POST https://your-project.supabase.co/functions/v1/apply-retention \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"forceAllTenants": true, "dryRun": false}'
```

**Agendamento (futuro):**
- Via Supabase Scheduler (pg_cron)
- Via GitHub Actions (agendado)
- Via cron externo

---

## 📝 VALIDAÇÕES ANTES DE APLICAR

### Verificar Tabelas Existentes
```sql
-- Verificar se tabelas existem
SELECT 
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consents') as consents_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'data_consents') as data_consents_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_events') as audit_events_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') as audit_log_exists,
    EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') as audit_logs_exists;
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. Aplicar Migrations Base (se não aplicadas)
```bash
# Verificar migrations aplicadas
supabase migration list

# Aplicar migrations base se necessário
supabase migration up 20251127112538_create_audit_system
supabase migration up 20251127112858_create_consent_system
```

### 2. Aplicar Migrations de Consolidação
```bash
# Aplicar consolidação de consentimentos
supabase migration up 20250228000001_consolidate_consents

# Aplicar consolidação de auditoria
supabase migration up 20250228000002_consolidate_audit
```

### 3. Deploy Edge Function
```bash
# Fazer deploy da Edge Function
supabase functions deploy apply-retention
```

### 4. Instrumentar Serviços com Auditoria
- Adicionar `auditMiddleware.logCreate/Update/Delete` em:
  - Serviços de PEI
  - Serviços de AEE
  - Serviços de Students
  - Serviços de Consentimentos

### 5. Configurar Agendamento
- Configurar cron/Supabase Scheduler para executar `apply-retention` periodicamente
- Recomendado: diariamente às 2h da manhã

---

**Status:** ✅ **Tudo criado e pronto. Aplicar migrations quando tabelas base existirem.**

