-- ============================================================================
-- MIGRAÇÃO: RPCs para KPIs do Dashboard do Secretário
-- Data: 15/02/2025
-- Descrição: Criar RPCs seguros para KPIs e performance de escolas
-- ============================================================================

-- ============================================================================
-- PARTE 1: KPIs da Rede (get_network_kpis)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_network_kpis(
  p_tenant_id uuid,
  p_period_start timestamptz DEFAULT NOW() - INTERVAL '1 month'
)
RETURNS TABLE (
  total_schools bigint,
  total_students bigint,
  students_with_pei bigint,
  total_peis bigint,
  peis_approved bigint,
  peis_pending bigint,
  peis_returned bigint,
  peis_draft bigint,
  avg_completion_time numeric,
  family_engagement_rate numeric,
  inclusion_rate numeric,
  compliance_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH network_stats AS (
    SELECT 
      COUNT(DISTINCT s.id) as total_schools,
      COUNT(DISTINCT st.id) as total_students,
      COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN st.id END) as students_with_pei,
      COUNT(DISTINCT p.id) as total_peis,
      COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as peis_approved,
      COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as peis_pending,
      COUNT(DISTINCT CASE WHEN p.status = 'returned' THEN p.id END) as peis_returned,
      COUNT(DISTINCT CASE WHEN p.status = 'draft' THEN p.id END) as peis_draft
    FROM schools s
    LEFT JOIN students st ON st.school_id = s.id
    LEFT JOIN peis p ON p.student_id = st.id 
      AND p.created_at >= p_period_start
    WHERE s.tenant_id = p_tenant_id
      AND s.is_active = true
  ),
  completion_times AS (
    SELECT 
      AVG(EXTRACT(EPOCH FROM (p.updated_at - p.created_at)) / 86400)::numeric(10,2) as avg_days
    FROM peis p
    INNER JOIN students st ON st.id = p.student_id
    INNER JOIN schools s ON s.id = st.school_id
    WHERE s.tenant_id = p_tenant_id
      AND p.status = 'approved'
      AND p.created_at >= p_period_start
  ),
  engagement_stats AS (
    SELECT 
      COUNT(DISTINCT st.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM family_access_tokens fat 
          WHERE fat.student_id = st.id 
            AND fat.created_at >= p_period_start
        ) OR EXISTS (
          SELECT 1 FROM pei_meetings pm 
          WHERE pm.student_id = st.id 
            AND pm.attended = true
            AND pm.meeting_date >= p_period_start::date
        ) OR EXISTS (
          SELECT 1 FROM pei_evaluations pe 
          WHERE pe.student_id = st.id 
            AND pe.family_feedback IS NOT NULL
            AND pe.created_at >= p_period_start
        )
      )::numeric as engaged_students,
      COUNT(DISTINCT st.id)::numeric as total_students
    FROM students st
    INNER JOIN schools s ON s.id = st.school_id
    WHERE s.tenant_id = p_tenant_id
  )
  SELECT 
    ns.total_schools,
    ns.total_students,
    ns.students_with_pei,
    ns.total_peis,
    ns.peis_approved,
    ns.peis_pending,
    ns.peis_returned,
    ns.peis_draft,
    COALESCE(ct.avg_days, 0)::numeric(10,2) as avg_completion_time,
    CASE 
      WHEN es.total_students > 0 
      THEN (es.engaged_students / es.total_students * 100)::numeric(5,2)
      ELSE 0::numeric(5,2)
    END as family_engagement_rate,
    CASE 
      WHEN ns.total_students > 0 
      THEN (ns.students_with_pei::numeric / ns.total_students::numeric * 100)::numeric(5,2)
      ELSE 0::numeric(5,2)
    END as inclusion_rate,
    CASE 
      WHEN ns.total_peis > 0 
      THEN (ns.peis_approved::numeric / ns.total_peis::numeric * 100)::numeric(5,2)
      ELSE 0::numeric(5,2)
    END as compliance_rate
  FROM network_stats ns
  CROSS JOIN LATERAL (SELECT COALESCE(avg_days, 0) as avg_days FROM completion_times) ct
  CROSS JOIN LATERAL (SELECT COALESCE(engaged_students, 0) as engaged_students, COALESCE(total_students, 1) as total_students FROM engagement_stats) es;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 2: Performance por Escola (get_school_performance)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_school_performance(
  p_tenant_id uuid,
  p_period_start timestamptz DEFAULT NOW() - INTERVAL '1 month'
)
RETURNS TABLE (
  school_id uuid,
  school_name text,
  director text,
  total_students bigint,
  students_with_pei bigint,
  total_peis bigint,
  approved_peis bigint,
  pending_peis bigint,
  returned_peis bigint,
  average_time_to_approval numeric,
  family_engagement numeric,
  last_activity timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH school_stats AS (
    SELECT 
      s.id as school_id,
      s.school_name,
      COALESCE(
        (SELECT p.full_name FROM profiles p 
         INNER JOIN professionals pr ON pr.user_id = p.id 
         WHERE pr.school_id = s.id 
           AND pr.role = 'diretor' 
           AND pr.is_active = true 
         LIMIT 1),
        'Não informado'
      ) as director,
      COUNT(DISTINCT st.id) as total_students,
      COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN st.id END) as students_with_pei,
      COUNT(DISTINCT p.id) as total_peis,
      COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_peis,
      COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_peis,
      COUNT(DISTINCT CASE WHEN p.status = 'returned' THEN p.id END) as returned_peis,
      AVG(EXTRACT(EPOCH FROM (p.updated_at - p.created_at)) / 86400) FILTER (
        WHERE p.status = 'approved'
      )::numeric(10,2) as avg_time,
      MAX(GREATEST(
        COALESCE((SELECT MAX(created_at) FROM peis WHERE student_id = st.id), '1970-01-01'::timestamptz),
        COALESCE((SELECT MAX(updated_at) FROM peis WHERE student_id = st.id), '1970-01-01'::timestamptz)
      )) as last_activity
    FROM schools s
    LEFT JOIN students st ON st.school_id = s.id
    LEFT JOIN peis p ON p.student_id = st.id 
      AND p.created_at >= p_period_start
    WHERE s.tenant_id = p_tenant_id
      AND s.is_active = true
    GROUP BY s.id, s.school_name
  ),
  engagement_by_school AS (
    SELECT 
      s.id as school_id,
      CASE 
        WHEN COUNT(DISTINCT st.id) > 0 
        THEN (
          COUNT(DISTINCT st.id) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM family_access_tokens fat 
              WHERE fat.student_id = st.id 
                AND fat.created_at >= p_period_start
            ) OR EXISTS (
              SELECT 1 FROM pei_meetings pm 
              WHERE pm.student_id = st.id 
                AND pm.attended = true
                AND pm.meeting_date >= p_period_start::date
            ) OR EXISTS (
              SELECT 1 FROM pei_evaluations pe 
              WHERE pe.student_id = st.id 
                AND pe.family_feedback IS NOT NULL
                AND pe.created_at >= p_period_start
            )
          )::numeric / COUNT(DISTINCT st.id)::numeric * 100
        )::numeric(5,2)
        ELSE 0::numeric(5,2)
      END as engagement_rate
    FROM schools s
    LEFT JOIN students st ON st.school_id = s.id
    WHERE s.tenant_id = p_tenant_id
      AND s.is_active = true
    GROUP BY s.id
  )
  SELECT 
    ss.school_id,
    ss.school_name,
    ss.director,
    ss.total_students,
    ss.students_with_pei,
    ss.total_peis,
    ss.approved_peis,
    ss.pending_peis,
    ss.returned_peis,
    COALESCE(ss.avg_time, 0)::numeric(10,2) as average_time_to_approval,
    COALESCE(ebs.engagement_rate, 0)::numeric(5,2) as family_engagement,
    COALESCE(ss.last_activity, NOW()) as last_activity
  FROM school_stats ss
  LEFT JOIN engagement_by_school ebs ON ebs.school_id = ss.school_id
  ORDER BY ss.school_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de RPCs de KPIs do Dashboard concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'RPCs criados:';
  RAISE NOTICE '  1. ✅ get_network_kpis - KPIs agregados da rede (filtrado por tenant_id)';
  RAISE NOTICE '  2. ✅ get_school_performance - Performance detalhada por escola (filtrado por tenant_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Segurança:';
  RAISE NOTICE '  - Todos os RPCs filtram por tenant_id';
  RAISE NOTICE '  - SECURITY DEFINER para garantir acesso controlado';
  RAISE NOTICE '  - STABLE para otimização de cache';
END $$;

