-- ============================================================================
-- MIGRAÇÃO: Sistema de Alertas Automáticos e Notificações em Tempo Real
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela alert_rules (Regras de Alertas)
--   2. Criar tabela automatic_alerts (Alertas Gerados Automaticamente)
--   3. Criar função para gerar alertas automaticamente
--   4. Criar função para notificações em tempo real
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA alert_rules (Regras de Alertas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  rule_name text NOT NULL,
  rule_description text,
  rule_code text NOT NULL UNIQUE,
  
  -- Condições
  entity_type text NOT NULL CHECK (entity_type IN ('student', 'school', 'network', 'pei', 'enrollment', 'attendance')),
  condition_type text NOT NULL CHECK (condition_type IN ('threshold', 'absence', 'performance', 'compliance', 'custom')),
  condition_config jsonb NOT NULL DEFAULT '{}'::jsonb, -- {field, operator, value, period}
  
  -- Ação
  alert_type text NOT NULL CHECK (alert_type IN ('info', 'warning', 'critical', 'urgent')),
  alert_message_template text NOT NULL,
  notification_channels text[] DEFAULT ARRAY['dashboard']::text[], -- ['dashboard', 'email', 'sms', 'push']
  
  -- Destinatários
  target_roles text[] DEFAULT ARRAY[]::text[], -- ['education_secretary', 'school_director', etc.]
  target_schools uuid[] DEFAULT ARRAY[]::uuid[], -- Escolas específicas (vazio = todas)
  
  -- Agendamento
  check_frequency text NOT NULL DEFAULT 'daily' CHECK (check_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  is_active boolean DEFAULT true,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_active, check_frequency);
CREATE INDEX IF NOT EXISTS idx_alert_rules_entity ON alert_rules(entity_type, condition_type);

-- ============================================================================
-- PARTE 2: TABELA automatic_alerts (Alertas Gerados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS automatic_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  alert_rule_id uuid REFERENCES alert_rules(id) ON DELETE SET NULL,
  rule_code text, -- Mantido para histórico
  
  -- Entidade relacionada
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  school_id uuid REFERENCES schools(id),
  tenant_id uuid REFERENCES tenants(id),
  
  -- Alerta
  alert_type text NOT NULL,
  alert_message text NOT NULL,
  alert_data jsonb DEFAULT '{}'::jsonb, -- Dados contextuais do alerta
  
  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by uuid REFERENCES profiles(id),
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  
  -- Notificações
  notifications_sent jsonb DEFAULT '[]'::jsonb, -- [{channel, sent_at, recipient_id}]
  
  -- Metadados
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz -- Alertas podem expirar automaticamente
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_automatic_alerts_status ON automatic_alerts(status, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_automatic_alerts_entity ON automatic_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_automatic_alerts_school ON automatic_alerts(school_id, status);
CREATE INDEX IF NOT EXISTS idx_automatic_alerts_tenant ON automatic_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_automatic_alerts_type ON automatic_alerts(alert_type, status);
CREATE INDEX IF NOT EXISTS idx_automatic_alerts_expires ON automatic_alerts(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- PARTE 3: FUNÇÕES PARA GERAR ALERTAS AUTOMATICAMENTE
-- ============================================================================

-- 3.1. Gerar alerta baseado em regra
CREATE OR REPLACE FUNCTION generate_automatic_alert(
  p_rule_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_alert_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_rule RECORD;
  v_alert_id uuid;
  v_school_id uuid;
  v_tenant_id uuid;
  v_message text;
BEGIN
  -- Buscar regra
  SELECT * INTO v_rule FROM alert_rules WHERE id = p_rule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Regra de alerta não encontrada ou inativa';
  END IF;
  
  -- Determinar school_id e tenant_id baseado no tipo de entidade
  CASE p_entity_type
    WHEN 'student' THEN
      SELECT school_id INTO v_school_id FROM students WHERE id = p_entity_id;
      SELECT tenant_id INTO v_tenant_id FROM schools WHERE id = v_school_id;
    WHEN 'school' THEN
      SELECT id, tenant_id INTO v_school_id, v_tenant_id FROM schools WHERE id = p_entity_id;
    WHEN 'pei' THEN
      SELECT s.school_id, s.tenant_id INTO v_school_id, v_tenant_id
      FROM peis p
      INNER JOIN students s ON s.id = p.student_id
      WHERE p.id = p_entity_id;
    ELSE
      -- Tentar buscar de forma genérica
      v_school_id := NULL;
      v_tenant_id := NULL;
  END CASE;
  
  -- Gerar mensagem do alerta
  v_message := v_rule.alert_message_template;
  -- Substituir placeholders na mensagem (simplificado)
  v_message := REPLACE(v_message, '{entity_id}', p_entity_id::text);
  
  -- Criar alerta
  INSERT INTO automatic_alerts (
    alert_rule_id,
    rule_code,
    entity_type,
    entity_id,
    school_id,
    tenant_id,
    alert_type,
    alert_message,
    alert_data
  ) VALUES (
    p_rule_id,
    v_rule.rule_code,
    p_entity_type,
    p_entity_id,
    v_school_id,
    v_tenant_id,
    v_rule.alert_type,
    v_message,
    p_alert_data
  )
  ON CONFLICT DO NOTHING -- Evitar duplicatas
  RETURNING id INTO v_alert_id;
  
  -- Enviar notificações
  PERFORM send_alert_notifications(v_alert_id);
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2. Verificar e gerar alertas para uma regra
CREATE OR REPLACE FUNCTION check_and_generate_alerts(p_rule_id uuid)
RETURNS integer AS $$
DECLARE
  v_rule RECORD;
  v_entity RECORD;
  v_count integer := 0;
  v_condition_sql text;
BEGIN
  SELECT * INTO v_rule FROM alert_rules WHERE id = p_rule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Construir query baseada na condição (simplificado - expandir conforme necessário)
  CASE v_rule.condition_type
    WHEN 'absence' THEN
      -- Alerta de ausência prolongada
      FOR v_entity IN 
        SELECT DISTINCT s.id as student_id, s.school_id
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id 
          AND a.data >= CURRENT_DATE - INTERVAL '15 days'
        WHERE s.is_active = true
        GROUP BY s.id, s.school_id
        HAVING COUNT(a.id) = 0 OR COUNT(a.id) FILTER (WHERE a.presente = true) = 0
      LOOP
        PERFORM generate_automatic_alert(
          p_rule_id,
          'student',
          v_entity.student_id,
          jsonb_build_object('school_id', v_entity.school_id, 'days_absent', 15)
        );
        v_count := v_count + 1;
      END LOOP;
      
    WHEN 'performance' THEN
      -- Alerta de baixo desempenho (exemplo simplificado)
      FOR v_entity IN
        SELECT s.id as student_id, s.school_id
        FROM students s
        WHERE s.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM peis p
          WHERE p.student_id = s.id
          AND p.status = 'approved'
        )
      LOOP
        PERFORM generate_automatic_alert(
          p_rule_id,
          'student',
          v_entity.student_id,
          jsonb_build_object('school_id', v_entity.school_id, 'reason', 'sem_pei_aprovado')
        );
        v_count := v_count + 1;
      END LOOP;
      
    ELSE
      -- Outros tipos de condições
      NULL;
  END CASE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3. Executar verificação de todas as regras ativas
CREATE OR REPLACE FUNCTION run_automatic_alerts_check()
RETURNS integer AS $$
DECLARE
  v_rule RECORD;
  v_total_count integer := 0;
BEGIN
  FOR v_rule IN 
    SELECT id FROM alert_rules 
    WHERE is_active = true
    AND check_frequency IN ('realtime', 'hourly', 'daily')
  LOOP
    v_total_count := v_total_count + check_and_generate_alerts(v_rule.id);
  END LOOP;
  
  RETURN v_total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4. Enviar notificações do alerta
CREATE OR REPLACE FUNCTION send_alert_notifications(p_alert_id uuid)
RETURNS void AS $$
DECLARE
  v_alert RECORD;
  v_rule RECORD;
  v_user RECORD;
  v_notification_id uuid;
BEGIN
  SELECT a.*, ar.notification_channels, ar.target_roles, ar.target_schools
  INTO v_alert, v_rule
  FROM automatic_alerts a
  INNER JOIN alert_rules ar ON ar.id = a.alert_rule_id
  WHERE a.id = p_alert_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Enviar notificação no dashboard para usuários com roles alvo
  FOR v_user IN
    SELECT DISTINCT p.id, p.tenant_id, p.school_id
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE 
      ur.role = ANY(v_rule.target_roles)
      AND (
        array_length(v_rule.target_schools, 1) IS NULL 
        OR p.school_id = ANY(v_rule.target_schools)
        OR p.tenant_id = v_alert.tenant_id
      )
  LOOP
    -- Criar notificação
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      metadata
    ) VALUES (
      v_user.id,
      'alert',
      'Alerta Automático',
      v_alert.alert_message,
      format('/alerts/%s', p_alert_id),
      jsonb_build_object('alert_id', p_alert_id, 'alert_type', v_alert.alert_type)
    )
    RETURNING id INTO v_notification_id;
    
    -- Registrar envio
    UPDATE automatic_alerts
    SET notifications_sent = notifications_sent || jsonb_build_object(
      'channel', 'dashboard',
      'sent_at', NOW(),
      'recipient_id', v_user.id,
      'notification_id', v_notification_id
    )
    WHERE id = p_alert_id;
  END LOOP;
  
  -- TODO: Implementar envio por email, SMS, push quando necessário
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.5. Reconhecer alerta
CREATE OR REPLACE FUNCTION acknowledge_alert(
  p_alert_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE automatic_alerts
  SET 
    status = 'acknowledged',
    acknowledged_by = COALESCE(p_user_id, auth.uid()),
    acknowledged_at = NOW()
  WHERE id = p_alert_id
  AND status = 'active';
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6. Resolver alerta
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id uuid,
  p_resolution_notes text,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE automatic_alerts
  SET 
    status = 'resolved',
    resolved_by = COALESCE(p_user_id, auth.uid()),
    resolved_at = NOW(),
    resolution_notes = p_resolution_notes
  WHERE id = p_alert_id
  AND status IN ('active', 'acknowledged');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.7. Obter alertas ativos
CREATE OR REPLACE FUNCTION get_active_alerts(
  p_tenant_id uuid DEFAULT NULL,
  p_school_id uuid DEFAULT NULL,
  p_alert_type text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  rule_code text,
  entity_type text,
  entity_id uuid,
  alert_type text,
  alert_message text,
  alert_data jsonb,
  school_id uuid,
  school_name text,
  generated_at timestamptz,
  acknowledged_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id,
    aa.rule_code,
    aa.entity_type,
    aa.entity_id,
    aa.alert_type,
    aa.alert_message,
    aa.alert_data,
    aa.school_id,
    s.school_name,
    aa.generated_at,
    aa.acknowledged_at
  FROM automatic_alerts aa
  LEFT JOIN schools s ON s.id = aa.school_id
  WHERE aa.status = 'active'
  AND (p_tenant_id IS NULL OR aa.tenant_id = p_tenant_id)
  AND (p_school_id IS NULL OR aa.school_id = p_school_id)
  AND (p_alert_type IS NULL OR aa.alert_type = p_alert_type)
  AND (aa.expires_at IS NULL OR aa.expires_at > NOW())
  ORDER BY 
    CASE aa.alert_type
      WHEN 'urgent' THEN 1
      WHEN 'critical' THEN 2
      WHEN 'warning' THEN 3
      ELSE 4
    END,
    aa.generated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 4: REGRAS DE ALERTA PADRÃO
-- ============================================================================

DO $$
BEGIN
  -- Regra 1: Ausência prolongada (15 dias)
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Ausência Prolongada',
    'Alerta quando aluno está ausente por 15 dias consecutivos',
    'ALERT_ABSENCE_15_DAYS',
    'student',
    'absence',
    jsonb_build_object('days', 15),
    'warning',
    'Aluno {entity_id} está ausente há 15 dias consecutivos',
    ARRAY['dashboard', 'email'],
    ARRAY['school_director', 'coordinator'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  -- Regra 2: Sem PEI aprovado
  INSERT INTO alert_rules (
    rule_name,
    rule_description,
    rule_code,
    entity_type,
    condition_type,
    condition_config,
    alert_type,
    alert_message_template,
    notification_channels,
    target_roles,
    check_frequency
  ) VALUES (
    'Aluno sem PEI Aprovado',
    'Alerta quando aluno com necessidade especial não possui PEI aprovado',
    'ALERT_NO_APPROVED_PEI',
    'student',
    'performance',
    jsonb_build_object('pei_status', 'approved'),
    'critical',
    'Aluno {entity_id} não possui PEI aprovado',
    ARRAY['dashboard', 'email'],
    ARRAY['education_secretary', 'school_director', 'coordinator'],
    'daily'
  )
  ON CONFLICT (rule_code) DO NOTHING;
  
  RAISE NOTICE '✅ Regras de alerta padrão criadas!';
END $$;

-- ============================================================================
-- PARTE 5: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automatic_alerts ENABLE ROW LEVEL SECURITY;

-- Regras: superadmin pode gerenciar
DROP POLICY IF EXISTS "Superadmin can manage alert rules" ON alert_rules;
CREATE POLICY "Superadmin can manage alert rules"
  ON alert_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Usuários podem ver regras ativas
DROP POLICY IF EXISTS "Users can view active alert rules" ON alert_rules;
CREATE POLICY "Users can view active alert rules"
  ON alert_rules FOR SELECT
  USING (is_active = true);

-- Alertas: usuários veem alertas do seu escopo
DROP POLICY IF EXISTS "Users can view alerts in their scope" ON automatic_alerts;
CREATE POLICY "Users can view alerts in their scope"
  ON automatic_alerts FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- Usuários podem reconhecer/resolver alertas
DROP POLICY IF EXISTS "Users can acknowledge alerts" ON automatic_alerts;
CREATE POLICY "Users can acknowledge alerts"
  ON automatic_alerts FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
    OR tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 6: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de alertas automáticos concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela alert_rules (regras de alertas)';
  RAISE NOTICE '  2. ✅ Criada tabela automatic_alerts (alertas gerados)';
  RAISE NOTICE '  3. ✅ Criadas funções: generate_automatic_alert, check_and_generate_alerts, run_automatic_alerts_check, send_alert_notifications, acknowledge_alert, resolve_alert, get_active_alerts';
  RAISE NOTICE '  4. ✅ Criadas 2 regras de alerta padrão (ausência, PEI)';
  RAISE NOTICE '  5. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface de gerenciamento de alertas';
  RAISE NOTICE '  - Configurar job para executar run_automatic_alerts_check periodicamente';
  RAISE NOTICE '  - Implementar notificações por email/SMS';
END $$;

