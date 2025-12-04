# Configuração Completa - Sistema de Retenção ✅

**Data:** 28/01/2025  
**Status:** ✅ **MIGRATIONS APLICADAS E VALIDADAS**

---

## ✅ SISTEMA IMPLEMENTADO

### Tabelas
- ✅ `data_retention_rules` - Regras de retenção por tenant
- ✅ `retention_logs` - Logs de execuções

### Funções RPC
- ✅ `apply_retention_rules(p_tenant_id, p_dry_run)` - Aplica regras
- ✅ `execute_retention_for_tenant(p_tenant_id, p_dry_run)` - Wrapper
- ✅ `trigger_retention_for_all_tenants(p_dry_run)` - Todos os tenants
- ✅ `upsert_retention_rule(...)` - Gerenciar regras
- ✅ `get_retention_rules(p_tenant_id)` - Listar regras

### Views
- ✅ `retention_executions_summary` - Resumo por tenant

### Painel Web
- ✅ `/retention` - Dashboard de retenção

---

## 🔧 CONFIGURAR AGENDAMENTO

### Método Recomendado: Supabase Dashboard

1. **Acesse:** https://app.supabase.com/project/[seu-project-id]
2. **Vá para:** Database > Extensions > pg_cron
3. **Crie Cron Job:**
   - **Nome:** `daily-retention-job`
   - **Schedule:** `0 3 * * *` (diariamente às 3h UTC)
   - **SQL:** 
   ```sql
   SELECT "public"."trigger_retention_for_all_tenants"(false);
   ```

### Método Alternativo: Edge Function + HTTP

**URL da Edge Function:**
```
https://fximylewmvsllkdczovj.supabase.co/functions/v1/apply-retention
```

**Request:**
```bash
curl -X POST \
  "https://fximylewmvsllkdczovj.supabase.co/functions/v1/apply-retention" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "forceAllTenants": true,
    "dryRun": false
  }'
```

---

## 🧪 TESTAR

### Teste Rápido via SQL

```sql
-- Teste com dry_run (não executa de verdade)
SELECT "public"."trigger_retention_for_all_tenants"(true);
```

### Criar Regra de Teste

```sql
-- Exemplo: Retenção de eventos de auditoria
SELECT "public"."upsert_retention_rule"(
  p_tenant_id := (SELECT id FROM tenants LIMIT 1),
  p_entity_type := 'audit_event',
  p_retention_period_days := 365,
  p_anonymization_strategy := 'delete',
  p_description := 'Excluir eventos de auditoria após 1 ano'
);
```

---

## 📊 MONITORAMENTO

### Ver Execuções

```sql
SELECT * FROM "public"."retention_logs" 
ORDER BY created_at DESC 
LIMIT 20;
```

### Ver Resumo

```sql
SELECT * FROM "public"."retention_executions_summary";
```

---

**Status:** 🟢 **SISTEMA PRONTO E FUNCIONAL**

