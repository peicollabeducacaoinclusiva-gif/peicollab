# Migrações de Consolidação - LGPD

**Data:** 28/01/2025  
**Status:** ✅ **Migrations Criadas**

---

## 📋 RESUMO

Criadas migrations para consolidar tabelas duplicadas e padronizar uso de LGPD no sistema.

---

## ✅ MIGRATIONS CRIADAS

### 1. `20250228000001_consolidate_consents.sql`

**Objetivo:** Consolidar `data_consents` → `consents`

**Ações:**
- ✅ Migra todos os dados de `data_consents` para `consents`
- ✅ Mantém metadata com informações da origem
- ✅ Cria view de compatibilidade `data_consents_view`
- ✅ Marca `data_consents` como DEPRECATED
- ✅ Cria trigger de aviso para novos inserts

**Como Aplicar:**
```sql
-- Aplicar via Supabase CLI ou Dashboard
supabase migration up 20250228000001_consolidate_consents
```

**Pós-Migração:**
- Atualizar código para usar apenas `consents`
- Remover referências a `data_consents` (após período de transição)

---

### 2. `20250228000002_consolidate_audit.sql`

**Objetivo:** Consolidar `audit_log` e `audit_logs` → `audit_events`

**Ações:**
- ✅ Migra dados de `audit_log` para `audit_events`
- ✅ Migra dados de `audit_logs` para `audit_events`
- ✅ Normaliza estrutura de dados
- ✅ Cria view de compatibilidade `audit_log_compat`
- ✅ Marca tabelas antigas como DEPRECATED

**Como Aplicar:**
```sql
-- Aplicar via Supabase CLI ou Dashboard
supabase migration up 20250228000002_consolidate_audit
```

**Pós-Migração:**
- Atualizar código para usar apenas `audit_events`
- Instrumentar serviços para gravar em `audit_events`

---

## 🔍 VALIDAÇÕES PÓS-MIGRAÇÃO

### Consentimentos
```sql
-- Verificar dados migrados
SELECT COUNT(*) FROM consents WHERE metadata->>'source' = 'data_consents_migration';

-- Verificar compatibilidade
SELECT COUNT(*) FROM data_consents_view;
```

### Auditoria
```sql
-- Verificar dados migrados
SELECT COUNT(*) FROM audit_events WHERE metadata->>'source' IN ('audit_log_migration', 'audit_logs_migration');

-- Verificar compatibilidade
SELECT COUNT(*) FROM audit_log_compat;
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Backup:** Sempre fazer backup antes de aplicar migrations
2. **Horário:** Aplicar em horário de baixo tráfego
3. **Teste:** Testar em ambiente de staging primeiro
4. **Monitoramento:** Monitorar logs após aplicação

---

**Status:** ✅ **Pronto para aplicação**

