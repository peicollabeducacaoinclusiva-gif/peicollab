-- ============================================================================
-- MIGRAÇÃO: Jobs Agendados (Edge Functions com Triggers)
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela de log de jobs agendados
--   2. Criar Edge Function para verificação de alertas
--   3. Configurar estrutura para triggers externos
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA scheduled_jobs_log (Log de Execuções)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  job_name text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('alert_check', 'report_generation', 'data_sync', 'cleanup', 'custom')),
  
  -- Execução
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms numeric(10,2),
  
  -- Status
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message text,
  
  -- Resultados
  records_processed integer,
  result_data jsonb DEFAULT '{}'::jsonb,
  
  -- Metadados
  triggered_by text DEFAULT 'scheduled', -- 'scheduled', 'manual', 'webhook'
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_log_name ON scheduled_jobs_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_log_status ON scheduled_jobs_log(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_log_type ON scheduled_jobs_log(job_type, started_at DESC);

-- Comentários
COMMENT ON TABLE scheduled_jobs_log IS 
  'Log de execuções de jobs agendados. Usado para monitoramento e auditoria.';

-- ============================================================================
-- PARTE 2: RPCs PARA GERENCIAR JOBS
-- ============================================================================

-- 2.1. Registrar início de job
CREATE OR REPLACE FUNCTION log_job_start(
  p_job_name text,
  p_job_type text,
  p_triggered_by text DEFAULT 'scheduled',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO scheduled_jobs_log (
    job_name,
    job_type,
    triggered_by,
    metadata
  ) VALUES (
    p_job_name,
    p_job_type,
    p_triggered_by,
    p_metadata
  )
  RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2. Registrar conclusão de job
CREATE OR REPLACE FUNCTION log_job_completion(
  p_job_id uuid,
  p_status text,
  p_records_processed integer DEFAULT NULL,
  p_result_data jsonb DEFAULT '{}'::jsonb,
  p_error_message text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_started_at timestamptz;
  v_duration_ms numeric;
BEGIN
  SELECT started_at INTO v_started_at
  FROM scheduled_jobs_log
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job não encontrado: %', p_job_id;
  END IF;
  
  v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_started_at)) * 1000;
  
  UPDATE scheduled_jobs_log
  SET 
    completed_at = NOW(),
    duration_ms = v_duration_ms,
    status = p_status,
    records_processed = p_records_processed,
    result_data = p_result_data,
    error_message = p_error_message
  WHERE id = p_job_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3. Obter histórico de jobs
CREATE OR REPLACE FUNCTION get_job_history(
  p_job_name text DEFAULT NULL,
  p_job_type text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  job_name text,
  job_type text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms numeric,
  status text,
  records_processed integer,
  error_message text,
  triggered_by text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sjl.id,
    sjl.job_name,
    sjl.job_type,
    sjl.started_at,
    sjl.completed_at,
    sjl.duration_ms,
    sjl.status,
    sjl.records_processed,
    sjl.error_message,
    sjl.triggered_by
  FROM scheduled_jobs_log sjl
  WHERE 
    (p_job_name IS NULL OR sjl.job_name = p_job_name)
    AND (p_job_type IS NULL OR sjl.job_type = p_job_type)
    AND (p_status IS NULL OR sjl.status = p_status)
  ORDER BY sjl.started_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2.4. Obter estatísticas de jobs
CREATE OR REPLACE FUNCTION get_job_statistics(
  p_job_name text DEFAULT NULL,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  job_name text,
  total_executions bigint,
  successful_executions bigint,
  failed_executions bigint,
  avg_duration_ms numeric,
  last_execution timestamptz,
  last_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sjl.job_name,
    COUNT(*)::bigint as total_executions,
    COUNT(*) FILTER (WHERE sjl.status = 'completed')::bigint as successful_executions,
    COUNT(*) FILTER (WHERE sjl.status = 'failed')::bigint as failed_executions,
    AVG(sjl.duration_ms)::numeric(10,2) as avg_duration_ms,
    MAX(sjl.started_at) as last_execution,
    (SELECT status FROM scheduled_jobs_log 
     WHERE job_name = sjl.job_name 
     ORDER BY started_at DESC LIMIT 1) as last_status
  FROM scheduled_jobs_log sjl
  WHERE 
    (p_job_name IS NULL OR sjl.job_name = p_job_name)
    AND sjl.started_at >= CURRENT_DATE - (p_days_back || ' days')::interval
  GROUP BY sjl.job_name
  ORDER BY sjl.job_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE scheduled_jobs_log ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin can view all job logs" ON scheduled_jobs_log;
CREATE POLICY "Superadmin can view all job logs"
  ON scheduled_jobs_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Secretário de educação vê logs de jobs da rede
DROP POLICY IF EXISTS "Education secretary can view network job logs" ON scheduled_jobs_log;
CREATE POLICY "Education secretary can view network job logs"
  ON scheduled_jobs_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role = 'education_secretary'
    )
  );

-- ============================================================================
-- PARTE 4: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de jobs agendados concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela scheduled_jobs_log (log de execuções)';
  RAISE NOTICE '  2. ✅ Criados RPCs: log_job_start, log_job_completion, get_job_history, get_job_statistics';
  RAISE NOTICE '  3. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar Edge Function scheduled-alert-check';
  RAISE NOTICE '  - Configurar webhook/cron externo para chamar Edge Function periodicamente';
  RAISE NOTICE '  - Criar interface de monitoramento de jobs';
END $$;

