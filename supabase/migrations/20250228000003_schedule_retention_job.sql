-- ============================================================================
-- AGENDAMENTO DE RETENÇÃO DE DADOS
-- Configura execução periódica da função de retenção
-- ============================================================================
-- NOTA: O agendamento deve ser configurado via Supabase Dashboard:
-- 1. Acesse: Supabase Dashboard > Database > Cron Jobs
-- 2. Configure: POST para https://[project-ref].supabase.co/functions/v1/apply-retention
-- 3. Headers: { "Authorization": "Bearer [service-role-key]" }
-- 4. Body: { "forceAllTenants": true, "dryRun": false }
-- 5. Schedule: "0 3 * * *" (diariamente às 3h)
-- 
-- Alternativamente, use o Supabase CLI:
-- supabase functions deploy apply-retention
-- Depois configure o scheduler via Dashboard ou use um cron job externo

-- Função wrapper para executar retenção para um tenant específico
CREATE OR REPLACE FUNCTION "public"."execute_retention_for_tenant"(
  p_tenant_id uuid,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_tenant_record RECORD;
BEGIN
  -- Buscar informações do tenant
  SELECT id, network_name INTO v_tenant_record
  FROM "public"."tenants"
  WHERE id = p_tenant_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Tenant não encontrado ou inativo'
    );
  END IF;
  
  BEGIN
    -- Chamar a função apply_retention_rules
    SELECT * INTO v_result
    FROM "public"."apply_retention_rules"(
      p_tenant_id := p_tenant_id,
      p_dry_run := p_dry_run
    );
    
    -- Registrar log de execução na tabela correta
    INSERT INTO "public"."retention_execution_logs" (
      tenant_id,
      executed_by,
      dry_run,
      status,
      summary,
      metadata
    ) VALUES (
      p_tenant_id,
      NULL, -- Sistema
      p_dry_run,
      CASE WHEN (v_result->>'success')::boolean THEN 'completed' ELSE 'failed' END,
      format('Execução %s para tenant %s: %s regras processadas', 
             CASE WHEN p_dry_run THEN 'de teste' ELSE 'automática' END,
             v_tenant_record.network_name,
             COALESCE((v_result->>'total_rules_processed')::text, '0')),
      v_result
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Registrar erro no log na tabela correta
    INSERT INTO "public"."retention_execution_logs" (
      tenant_id,
      executed_by,
      dry_run,
      status,
      summary,
      metadata
    ) VALUES (
      p_tenant_id,
      NULL,
      p_dry_run,
      'failed',
      format('Erro ao executar retenção para tenant %s: %s', 
             COALESCE(v_tenant_record.network_name, 'desconhecido'),
             SQLERRM),
      jsonb_build_object('error', SQLERRM)
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;

-- Função para executar retenção para todos os tenants ativos
CREATE OR REPLACE FUNCTION "public"."trigger_retention_for_all_tenants"(
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_record RECORD;
  v_result jsonb;
  v_results jsonb[] := ARRAY[]::jsonb[];
  v_total_processed integer := 0;
BEGIN
  -- Buscar todos os tenants ativos
  FOR v_tenant_record IN
    SELECT id, network_name
    FROM "public"."tenants"
    WHERE is_active = true
  LOOP
    BEGIN
      -- Executar retenção para o tenant
      SELECT "public"."execute_retention_for_tenant"(
        v_tenant_record.id,
        p_dry_run
      ) INTO v_result;
      
      v_results := array_append(v_results, v_result);
      v_total_processed := v_total_processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_results := array_append(v_results, jsonb_build_object(
        'success', false,
        'tenant_id', v_tenant_record.id,
        'error', SQLERRM
      ));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_tenants_processed', v_total_processed,
    'results', v_results,
    'executed_at', now()
  );
END;
$$;

COMMENT ON FUNCTION "public"."execute_retention_for_tenant" IS 
  'Executa regras de retenção para um tenant específico.';

COMMENT ON FUNCTION "public"."trigger_retention_for_all_tenants" IS 
  'Executa regras de retenção para todos os tenants ativos. Pode ser chamada via Edge Function ou Scheduler.';

-- ============================================================================
-- VIEW PARA VISUALIZAR ÚLTIMAS EXECUÇÕES
-- ============================================================================

CREATE OR REPLACE VIEW "public"."retention_executions_summary" AS
SELECT
  rel.tenant_id,
  t.network_name,
  COUNT(*) FILTER (WHERE rel.status = 'completed') as successful_executions,
  COUNT(*) FILTER (WHERE rel.status = 'failed') as failed_executions,
  MAX(rel.created_at) as last_execution,
  MAX(rel.created_at) FILTER (WHERE rel.status = 'completed') as last_successful_execution
FROM "public"."retention_execution_logs" rel
LEFT JOIN "public"."tenants" t ON t.id = rel.tenant_id
GROUP BY rel.tenant_id, t.network_name;

COMMENT ON VIEW "public"."retention_executions_summary" IS 
  'Resumo das execuções de retenção por tenant.';

