# Guia Rápido - Configuração de Retenção ✅

**Data:** 28/01/2025  
**Status:** ✅ **MIGRATIONS APLICADAS COM SUCESSO**

---

## ✅ VALIDAÇÃO DO SISTEMA

### Tabelas Criadas ✅
- ✅ `data_retention_rules` - Regras de retenção
- ✅ `retention_logs` - Logs de execuções

### Funções Criadas ✅
- ✅ `apply_retention_rules(p_tenant_id, p_dry_run)` - Aplica regras para um tenant
- ✅ `execute_retention_for_tenant(p_tenant_id, p_dry_run)` - Wrapper para execução
- ✅ `trigger_retention_for_all_tenants(p_dry_run)` - Executa para todos os tenants
- ✅ `upsert_retention_rule(...)` - Cria/atualiza regras
- ✅ `get_retention_rules(p_tenant_id)` - Lista regras de um tenant

### Views Criadas ✅
- ✅ `retention_executions_summary` - Resumo de execuções por tenant

---

## 🎯 CONFIGURAR AGENDAMENTO

### Opção 1: Via Supabase Dashboard (Recomendado) 🎯

1. **Acesse o Dashboard:**
   - URL: `https://app.supabase.com/project/[seu-project-id]`
   - Navegue: **Database** > **Cron Jobs** (ou **Extensions** > **pg_cron**)

2. **Criar Novo Cron Job:**
   ```sql
   -- Nome do job
   daily-retention-job
   
   -- Schedule (cron expression)
   0 3 * * *
   -- Executa diariamente às 3h da manhã (UTC)
   
   -- SQL Command
   SELECT "public"."trigger_retention_for_all_tenants"(false);
   ```

3. **Ou via HTTP (Edge Function):**
   - **Method:** POST
   - **URL:** `https://[project-ref].supabase.co/functions/v1/apply-retention`
   - **Headers:**
     ```json
     {
       "Authorization": "Bearer [SERVICE_ROLE_KEY]",
       "Content-Type": "application/json"
     }
     ```
   - **Body:**
     ```json
     {
       "forceAllTenants": true,
       "dryRun": false
     }
     ```

---

### Opção 2: Via Script Externo

Crie um arquivo `retention-scheduler.sh`:

```bash
#!/bin/bash
# Agendar: 0 3 * * * /path/to/retention-scheduler.sh

SUPABASE_URL="https://[project-ref].supabase.co"
SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

curl -X POST \
  "${SUPABASE_URL}/functions/v1/apply-retention" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "forceAllTenants": true,
    "dryRun": false
  }' \
  -w "\nStatus: %{http_code}\n"
```

---

## 🧪 TESTAR O SISTEMA

### 1. Testar via SQL

```sql
-- Teste com dry_run (não executa de verdade)
SELECT "public"."trigger_retention_for_all_tenants"(true);

-- Ver resumo de execuções
SELECT * FROM "public"."retention_executions_summary";

-- Ver logs recentes
SELECT * FROM "public"."retention_logs" 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Testar via Painel Web

1. Acesse: `/retention` no app Gestão Escolar
2. Clique em **"Executar Teste (Dry Run)"**
3. Verifique os resultados no histórico

### 3. Criar Regra de Retenção de Teste

```sql
-- Criar regra para retenção de eventos de auditoria (exemplo)
SELECT "public"."upsert_retention_rule"(
  p_tenant_id := '[seu-tenant-id]',
  p_entity_type := 'audit_event',
  p_retention_period_days := 365, -- 1 ano
  p_anonymization_strategy := 'delete',
  p_description := 'Excluir eventos de auditoria após 1 ano'
);
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [x] Migrations aplicadas
- [x] Tabelas criadas
- [x] Funções criadas
- [x] Views criadas
- [ ] Criar regras de retenção para cada tenant
- [ ] Configurar agendamento (cron job ou script)
- [ ] Testar execução com dry_run
- [ ] Monitorar primeira execução real

---

## 🔍 MONITORAMENTO

### Ver Execuções Recentes

```sql
SELECT 
  tenant_id,
  status,
  dry_run,
  summary,
  created_at
FROM "public"."retention_logs"
ORDER BY created_at DESC
LIMIT 20;
```

### Ver Resumo por Tenant

```sql
SELECT * FROM "public"."retention_executions_summary";
```

### Ver Regras Configuradas

```sql
SELECT * FROM "public"."get_retention_rules"('[tenant-id]');
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Criar regras de retenção padrão:**
   - Eventos de auditoria: 2 anos
   - Dados de estudantes: 5 anos
   - Logs de sistema: 1 ano

2. **Configurar agendamento:**
   - Via Dashboard (recomendado)
   - Ou via script externo

3. **Testar periodicamente:**
   - Executar dry_run mensalmente
   - Verificar logs de execução

---

**Status:** 🟢 **SISTEMA PRONTO PARA USO**

