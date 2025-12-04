-- ============================================================================
-- MIGRAÇÃO: Sistema de Monitoramento de Performance e Auditoria
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela performance_metrics (Métricas de Performance)
--   2. Criar tabela audit_logs (Logs de Auditoria)
--   3. Criar tabela security_logs (Logs de Segurança)
--   4. Criar RPCs para monitoramento e auditoria
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA performance_metrics (Métricas de Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  endpoint text, -- RPC ou endpoint da API
  operation_type text NOT NULL CHECK (operation_type IN ('rpc', 'query', 'mutation', 'export', 'import', 'validation')),
  
  -- Métricas
  execution_time_ms numeric(10,2) NOT NULL,
  records_processed integer,
  memory_usage_mb numeric(10,2),
  
  -- Status
  status text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_message text,
  
  -- Contexto
  user_id uuid REFERENCES profiles(id),
  tenant_id uuid REFERENCES tenants(id),
  school_id uuid REFERENCES schools(id),
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(operation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status ON performance_metrics(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created ON performance_metrics(created_at DESC);

-- Comentários
COMMENT ON TABLE performance_metrics IS 
  'Métricas de performance de operações do sistema. Usado para monitoramento e otimização.';

-- ============================================================================
-- PARTE 2: TABELA audit_logs (Logs de Auditoria)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  user_id uuid REFERENCES profiles(id),
  tenant_id uuid REFERENCES tenants(id),
  school_id uuid REFERENCES schools(id),
  
  -- Ação
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view', 'export', 'import', 'approve', 'reject', 'login', 'logout')),
  entity_type text NOT NULL, -- 'student', 'professional', 'class', 'pei', etc.
  entity_id uuid,
  
  -- Detalhes
  action_description text,
  old_values jsonb, -- Valores antes da alteração
  new_values jsonb, -- Valores após a alteração
  changed_fields text[], -- Campos alterados
  
  -- Contexto
  ip_address inet,
  user_agent text,
  session_id text,
  
  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Comentários
COMMENT ON TABLE audit_logs IS 
  'Logs de auditoria de todas as operações críticas do sistema. Rastreabilidade completa.';

-- ============================================================================
-- PARTE 3: TABELA security_logs (Logs de Segurança)
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  user_id uuid REFERENCES profiles(id),
  ip_address inet,
  
  -- Evento
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 'session_expired',
    'permission_denied', 'unauthorized_access', 'data_access',
    'password_change', 'password_reset', '2fa_enabled', '2fa_disabled',
    'suspicious_activity', 'brute_force_attempt', 'account_locked'
  )),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Detalhes
  event_description text NOT NULL,
  event_details jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES profiles(id),
  resolution_notes text,
  
  -- Metadados
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_resolved ON security_logs(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at DESC);

-- Comentários
COMMENT ON TABLE security_logs IS 
  'Logs de eventos de segurança. Monitoramento de acessos, tentativas de login, atividades suspeitas.';

-- ============================================================================
-- PARTE 4: RPCs PARA MONITORAMENTO E AUDITORIA
-- ============================================================================

-- 4.1. Registrar métrica de performance
CREATE OR REPLACE FUNCTION log_performance_metric(
  p_endpoint text,
  p_operation_type text,
  p_execution_time_ms numeric,
  p_status text,
  p_user_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_school_id uuid DEFAULT NULL,
  p_records_processed integer DEFAULT NULL,
  p_memory_usage_mb numeric DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_metric_id uuid;
BEGIN
  INSERT INTO performance_metrics (
    endpoint,
    operation_type,
    execution_time_ms,
    status,
    user_id,
    tenant_id,
    school_id,
    records_processed,
    memory_usage_mb,
    error_message,
    metadata
  ) VALUES (
    p_endpoint,
    p_operation_type,
    p_execution_time_ms,
    p_status,
    p_user_id,
    p_tenant_id,
    p_school_id,
    p_records_processed,
    p_memory_usage_mb,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_metric_id;
  
  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2. Registrar log de auditoria
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action_type text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_action_description text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_changed_fields text[] DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_school_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    tenant_id,
    school_id,
    action_type,
    entity_type,
    entity_id,
    action_description,
    old_values,
    new_values,
    changed_fields,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_tenant_id,
    p_school_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_action_description,
    p_old_values,
    p_new_values,
    p_changed_fields,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3. Registrar evento de segurança
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type text,
  p_severity text,
  p_event_description text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_event_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO security_logs (
    user_id,
    ip_address,
    event_type,
    severity,
    event_description,
    event_details,
    user_agent
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_ip_address,
    p_event_type,
    p_severity,
    p_event_description,
    p_event_details,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  -- Se for evento crítico, criar notificação
  IF p_severity = 'critical' THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
      id,
      'security_alert',
      'Alerta de Segurança Crítico',
      p_event_description,
      jsonb_build_object('security_log_id', v_log_id, 'event_type', p_event_type)
    FROM profiles
    WHERE EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = profiles.id
      AND ur.role IN ('superadmin', 'education_secretary')
    );
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.4. Obter métricas de performance
CREATE OR REPLACE FUNCTION get_performance_metrics(
  p_endpoint text DEFAULT NULL,
  p_operation_type text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  endpoint text,
  operation_type text,
  avg_execution_time_ms numeric,
  min_execution_time_ms numeric,
  max_execution_time_ms numeric,
  p95_execution_time_ms numeric,
  total_operations bigint,
  success_count bigint,
  error_count bigint,
  avg_records_processed numeric,
  last_execution timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.endpoint,
    pm.operation_type,
    AVG(pm.execution_time_ms)::numeric(10,2) as avg_execution_time_ms,
    MIN(pm.execution_time_ms)::numeric(10,2) as min_execution_time_ms,
    MAX(pm.execution_time_ms)::numeric(10,2) as max_execution_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.execution_time_ms)::numeric(10,2) as p95_execution_time_ms,
    COUNT(*)::bigint as total_operations,
    COUNT(*) FILTER (WHERE pm.status = 'success')::bigint as success_count,
    COUNT(*) FILTER (WHERE pm.status = 'error')::bigint as error_count,
    AVG(pm.records_processed)::numeric(10,2) as avg_records_processed,
    MAX(pm.created_at) as last_execution
  FROM performance_metrics pm
  WHERE 
    (p_endpoint IS NULL OR pm.endpoint = p_endpoint)
    AND (p_operation_type IS NULL OR pm.operation_type = p_operation_type)
    AND (p_start_date IS NULL OR pm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR pm.created_at <= p_end_date)
  GROUP BY pm.endpoint, pm.operation_type
  ORDER BY avg_execution_time_ms DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.5. Obter logs de auditoria
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_user_id uuid DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_action_type text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  action_type text,
  entity_type text,
  entity_id uuid,
  action_description text,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  ip_address inet,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    p.full_name as user_name,
    al.action_type,
    al.entity_type,
    al.entity_id,
    al.action_description,
    al.old_values,
    al.new_values,
    al.changed_fields,
    al.ip_address,
    al.created_at
  FROM audit_logs al
  LEFT JOIN profiles p ON p.id = al.user_id
  WHERE 
    (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_action_type IS NULL OR al.action_type = p_action_type)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.6. Obter alertas de segurança
CREATE OR REPLACE FUNCTION get_security_alerts(
  p_severity text DEFAULT NULL,
  p_event_type text DEFAULT NULL,
  p_is_resolved boolean DEFAULT false,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  event_type text,
  severity text,
  event_description text,
  event_details jsonb,
  ip_address inet,
  is_resolved boolean,
  resolved_at timestamptz,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id,
    sl.user_id,
    p.full_name as user_name,
    sl.event_type,
    sl.severity,
    sl.event_description,
    sl.event_details,
    sl.ip_address,
    sl.is_resolved,
    sl.resolved_at,
    sl.created_at
  FROM security_logs sl
  LEFT JOIN profiles p ON p.id = sl.user_id
  WHERE 
    (p_severity IS NULL OR sl.severity = p_severity)
    AND (p_event_type IS NULL OR sl.event_type = p_event_type)
    AND (p_is_resolved IS NULL OR sl.is_resolved = p_is_resolved)
    AND (p_start_date IS NULL OR sl.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sl.created_at <= p_end_date)
  ORDER BY 
    CASE sl.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    sl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4.7. Resolver alerta de segurança
CREATE OR REPLACE FUNCTION resolve_security_alert(
  p_alert_id uuid,
  p_resolution_notes text,
  p_resolved_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE security_logs
  SET 
    is_resolved = true,
    resolved_at = NOW(),
    resolved_by = COALESCE(p_resolved_by, auth.uid()),
    resolution_notes = p_resolution_notes
  WHERE id = p_alert_id
  AND is_resolved = false;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================================================

-- Função genérica para auditoria de alterações
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields text[] := ARRAY[]::text[];
  v_field text;
  v_old_value text;
  v_new_value text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Identificar campos alterados
    FOR v_field IN SELECT column_name FROM information_schema.columns WHERE table_name = TG_TABLE_NAME LOOP
      EXECUTE format('SELECT ($1.%I)::text, ($2.%I)::text', v_field, v_field)
      USING OLD, NEW
      INTO v_old_value, v_new_value;
      
      IF v_old_value IS DISTINCT FROM v_new_value THEN
        v_changed_fields := v_changed_fields || v_field;
      END IF;
    END LOOP;
    
    -- Registrar log de auditoria
    PERFORM log_audit_event(
      'update',
      TG_TABLE_NAME,
      NEW.id,
      format('Atualização de %s', TG_TABLE_NAME),
      to_jsonb(OLD),
      to_jsonb(NEW),
      v_changed_fields
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      'delete',
      TG_TABLE_NAME,
      OLD.id,
      format('Exclusão de %s', TG_TABLE_NAME),
      to_jsonb(OLD),
      NULL,
      NULL
    );
    
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      'create',
      TG_TABLE_NAME,
      NEW.id,
      format('Criação de %s', TG_TABLE_NAME),
      NULL,
      to_jsonb(NEW),
      NULL
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em tabelas críticas (exemplos)
-- Nota: Aplicar apenas em tabelas que realmente precisam de auditoria completa
-- Para evitar overhead, aplicar seletivamente

-- ============================================================================
-- PARTE 6: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to performance_metrics" ON performance_metrics;
CREATE POLICY "Superadmin full access to performance_metrics"
  ON performance_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários veem suas próprias métricas
DROP POLICY IF EXISTS "Users can view their own metrics" ON performance_metrics;
CREATE POLICY "Users can view their own metrics"
  ON performance_metrics FOR SELECT
  USING (user_id = auth.uid());

-- Logs de auditoria: superadmin e secretário veem tudo da rede
DROP POLICY IF EXISTS "Superadmin full access to audit_logs" ON audit_logs;
CREATE POLICY "Superadmin full access to audit_logs"
  ON audit_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Education secretary can view network audit logs" ON audit_logs;
CREATE POLICY "Education secretary can view network audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid()
      AND ur.role = 'education_secretary'
      AND p.tenant_id = audit_logs.tenant_id
    )
  );

-- Usuários veem seus próprios logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Logs de segurança: apenas superadmin e secretário
DROP POLICY IF EXISTS "Superadmin full access to security_logs" ON security_logs;
CREATE POLICY "Superadmin full access to security_logs"
  ON security_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Education secretary can view security logs" ON security_logs;
CREATE POLICY "Education secretary can view security_logs"
  ON security_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'education_secretary'
    )
  );

-- Usuários veem seus próprios logs de segurança
DROP POLICY IF EXISTS "Users can view their own security logs" ON security_logs;
CREATE POLICY "Users can view their own security logs"
  ON security_logs FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- PARTE 7: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de monitoramento de performance e auditoria concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela performance_metrics (métricas de performance)';
  RAISE NOTICE '  2. ✅ Criada tabela audit_logs (logs de auditoria)';
  RAISE NOTICE '  3. ✅ Criada tabela security_logs (logs de segurança)';
  RAISE NOTICE '  4. ✅ Criados RPCs: log_performance_metric, log_audit_event, log_security_event, get_performance_metrics, get_audit_logs, get_security_alerts, resolve_security_alert';
  RAISE NOTICE '  5. ✅ Criada função audit_table_changes para triggers automáticos';
  RAISE NOTICE '  6. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface de monitoramento no app Gestão Escolar (/monitoring)';
  RAISE NOTICE '  - Integrar logging automático em RPCs críticos';
  RAISE NOTICE '  - Criar dashboard de performance e segurança';
END $$;

