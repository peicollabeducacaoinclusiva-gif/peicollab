-- ============================================================================
-- MIGRAÇÃO: Sistema de Alertas e Monitoramento
-- Data: 15/02/2025
-- Descrição: 
--   1. Criar tabela student_alerts (Alertas de Alunos)
--   2. Criar tabela academic_trajectories (Trajetórias Acadêmicas)
--   3. Criar RPCs para gerar e gerenciar alertas
--   4. Criar funções de monitoramento em tempo real
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA student_alerts (Alertas de Alunos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tipo e severidade
  alert_type text NOT NULL CHECK (alert_type IN ('evasao', 'baixo_desempenho', 'ausencia_prolongada', 'frequencia_baixa', 'comportamento', 'outro')),
  severity text NOT NULL CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
  
  -- Descrição e ação
  description text NOT NULL,
  recommended_action text,
  
  -- Dados relacionados
  related_data jsonb DEFAULT '{}'::jsonb, -- Dados específicos do tipo de alerta
  
  -- Status
  acknowledged_by uuid REFERENCES profiles(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_student_alerts_student ON student_alerts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_alerts_school ON student_alerts(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_alerts_tenant ON student_alerts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_alerts_type ON student_alerts(alert_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_alerts_severity ON student_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_alerts_unresolved ON student_alerts(school_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_alerts_critical ON student_alerts(severity, resolved_at) WHERE severity = 'critica' AND resolved_at IS NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_student_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_alerts_updated_at_trigger ON student_alerts;
CREATE TRIGGER student_alerts_updated_at_trigger
  BEFORE UPDATE ON student_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_student_alerts_updated_at();

-- Comentários
COMMENT ON TABLE student_alerts IS 
  'Sistema de alertas para identificar alunos em risco (evasão, baixo desempenho, ausência prolongada).';

COMMENT ON COLUMN student_alerts.related_data IS 
  'Dados específicos do alerta: {attendance_rate, grade_average, days_absent, etc.}';

-- ============================================================================
-- PARTE 2: TABELA academic_trajectories (Trajetórias Acadêmicas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS academic_trajectories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year integer NOT NULL,
  
  -- Dados da trajetória
  trajectory_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- Histórico completo
  
  -- Indicadores de desempenho
  performance_indicators jsonb DEFAULT '{}'::jsonb, -- {attendance_rate, grade_average, risk_level, etc.}
  
  -- Metadados
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, academic_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_academic_trajectories_student ON academic_trajectories(student_id, academic_year DESC);
CREATE INDEX IF NOT EXISTS idx_academic_trajectories_year ON academic_trajectories(academic_year);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_academic_trajectories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS academic_trajectories_updated_at_trigger ON academic_trajectories;
CREATE TRIGGER academic_trajectories_updated_at_trigger
  BEFORE UPDATE ON academic_trajectories
  FOR EACH ROW
  EXECUTE FUNCTION update_academic_trajectories_updated_at();

-- Comentários
COMMENT ON TABLE academic_trajectories IS 
  'Trajetórias acadêmicas dos alunos para acompanhamento de progresso e identificação de riscos.';

COMMENT ON COLUMN academic_trajectories.trajectory_data IS 
  'Histórico completo: {enrollments: [...], grades: [...], attendance: [...], interventions: [...]}';

COMMENT ON COLUMN academic_trajectories.performance_indicators IS 
  'Indicadores calculados: {attendance_rate, grade_average, risk_score, trend, etc.}';

-- ============================================================================
-- PARTE 3: RPCs PARA GERENCIAR ALERTAS
-- ============================================================================

-- 3.1. Verificar riscos de um aluno
CREATE OR REPLACE FUNCTION check_student_risks(
  p_student_id uuid,
  p_academic_year integer DEFAULT NULL
)
RETURNS TABLE (
  alert_type text,
  severity text,
  description text,
  recommended_action text,
  related_data jsonb
) AS $$
DECLARE
  v_academic_year integer;
  v_attendance_rate numeric;
  v_grade_average numeric;
  v_days_absent integer;
  v_last_attendance_date date;
BEGIN
  -- Determinar ano letivo
  IF p_academic_year IS NULL THEN
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::integer INTO v_academic_year;
  ELSE
    v_academic_year := p_academic_year;
  END IF;
  
  -- Calcular frequência (últimos 30 dias)
  SELECT 
    COUNT(*) FILTER (WHERE presenca = true)::numeric / NULLIF(COUNT(*), 0) * 100,
    COUNT(*) FILTER (WHERE presenca = false),
    MAX(data) FILTER (WHERE presenca = true)
  INTO v_attendance_rate, v_days_absent, v_last_attendance_date
  FROM attendance
  WHERE student_id = p_student_id
  AND data >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calcular média de notas (último bimestre)
  SELECT AVG(score)
  INTO v_grade_average
  FROM grades
  WHERE student_id = p_student_id
  AND created_at >= CURRENT_DATE - INTERVAL '90 days';
  
  -- Alerta: Frequência baixa
  IF v_attendance_rate IS NOT NULL AND v_attendance_rate < 75 THEN
    RETURN QUERY SELECT 
      'frequencia_baixa'::text,
      CASE 
        WHEN v_attendance_rate < 50 THEN 'critica'::text
        WHEN v_attendance_rate < 60 THEN 'alta'::text
        ELSE 'media'::text
      END,
      'Frequência escolar abaixo do recomendado: ' || ROUND(v_attendance_rate, 1) || '%'::text,
      'Contatar responsável e verificar motivos das faltas'::text,
      jsonb_build_object('attendance_rate', v_attendance_rate, 'days_absent', v_days_absent);
  END IF;
  
  -- Alerta: Ausência prolongada
  IF v_last_attendance_date IS NOT NULL AND v_last_attendance_date < CURRENT_DATE - INTERVAL '7 days' THEN
    RETURN QUERY SELECT 
      'ausencia_prolongada'::text,
      CASE 
        WHEN v_last_attendance_date < CURRENT_DATE - INTERVAL '15 days' THEN 'critica'::text
        ELSE 'alta'::text
      END,
      'Aluno ausente há ' || (CURRENT_DATE - v_last_attendance_date) || ' dias'::text,
      'Contato urgente com responsável e verificação de situação'::text,
      jsonb_build_object('last_attendance_date', v_last_attendance_date, 'days_absent', CURRENT_DATE - v_last_attendance_date);
  END IF;
  
  -- Alerta: Baixo desempenho
  IF v_grade_average IS NOT NULL AND v_grade_average < 6.0 THEN
    RETURN QUERY SELECT 
      'baixo_desempenho'::text,
      CASE 
        WHEN v_grade_average < 4.0 THEN 'alta'::text
        ELSE 'media'::text
      END,
      'Média de notas abaixo do esperado: ' || ROUND(v_grade_average, 1)::text,
      'Plano de intervenção pedagógica e acompanhamento individualizado'::text,
      jsonb_build_object('grade_average', v_grade_average);
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3.2. Gerar alertas em lote para uma escola
CREATE OR REPLACE FUNCTION generate_alerts_for_school(
  p_school_id uuid,
  p_academic_year integer DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  v_student RECORD;
  v_alert_count integer := 0;
  v_academic_year integer;
BEGIN
  -- Determinar ano letivo
  IF p_academic_year IS NULL THEN
    SELECT EXTRACT(YEAR FROM CURRENT_DATE)::integer INTO v_academic_year;
  ELSE
    v_academic_year := p_academic_year;
  END IF;
  
  -- Buscar tenant_id da escola
  DECLARE
    v_tenant_id uuid;
  BEGIN
    SELECT tenant_id INTO v_tenant_id FROM schools WHERE id = p_school_id;
    
    -- Iterar sobre alunos ativos da escola
    FOR v_student IN 
      SELECT id FROM students 
      WHERE school_id = p_school_id 
      AND is_active = true
    LOOP
      -- Verificar riscos e criar alertas
      INSERT INTO student_alerts (
        student_id,
        school_id,
        tenant_id,
        alert_type,
        severity,
        description,
        recommended_action,
        related_data
      )
      SELECT 
        v_student.id,
        p_school_id,
        v_tenant_id,
        alert_type,
        severity,
        description,
        recommended_action,
        related_data
      FROM check_student_risks(v_student.id, v_academic_year) AS risks
      WHERE NOT EXISTS (
        SELECT 1 FROM student_alerts
        WHERE student_id = v_student.id
        AND alert_type = risks.alert_type
        AND resolved_at IS NULL
      );
      
      GET DIAGNOSTICS v_alert_count = ROW_COUNT;
    END LOOP;
  END;
  
  RETURN v_alert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3. Reconhecer alerta
CREATE OR REPLACE FUNCTION acknowledge_alert(
  p_alert_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE student_alerts
  SET 
    acknowledged_by = COALESCE(p_user_id, auth.uid()),
    acknowledged_at = NOW()
  WHERE id = p_alert_id
  AND acknowledged_at IS NULL;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4. Resolver alerta
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id uuid,
  p_resolution_notes text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE student_alerts
  SET 
    resolved_at = NOW(),
    resolution_notes = p_resolution_notes,
    acknowledged_by = COALESCE(p_user_id, auth.uid())
  WHERE id = p_alert_id
  AND resolved_at IS NULL;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.5. Atualizar trajetória acadêmica
CREATE OR REPLACE FUNCTION update_academic_trajectory(
  p_student_id uuid,
  p_academic_year integer,
  p_trajectory_data jsonb DEFAULT NULL,
  p_performance_indicators jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_trajectory_id uuid;
BEGIN
  INSERT INTO academic_trajectories (
    student_id,
    academic_year,
    trajectory_data,
    performance_indicators
  ) VALUES (
    p_student_id,
    p_academic_year,
    COALESCE(p_trajectory_data, '{}'::jsonb),
    COALESCE(p_performance_indicators, '{}'::jsonb)
  )
  ON CONFLICT (student_id, academic_year)
  DO UPDATE SET
    trajectory_data = COALESCE(EXCLUDED.trajectory_data, academic_trajectories.trajectory_data),
    performance_indicators = COALESCE(EXCLUDED.performance_indicators, academic_trajectories.performance_indicators),
    updated_at = NOW()
  RETURNING id INTO v_trajectory_id;
  
  RETURN v_trajectory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6. Listar alertas
CREATE OR REPLACE FUNCTION get_student_alerts(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_student_id uuid DEFAULT NULL,
  p_alert_type text DEFAULT NULL,
  p_severity text DEFAULT NULL,
  p_resolved boolean DEFAULT false,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  student_id uuid,
  student_name text,
  school_id uuid,
  school_name text,
  alert_type text,
  severity text,
  description text,
  recommended_action text,
  related_data jsonb,
  acknowledged_by uuid,
  acknowledged_by_name text,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.student_id,
    s.name as student_name,
    sa.school_id,
    sch.school_name,
    sa.alert_type,
    sa.severity,
    sa.description,
    sa.recommended_action,
    sa.related_data,
    sa.acknowledged_by,
    ack.full_name as acknowledged_by_name,
    sa.acknowledged_at,
    sa.resolved_at,
    sa.resolution_notes,
    sa.created_at
  FROM student_alerts sa
  LEFT JOIN students s ON s.id = sa.student_id
  LEFT JOIN schools sch ON sch.id = sa.school_id
  LEFT JOIN profiles ack ON ack.id = sa.acknowledged_by
  WHERE 
    (p_school_id IS NULL OR sa.school_id = p_school_id)
    AND (p_tenant_id IS NULL OR sa.tenant_id = p_tenant_id)
    AND (p_student_id IS NULL OR sa.student_id = p_student_id)
    AND (p_alert_type IS NULL OR sa.alert_type = p_alert_type)
    AND (p_severity IS NULL OR sa.severity = p_severity)
    AND (
      (p_resolved = true AND sa.resolved_at IS NOT NULL)
      OR (p_resolved = false AND sa.resolved_at IS NULL)
    )
  ORDER BY 
    CASE sa.severity
      WHEN 'critica' THEN 1
      WHEN 'alta' THEN 2
      WHEN 'media' THEN 3
      ELSE 4
    END,
    sa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 4: RLS (Row Level Security)
-- ============================================================================

ALTER TABLE student_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_trajectories ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
DROP POLICY IF EXISTS "Superadmin full access to student_alerts" ON student_alerts;
CREATE POLICY "Superadmin full access to student_alerts"
  ON student_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'superadmin'
    )
  );

-- Profissionais da escola veem alertas dos alunos da escola
DROP POLICY IF EXISTS "School staff can view alerts in their school" ON student_alerts;
CREATE POLICY "School staff can view alerts in their school"
  ON student_alerts FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage alerts in their school" ON student_alerts;
CREATE POLICY "School staff can manage alerts in their school"
  ON student_alerts FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trajetórias: profissionais da escola veem trajetórias dos alunos
DROP POLICY IF EXISTS "School staff can view trajectories" ON academic_trajectories;
CREATE POLICY "School staff can view trajectories"
  ON academic_trajectories FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN profiles p ON p.school_id = s.school_id
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "School staff can manage trajectories" ON academic_trajectories;
CREATE POLICY "School staff can manage trajectories"
  ON academic_trajectories FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM students s
      INNER JOIN profiles p ON p.school_id = s.school_id
      WHERE p.id = auth.uid()
    )
  );

-- ============================================================================
-- PARTE 5: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de sistema de alertas e monitoramento concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Alterações aplicadas:';
  RAISE NOTICE '  1. ✅ Criada tabela student_alerts (alertas de alunos)';
  RAISE NOTICE '  2. ✅ Criada tabela academic_trajectories (trajetórias acadêmicas)';
  RAISE NOTICE '  3. ✅ Criados RPCs: check_student_risks, generate_alerts_for_school, acknowledge_alert, resolve_alert, update_academic_trajectory, get_student_alerts';
  RAISE NOTICE '  4. ✅ RLS policies aplicadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  - Criar interface no app Gestão Escolar (/alerts)';
  RAISE NOTICE '  - Integrar alertas no dashboard';
  RAISE NOTICE '  - Implementar geração automática de alertas (cron job)';
END $$;

