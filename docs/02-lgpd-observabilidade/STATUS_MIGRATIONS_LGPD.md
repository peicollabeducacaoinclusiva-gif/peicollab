# Status das Migrations LGPD

**Data:** 28/01/2025  
**Status:** 🟡 **AGUARDANDO APLICAÇÃO DAS MIGRATIONS BASE**

---

## 📋 MIGRATIONS BASE (PRÉ-REQUISITOS)

### ✅ Migration: `20251127112538_create_audit_system.sql`
**Status:** ⚠️ **PRECISA SER APLICADA PRIMEIRO**

**O que faz:**
- Cria a tabela `audit_events` (estrutura unificada de auditoria)
- Adiciona `tenant_id`, `entity_type`, `metadata` à tabela `audit_log` existente
- Cria RPC `log_audit_event` e `get_audit_events`
- Define RLS policies para `audit_events`

**Ordem:** Deve ser aplicada **ANTES** de `20250228000002_consolidate_audit.sql`

---

### ✅ Migration: `20251127112858_create_consent_system.sql`
**Status:** ⚠️ **PRECISA SER APLICADA PRIMEIRO**

**O que faz:**
- Cria a tabela `consents` (estrutura unificada de consentimentos)
- Adiciona `tenant_id` e `user_id` à tabela `data_consents` existente
- Cria tabela `consent_templates`
- Cria RPCs: `grant_consent`, `revoke_consent`, `check_consent`, `get_user_consents`
- Define RLS policies para `consents` e `consent_templates`

**Ordem:** Deve ser aplicada **ANTES** de `20250228000001_consolidate_consents.sql`

---

## 🔄 MIGRATIONS DE CONSOLIDAÇÃO

### ✅ Migration: `20250228000001_consolidate_consents.sql`
**Status:** ⏸️ **AGUARDANDO MIGRATION BASE**

**O que faz:**
- Migra dados de `data_consents` → `consents` (se ambas existirem)
- Cria view de compatibilidade `data_consents_view`
- Marca `data_consents` como DEPRECATED
- Cria trigger de aviso para uso de `data_consents`

**Pré-requisito:** `20251127112858_create_consent_system.sql` deve estar aplicada

**Idempotente:** ✅ Sim - verifica existência de tabelas antes de executar

---

### ✅ Migration: `20250228000002_consolidate_audit.sql`
**Status:** ⏸️ **AGUARDANDO MIGRATION BASE**

**O que faz:**
- Migra dados de `audit_log` → `audit_events` (se ambas existirem)
- Migra dados de `audit_logs` → `audit_events` (se ambas existirem)
- Cria view de compatibilidade `audit_log_compat`
- Marca `audit_log` e `audit_logs` como DEPRECATED

**Pré-requisito:** `20251127112538_create_audit_system.sql` deve estar aplicada

**Idempotente:** ✅ Sim - verifica existência de tabelas antes de executar

---

## 📝 ORDEM DE APLICAÇÃO RECOMENDADA

1. ✅ **Aplicar migration base de auditoria:**
   ```sql
   -- 20251127112538_create_audit_system.sql
   ```

2. ✅ **Aplicar migration base de consentimentos:**
   ```sql
   -- 20251127112858_create_consent_system.sql
   ```

3. ✅ **Aplicar migration de consolidação de consentimentos:**
   ```sql
   -- 20250228000001_consolidate_consents.sql
   ```

4. ✅ **Aplicar migration de consolidação de auditoria:**
   ```sql
   -- 20250228000002_consolidate_audit.sql
   ```

---

## ⚠️ ERROS ESPERADOS

Se você tentar aplicar as migrations de consolidação **ANTES** das migrations base, você verá:

```
ERROR: 42P01: relation "public.consents" does not exist
ERROR: 42P01: relation "public.audit_events" does not exist
```

**Solução:** Aplique as migrations base primeiro.

---

## ✅ VALIDAÇÃO

Após aplicar todas as migrations, verifique:

```sql
-- Verificar se consents existe
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'consents';

-- Verificar se audit_events existe
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'audit_events';

-- Verificar se as views de compatibilidade foram criadas
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('data_consents_view', 'audit_log_compat');
```

---

**Próximos passos:** Aplicar as migrations base primeiro, depois as de consolidação.

