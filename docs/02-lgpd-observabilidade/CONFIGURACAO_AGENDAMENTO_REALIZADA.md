# Configuração de Agendamento de Retenção - Realizada

**Data:** 2025-01-28  
**Status:** ✅ Configuração Completa

## 📋 Resumo

O agendamento de retenção de dados foi configurado com sucesso no Supabase usando pg_cron.

---

## ✅ Configuração Realizada

### 1. Extensão pg_cron

- ✅ **Status:** Habilitada (versão 1.6.4)
- ✅ **Verificação:** `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`

### 2. Função de Execução

- ✅ **Nome:** `execute_retention_for_all_active_tenants()`
- ✅ **Tipo:** `SECURITY DEFINER`
- ✅ **Função:** Executa retenção para todos os tenants ativos

### 3. Job Agendado

- ✅ **Nome:** `retencao-dados-diaria-todos`
- ✅ **Job ID:** 1
- ✅ **Agendamento:** `0 2 * * *` (Diariamente às 2h UTC)
- ✅ **Status:** Ativo
- ✅ **Database:** postgres
- ✅ **Comando:** `SELECT execute_retention_for_all_active_tenants()`

---

## ⏰ Horário de Execução

- **UTC:** 02:00 (2h da manhã)
- **Horário de Brasília (BRT):** 23:00 (23h da noite anterior)
- **Frequência:** Diária

**Nota:** Para ajustar o horário, use:
```sql
-- Remover job atual
SELECT cron.unschedule('retencao-dados-diaria-todos');

-- Criar novo job com horário diferente
SELECT cron.schedule(
    'retencao-dados-diaria-todos',
    '0 3 * * *', -- Novo horário: 3h UTC
    $$SELECT execute_retention_for_all_active_tenants()$$
);
```

---

## 📊 Monitoramento

### Ver Jobs Agendados

```sql
SELECT 
    jobid,
    jobname,
    schedule,
    active
FROM cron.job
WHERE jobname LIKE '%retencao%';
```

**Resultado atual:**
- Job ID: 1
- Nome: retencao-dados-diaria-todos
- Agendamento: 0 2 * * *
- Status: ✅ Ativo

### Ver Histórico de Execuções

```sql
SELECT 
    j.jobname,
    jr.start_time,
    jr.end_time,
    jr.status,
    jr.return_message,
    (jr.end_time - jr.start_time) AS duration
FROM cron.job j
LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
WHERE j.jobname LIKE '%retencao%'
ORDER BY jr.start_time DESC
LIMIT 10;
```

### Ver Execuções com Erro

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
ORDER BY jr.start_time DESC;
```

### Ver Logs de Retenção

```sql
SELECT 
    id,
    tenant_id,
    status,
    summary,
    dry_run,
    created_at
FROM retention_execution_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 Gerenciamento

### Desativar Job (sem remover)

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

### Remover Job Completamente

```sql
SELECT cron.unschedule('retencao-dados-diaria-todos');
```

---

## 📝 Scripts de Monitoramento

### Script TypeScript

```bash
npx tsx scripts/retention/monitor-retention-schedule.ts
```

Este script exibe:
- Jobs agendados
- Histórico de execuções
- Erros recentes
- Logs de retenção

---

## ✅ Checklist de Verificação

- [x] pg_cron habilitado
- [x] Função de execução criada
- [x] Job agendado
- [x] Job ativo
- [x] Horário configurado (2h UTC)
- [x] Scripts de monitoramento criados

---

## 🎯 Próximos Passos

1. **Aguardar primeira execução** (próxima 2h UTC)
2. **Monitorar logs** após primeira execução
3. **Verificar retenção** nos dados
4. **Ajustar horário** se necessário
5. **Configurar alertas** para falhas

---

## 📊 Status Atual

- **Job:** ✅ Configurado e Ativo
- **Próxima Execução:** Próxima 2h UTC
- **Histórico:** Ainda não há execuções (job recém-criado)
- **Logs:** Ainda não há logs (aguardando primeira execução)

---

**Configuração realizada com sucesso via MCP Supabase!** ✅

**Última atualização:** 2025-01-28

