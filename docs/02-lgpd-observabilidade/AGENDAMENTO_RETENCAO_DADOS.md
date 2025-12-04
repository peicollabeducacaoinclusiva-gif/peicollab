# Configuração de Agendamento de Retenção de Dados

Este documento descreve como configurar o agendamento automático de retenção de dados usando o Supabase pg_cron.

## 📋 Pré-requisitos

1. Supabase Project com pg_cron habilitado
2. Acesso ao Supabase Dashboard com permissões de superuser
3. RPC `apply_retention_rules` implementada no banco de dados

## 🔧 Configuração

### 1. Habilitar pg_cron no Supabase

O pg_cron já deve estar habilitado no seu projeto Supabase. Para verificar:

```sql
-- Verificar se pg_cron está disponível
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Se não estiver habilitado, habilite via SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 2. Criar Job de Retenção

Crie um job que executa a retenção de dados periodicamente. Recomendamos execução diária às 2h da manhã:

```sql
-- Agendar execução diária de retenção para todos os tenants
SELECT cron.schedule(
    'retencao-dados-diaria',
    '0 2 * * *', -- Toda segunda-feira às 2h da manhã (horário UTC)
    $$
    -- Executar para cada tenant ativo
    DO $$
    DECLARE
        tenant_record RECORD;
    BEGIN
        FOR tenant_record IN SELECT id FROM tenants WHERE is_active = true
        LOOP
            BEGIN
                PERFORM apply_retention_rules(tenant_record.id, false);
            EXCEPTION WHEN OTHERS THEN
                -- Log erro mas continue para outros tenants
                RAISE WARNING 'Erro ao processar tenant %: %', tenant_record.id, SQLERRM;
            END;
        END LOOP;
    END $$;
    $$
);
```

**Alternativa mais simples** (executar para um tenant específico):

```sql
-- Para um tenant específico (substitua TENANT_ID pelo UUID do tenant)
SELECT cron.schedule(
    'retencao-dados-tenant-xxxx',
    '0 2 * * *', -- Diariamente às 2h UTC
    $$SELECT apply_retention_rules('TENANT_ID_AQUI'::uuid, false)$$
);
```

### 3. Verificar Jobs Agendados

Para listar todos os jobs agendados:

```sql
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
ORDER BY jobid;
```

### 4. Gerenciar Jobs

#### Desativar um job:

```sql
SELECT cron.unschedule('retencao-dados-diaria');
```

#### Ativar/Desativar um job sem removê-lo:

```sql
-- Desativar
UPDATE cron.job 
SET active = false 
WHERE jobname = 'retencao-dados-diaria';

-- Reativar
UPDATE cron.job 
SET active = true 
WHERE jobname = 'retencao-dados-diaria';
```

#### Alterar horário de execução:

```sql
-- Primeiro remova o job antigo
SELECT cron.unschedule('retencao-dados-diaria');

-- Depois crie novamente com o novo horário
SELECT cron.schedule(
    'retencao-dados-diaria',
    '0 3 * * *', -- Novo horário: 3h da manhã
    $$...comando...$$
);
```

## 📅 Horários Recomendados

### Frequências Comuns

- **Diária (2h UTC)**: `'0 2 * * *'` - Recomendado para produção
- **Diária (3h UTC)**: `'0 3 * * *'` - Alternativa
- **Semanal (Domingo 2h UTC)**: `'0 2 * * 0'` - Para ambientes menores
- **Mensal (1º do mês 2h UTC)**: `'0 2 1 * *'` - Para retenção menos frequente

### Formato Cron

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── dia do mês (1 - 31)
│ │ │ ┌───────────── mês (1 - 12)
│ │ │ │ ┌───────────── dia da semana (0 - 6) (0 = domingo)
│ │ │ │ │
* * * * *
```

## 🔍 Monitoramento

### Ver histórico de execuções:

```sql
SELECT 
    j.jobid,
    j.jobname,
    jr.runid,
    jr.job_pid,
    jr.database,
    jr.username,
    jr.command,
    jr.status,
    jr.return_message,
    jr.start_time,
    jr.end_time,
    (jr.end_time - jr.start_time) AS duration
FROM cron.job j
LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
WHERE j.jobname LIKE '%retencao%'
ORDER BY jr.start_time DESC
LIMIT 20;
```

### Ver apenas execuções com erro:

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

## ⚠️ Importante

1. **Horário UTC**: Os horários são em UTC. Ajuste conforme necessário para seu fuso horário.
2. **Performance**: A execução de retenção pode ser pesada. Execute em horários de baixo tráfego.
3. **Dry Run**: Sempre teste primeiro com `dry_run = true` antes de executar em produção.
4. **Backup**: Certifique-se de ter backups antes de executar retenção em produção.
5. **Logs**: Monitore os logs em `retention_execution_logs` para verificar execuções.

## 🔐 Segurança

- Jobs executam com as permissões do usuário configurado no cron.job
- Por padrão, jobs executam como o usuário que os criou
- Para máxima segurança, crie um usuário específico para retenção com permissões limitadas

## 📝 Exemplo Completo

```sql
-- 1. Criar função wrapper para execução segura
CREATE OR REPLACE FUNCTION execute_retention_for_all_tenants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tenant_record RECORD;
    result jsonb;
BEGIN
    FOR tenant_record IN 
        SELECT id, network_name 
        FROM tenants 
        WHERE is_active = true
    LOOP
        BEGIN
            -- Executar retenção para o tenant
            SELECT apply_retention_rules(tenant_record.id, false) INTO result;
            
            -- Log sucesso (opcional)
            RAISE NOTICE 'Retenção executada para tenant %: %', 
                tenant_record.network_name, 
                result->>'total_rules_processed';
                
        EXCEPTION WHEN OTHERS THEN
            -- Log erro mas continue
            RAISE WARNING 'Erro ao processar tenant %: %', 
                tenant_record.id, 
                SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Agendar execução
SELECT cron.schedule(
    'retencao-dados-diaria-completa',
    '0 2 * * *', -- Diariamente às 2h UTC
    $$SELECT execute_retention_for_all_tenants()$$
);

-- 3. Verificar agendamento
SELECT * FROM cron.job WHERE jobname = 'retencao-dados-diaria-completa';
```

## 🆘 Troubleshooting

### Job não executa

1. Verifique se `active = true`:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'seu-job';
   ```

2. Verifique logs de erro:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'seu-job')
   ORDER BY start_time DESC;
   ```

### Erro de permissão

Certifique-se de que a função `apply_retention_rules` tem `SECURITY DEFINER` e as permissões corretas.

### Job executa mas não processa dados

Verifique se há tenants ativos e se as regras de retenção estão configuradas:

```sql
SELECT COUNT(*) FROM tenants WHERE is_active = true;
SELECT COUNT(*) FROM data_retention_rules WHERE is_active = true;
```

---

**Última atualização:** 2025-01-28

