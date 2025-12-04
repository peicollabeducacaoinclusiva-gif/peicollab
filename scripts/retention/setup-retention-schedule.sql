-- Script SQL para configurar agendamento de retenção de dados
-- Execute este script no Supabase Dashboard > SQL Editor

-- ============================================================================
-- CONFIGURAÇÃO DE AGENDAMENTO DE RETENÇÃO DE DADOS
-- ============================================================================

-- Pré-requisito: Verificar se pg_cron está habilitado
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- OPÇÃO 1: Executar retenção diariamente para TODOS os tenants ativos
-- ============================================================================

-- Remover job anterior se existir (para evitar duplicatas)
SELECT cron.unschedule('retencao-dados-diaria-todos') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'retencao-dados-diaria-todos'
);

-- Criar função wrapper para execução segura em todos os tenants
CREATE OR REPLACE FUNCTION execute_retention_for_all_active_tenants()
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
            
            -- Log sucesso (apenas em modo debug)
            RAISE NOTICE 'Retenção executada para tenant %: %', 
                tenant_record.network_name, 
                COALESCE(result->>'total_rules_processed', '0');
                
        EXCEPTION WHEN OTHERS THEN
            -- Log erro mas continue para outros tenants
            RAISE WARNING 'Erro ao processar tenant %: %', 
                tenant_record.id, 
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Agendar execução diária às 2h UTC (23h horário de Brasília no horário padrão)
SELECT cron.schedule(
    'retencao-dados-diaria-todos',
    '0 2 * * *', -- Diariamente às 2h UTC
    $$SELECT execute_retention_for_all_active_tenants()$$
);

-- ============================================================================
-- OPÇÃO 2: Executar retenção para um tenant específico
-- ============================================================================

-- Substitua TENANT_ID_AQUI pelo UUID do tenant desejado
/*
SELECT cron.schedule(
    'retencao-dados-tenant-especifico',
    '0 2 * * *', -- Diariamente às 2h UTC
    $$SELECT apply_retention_rules('TENANT_ID_AQUI'::uuid, false)$$
);
*/

-- ============================================================================
-- OPÇÃO 3: Executar retenção semanalmente (Domingos às 2h UTC)
-- ============================================================================

/*
SELECT cron.schedule(
    'retencao-dados-semanal',
    '0 2 * * 0', -- Todo domingo às 2h UTC
    $$SELECT execute_retention_for_all_active_tenants()$$
);
*/

-- ============================================================================
-- OPÇÃO 4: Executar retenção mensalmente (1º do mês às 2h UTC)
-- ============================================================================

/*
SELECT cron.schedule(
    'retencao-dados-mensal',
    '0 2 1 * *', -- Todo dia 1 às 2h UTC
    $$SELECT execute_retention_for_all_active_tenants()$$
);
*/

-- ============================================================================
-- VERIFICAÇÃO E MONITORAMENTO
-- ============================================================================

-- Verificar jobs agendados
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    active,
    nodename,
    nodeport,
    database,
    username
FROM cron.job
WHERE jobname LIKE '%retencao%'
ORDER BY jobid;

-- Ver histórico de execuções (últimas 10)
SELECT 
    j.jobname,
    jr.start_time,
    jr.end_time,
    jr.status,
    jr.return_message,
    (jr.end_time - jr.start_time) AS duration
FROM cron.job j
JOIN cron.job_run_details jr ON j.jobid = jr.jobid
WHERE j.jobname LIKE '%retencao%'
ORDER BY jr.start_time DESC
LIMIT 10;

-- Ver apenas execuções com erro
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

-- ============================================================================
-- GERENCIAMENTO
-- ============================================================================

-- Desativar um job (sem removê-lo)
/*
UPDATE cron.job 
SET active = false 
WHERE jobname = 'retencao-dados-diaria-todos';
*/

-- Reativar um job
/*
UPDATE cron.job 
SET active = true 
WHERE jobname = 'retencao-dados-diaria-todos';
*/

-- Remover um job completamente
/*
SELECT cron.unschedule('retencao-dados-diaria-todos');
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Os horários são em UTC. Ajuste conforme necessário:
--    - Horário de Brasília (BRT/BRST): UTC-3 (ou UTC-2 no horário de verão)
--    - 2h UTC = 23h BRT / 22h BRST

-- 2. Sempre teste primeiro com dry_run = true:
--    SELECT apply_retention_rules('tenant_id'::uuid, true);

-- 3. Monitore os logs de execução regularmente em:
--    - retention_execution_logs
--    - cron.job_run_details

-- 4. Para ambiente de produção, recomendamos:
--    - Execução diária durante horário de baixo tráfego (2h UTC)
--    - Monitoramento de execuções falhadas
--    - Backups regulares antes da execução

