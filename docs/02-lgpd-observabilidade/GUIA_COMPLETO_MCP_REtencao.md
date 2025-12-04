# Guia Completo - Monitoramento via MCP

**Data:** 2025-01-28

## 📋 Usando MCP Supabase para Monitorar Retenção

Este guia mostra como usar o MCP (Model Context Protocol) do Supabase para monitorar o agendamento de retenção de dados.

---

## 🔍 Queries Úteis via MCP

### 1. Ver Status do Job

```sql
SELECT 
    jobid,
    jobname,
    schedule,
    active,
    CASE 
        WHEN active THEN '✅ Ativo' 
        ELSE '⏸️ Inativo' 
    END as status
FROM cron.job
WHERE jobname LIKE '%retencao%';
```

### 2. Ver Últimas Execuções

```sql
SELECT 
    j.jobname,
    jr.start_time,
    jr.end_time,
    jr.status,
    CASE 
        WHEN jr.status = 'succeeded' THEN '✅ Sucesso'
        WHEN jr.status = 'failed' THEN '❌ Falha'
        ELSE '⏳ ' || jr.status
    END as status_label,
    (jr.end_time - jr.start_time) AS duration
FROM cron.job j
LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
WHERE j.jobname LIKE '%retencao%'
ORDER BY jr.start_time DESC NULLS LAST
LIMIT 10;
```

### 3. Ver Execuções com Erro

```sql
SELECT 
    j.jobname,
    jr.start_time,
    jr.return_message,
    jr.status
FROM cron.job j
JOIN cron.job_run_details jr ON j.jobid = jr.jobid
WHERE j.jobname LIKE '%retencao%'
    AND jr.status = 'failed'
ORDER BY jr.start_time DESC
LIMIT 10;
```

### 4. Ver Logs de Retenção

```sql
SELECT 
    id,
    tenant_id,
    status,
    summary,
    dry_run,
    created_at,
    metadata
FROM retention_execution_logs
ORDER BY created_at DESC
LIMIT 10;
```

### 5. Ver Logs Detalhados de Retenção

```sql
SELECT 
    id,
    entity_type,
    entity_id,
    action,
    processed_at,
    metadata
FROM retention_logs
ORDER BY processed_at DESC
LIMIT 20;
```

### 6. Usar View de Status (se criada)

```sql
SELECT * FROM retention_schedule_status;
```

---

## 🛠️ Gerenciamento via MCP

### Desativar Job

```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'retencao-dados-diaria-todos';
```

### Reativar Job

```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'retencao-dados-diaria-todos';
```

### Alterar Horário

```sql
-- Remover job atual
SELECT cron.unschedule('retencao-dados-diaria-todos');

-- Criar novo com horário diferente
SELECT cron.schedule(
    'retencao-dados-diaria-todos',
    '0 3 * * *', -- Novo horário
    $$SELECT execute_retention_for_all_active_tenants()$$
);
```

---

## 📊 Exemplos de Resultados

### Status do Job

```
jobid: 1
jobname: retencao-dados-diaria-todos
schedule: 0 2 * * *
active: true
status: ✅ Ativo
```

### Execuções Bem-sucedidas

```
jobname: retencao-dados-diaria-todos
start_time: 2025-01-28 02:00:00
end_time: 2025-01-28 02:05:23
status: ✅ Sucesso
duration: 00:05:23
```

---

## 💡 Dicas

1. **Monitore regularmente** os logs para identificar problemas
2. **Ajuste horários** conforme necessidade de tráfego
3. **Configure alertas** para execuções falhadas
4. **Faça backups** antes de executar retenção em produção

---

**Última atualização:** 2025-01-28

