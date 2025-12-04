-- ============================================================================
-- MIGRAÇÃO: RPCs para Dados Históricos de Gráficos
-- Data: 15/02/2025
-- Descrição: Criar RPCs para buscar dados históricos para gráficos
-- ============================================================================

-- ============================================================================
-- PARTE 1: Histórico de Status de PEIs
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pei_status_history(
  p_tenant_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_date date,
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', p.created_at)::date as period_date,
    p.status,
    COUNT(*)::bigint as count
  FROM peis p
  INNER JOIN students s ON s.id = p.student_id
  INNER JOIN schools sc ON sc.id = s.school_id
  WHERE sc.tenant_id = p_tenant_id
  AND DATE_TRUNC('month', p.created_at)::date >= p_start_date
  AND DATE_TRUNC('month', p.created_at)::date <= p_end_date
  GROUP BY DATE_TRUNC('month', p.created_at)::date, p.status
  ORDER BY period_date, p.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 2: Histórico de Engajamento Familiar
-- ============================================================================

CREATE OR REPLACE FUNCTION get_family_engagement_history(
  p_tenant_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_date date,
  engagement_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_engagement AS (
    SELECT 
      DATE_TRUNC('month', COALESCE(fat.created_at, pm.meeting_date, pe.created_at))::date as period_date,
      COUNT(DISTINCT s.id) FILTER (WHERE fat.id IS NOT NULL OR pm.id IS NOT NULL OR pe.id IS NOT NULL)::numeric as engaged_students,
      COUNT(DISTINCT s.id)::numeric as total_students
    FROM students s
    INNER JOIN schools sc ON sc.id = s.school_id
    LEFT JOIN family_access_tokens fat ON fat.student_id = s.id 
      AND DATE_TRUNC('month', fat.created_at)::date >= p_start_date
      AND DATE_TRUNC('month', fat.created_at)::date <= p_end_date
    LEFT JOIN pei_meetings pm ON pm.student_id = s.id 
      AND pm.attended = true
      AND DATE_TRUNC('month', pm.meeting_date)::date >= p_start_date
      AND DATE_TRUNC('month', pm.meeting_date)::date <= p_end_date
    LEFT JOIN pei_evaluations pe ON pe.student_id = s.id 
      AND pe.family_feedback IS NOT NULL
      AND DATE_TRUNC('month', pe.created_at)::date >= p_start_date
      AND DATE_TRUNC('month', pe.created_at)::date <= p_end_date
    WHERE sc.tenant_id = p_tenant_id
    GROUP BY DATE_TRUNC('month', COALESCE(fat.created_at, pm.meeting_date, pe.created_at))::date
  )
  SELECT 
    period_date,
    CASE 
      WHEN total_students > 0 THEN (engaged_students / total_students * 100)
      ELSE 0
    END::numeric(5,2) as engagement_rate
  FROM monthly_engagement
  WHERE period_date IS NOT NULL
  ORDER BY period_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: Histórico de Performance por Escola
-- ============================================================================

CREATE OR REPLACE FUNCTION get_school_performance_history(
  p_school_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_date date,
  performance_score numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_performance AS (
    SELECT 
      DATE_TRUNC('month', p.created_at)::date as period_date,
      AVG(
        CASE 
          WHEN p.status = 'approved' THEN 100
          WHEN p.status = 'pending' THEN 50
          WHEN p.status = 'returned' THEN 25
          ELSE 0
        END
      )::numeric(5,2) as performance_score
    FROM peis p
    INNER JOIN students s ON s.id = p.student_id
    WHERE s.school_id = p_school_id
    AND DATE_TRUNC('month', p.created_at)::date >= p_start_date
    AND DATE_TRUNC('month', p.created_at)::date <= p_end_date
    GROUP BY DATE_TRUNC('month', p.created_at)::date
  )
  SELECT period_date, performance_score
  FROM monthly_performance
  ORDER BY period_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 4: Histórico de Métricas de Inclusão
-- ============================================================================

CREATE OR REPLACE FUNCTION get_inclusion_metrics_history(
  p_tenant_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '12 months',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_date date,
  inclusion_rate numeric,
  compliance_rate numeric,
  engagement_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_metrics AS (
    SELECT 
      DATE_TRUNC('month', p.created_at)::date as period_date,
      -- Taxa de inclusão: alunos com PEI / total de alunos
      COUNT(DISTINCT s.id) FILTER (WHERE p.id IS NOT NULL)::numeric / 
        NULLIF(COUNT(DISTINCT s.id), 0) * 100 as inclusion_rate,
      -- Taxa de conformidade: PEIs aprovados / total de PEIs
      COUNT(*) FILTER (WHERE p.status = 'approved')::numeric / 
        NULLIF(COUNT(*), 0) * 100 as compliance_rate,
      -- Taxa de engajamento (simplificado)
      COUNT(DISTINCT s.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM family_access_tokens fat WHERE fat.student_id = s.id
        ) OR EXISTS (
          SELECT 1 FROM pei_meetings pm WHERE pm.student_id = s.id AND pm.attended = true
        )
      )::numeric / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as engagement_rate
    FROM students s
    INNER JOIN schools sc ON sc.id = s.school_id
    LEFT JOIN peis p ON p.student_id = s.id
      AND DATE_TRUNC('month', p.created_at)::date >= p_start_date
      AND DATE_TRUNC('month', p.created_at)::date <= p_end_date
    WHERE sc.tenant_id = p_tenant_id
    GROUP BY DATE_TRUNC('month', p.created_at)::date
  )
  SELECT 
    period_date,
    COALESCE(inclusion_rate, 0)::numeric(5,2) as inclusion_rate,
    COALESCE(compliance_rate, 0)::numeric(5,2) as compliance_rate,
    COALESCE(engagement_rate, 0)::numeric(5,2) as engagement_rate
  FROM monthly_metrics
  WHERE period_date IS NOT NULL
  ORDER BY period_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 5: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de RPCs de dados históricos concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'RPCs criados:';
  RAISE NOTICE '  1. ✅ get_pei_status_history - Histórico de status de PEIs';
  RAISE NOTICE '  2. ✅ get_family_engagement_history - Histórico de engajamento familiar';
  RAISE NOTICE '  3. ✅ get_school_performance_history - Histórico de performance por escola';
  RAISE NOTICE '  4. ✅ get_inclusion_metrics_history - Histórico de métricas de inclusão';
END $$;

