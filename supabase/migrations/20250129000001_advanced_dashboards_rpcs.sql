-- ============================================================================
-- MIGRAÇÃO: RPCs para Dashboards Avançados
-- Data: 29/01/2025
-- Descrição: Criar RPCs para métricas de frequência, risco, evolução, inclusão
-- ============================================================================

-- ============================================================================
-- PARTE 1: Métricas de Frequência por Escola
-- ============================================================================

CREATE OR REPLACE FUNCTION get_school_attendance_metrics(
  p_school_id uuid,
  p_period_start date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_period_end date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_students bigint,
  average_attendance_rate numeric,
  students_low_attendance bigint,
  attendance_trend jsonb,
  class_attendance jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH student_attendance AS (
    SELECT 
      st.id as student_id,
      COUNT(DISTINCT de.date)::numeric / GREATEST(
        COUNT(DISTINCT d.date) FILTER (WHERE d.date BETWEEN p_period_start AND p_period_end),
        1
      )::numeric * 100 as attendance_rate
    FROM students st
    LEFT JOIN enrollments e ON e.student_id = st.id AND e.school_id = p_school_id
    LEFT JOIN diary_entries de ON de.enrollment_id = e.id 
      AND de.attendance_status = 'present'
      AND de.date BETWEEN p_period_start AND p_period_end
    LEFT JOIN LATERAL (
      SELECT date::date 
      FROM generate_series(p_period_start, p_period_end, '1 day'::interval) date
      WHERE EXTRACT(DOW FROM date) BETWEEN 1 AND 5 -- Dias úteis
    ) d ON true
    WHERE st.school_id = p_school_id
    GROUP BY st.id
  ),
  daily_trend AS (
    SELECT 
      de.date::date as date,
      COUNT(DISTINCT CASE WHEN de.attendance_status = 'present' THEN de.enrollment_id END)::numeric /
      NULLIF(COUNT(DISTINCT de.enrollment_id), 0)::numeric * 100 as rate
    FROM diary_entries de
    INNER JOIN enrollments e ON e.id = de.enrollment_id
    WHERE e.school_id = p_school_id
      AND de.date BETWEEN p_period_start AND p_period_end
      AND EXTRACT(DOW FROM de.date) BETWEEN 1 AND 5
    GROUP BY de.date::date
    ORDER BY de.date
  ),
  class_metrics AS (
    SELECT 
      c.class_name,
      COUNT(DISTINCT e.student_id) as total_students,
      AVG(sa.attendance_rate) as avg_rate
    FROM classes c
    LEFT JOIN enrollments e ON e.class_id = c.id AND e.school_id = p_school_id
    LEFT JOIN student_attendance sa ON sa.student_id = e.student_id
    WHERE c.school_id = p_school_id
    GROUP BY c.id, c.class_name
  )
  SELECT 
    COUNT(DISTINCT sa.student_id)::bigint as total_students,
    COALESCE(AVG(sa.attendance_rate), 0)::numeric(5,2) as average_attendance_rate,
    COUNT(DISTINCT CASE WHEN sa.attendance_rate < 75 THEN sa.student_id END)::bigint as students_low_attendance,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'date', dt.date,
        'rate', ROUND(dt.rate::numeric, 2)
      ) ORDER BY dt.date
    ) FILTER (WHERE dt.date IS NOT NULL), '[]'::jsonb) as attendance_trend,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'class_name', cm.class_name,
        'total_students', cm.total_students,
        'avg_attendance_rate', ROUND(cm.avg_rate::numeric, 2)
      )
    ) FILTER (WHERE cm.class_name IS NOT NULL), '[]'::jsonb) as class_attendance
  FROM student_attendance sa
  CROSS JOIN LATERAL (SELECT * FROM daily_trend) dt
  CROSS JOIN LATERAL (SELECT * FROM class_metrics) cm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 2: Alunos com Risco
-- ============================================================================

CREATE OR REPLACE FUNCTION get_students_at_risk(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL,
  p_risk_type text DEFAULT 'all'
)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  class_name text,
  risk_type text,
  risk_level text,
  risk_factors jsonb,
  last_updated timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH risk_indicators AS (
    SELECT 
      st.id as student_id,
      st.name as student_name,
      c.class_name,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de.attendance_status IN ('absent', 'late')
          GROUP BY de.enrollment_id
          HAVING COUNT(*)::numeric / NULLIF(
            COUNT(*) FILTER (WHERE de.date >= CURRENT_DATE - INTERVAL '30 days'),
            1
          ) > 0.25
        ) THEN 'attendance'
        WHEN EXISTS (
          SELECT 1 FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de.grade IS NOT NULL
            AND de.grade::numeric < 6.0
          GROUP BY de.enrollment_id
          HAVING AVG(de.grade::numeric) < 6.0
        ) THEN 'grades'
        WHEN NOT EXISTS (
          SELECT 1 FROM peis p
          WHERE p.student_id = st.id
            AND p.status = 'approved'
        ) AND EXISTS (
          SELECT 1 FROM students st2
          WHERE st2.id = st.id
            AND st2.special_needs IS NOT NULL
        ) THEN 'inclusion'
        ELSE NULL
      END as risk_type,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '7 days'
            AND de.attendance_status IN ('absent', 'late')
          GROUP BY de.enrollment_id
          HAVING COUNT(*) >= 3
        ) THEN 'critical'
        WHEN EXISTS (
          SELECT 1 FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de.attendance_status IN ('absent', 'late')
          GROUP BY de.enrollment_id
          HAVING COUNT(*)::numeric / NULLIF(
            COUNT(*) FILTER (WHERE de.date >= CURRENT_DATE - INTERVAL '30 days'),
            1
          ) > 0.50
        ) THEN 'high'
        WHEN EXISTS (
          SELECT 1 FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de.attendance_status IN ('absent', 'late')
          GROUP BY de.enrollment_id
          HAVING COUNT(*)::numeric / NULLIF(
            COUNT(*) FILTER (WHERE de.date >= CURRENT_DATE - INTERVAL '30 days'),
            1
          ) > 0.25
        ) THEN 'medium'
        ELSE 'low'
      END as risk_level,
      jsonb_build_object(
        'attendance_rate', (
          SELECT COUNT(*) FILTER (WHERE de.attendance_status = 'present')::numeric /
          NULLIF(COUNT(*), 0) * 100
          FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'avg_grade', (
          SELECT AVG(de.grade::numeric)
          FROM diary_entries de
          INNER JOIN enrollments e ON e.id = de.enrollment_id
          WHERE e.student_id = st.id
            AND de.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de.grade IS NOT NULL
        ),
        'has_pei', EXISTS (
          SELECT 1 FROM peis p
          WHERE p.student_id = st.id
            AND p.status = 'approved'
        )
      ) as risk_factors,
      CURRENT_TIMESTAMP as last_updated
    FROM students st
    LEFT JOIN enrollments e ON e.student_id = st.id AND e.status = 'active'
    LEFT JOIN classes c ON c.id = e.class_id
    WHERE 
      (p_school_id IS NULL OR st.school_id = p_school_id)
      AND (p_tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM schools s
        WHERE s.id = st.school_id
          AND s.tenant_id = p_tenant_id
      ))
      AND (
        -- Frequência baixa
        EXISTS (
          SELECT 1 FROM diary_entries de2
          INNER JOIN enrollments e2 ON e2.id = de2.enrollment_id
          WHERE e2.student_id = st.id
            AND de2.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de2.attendance_status IN ('absent', 'late')
          GROUP BY de2.enrollment_id
          HAVING COUNT(*)::numeric / NULLIF(
            COUNT(*) FILTER (WHERE de2.date >= CURRENT_DATE - INTERVAL '30 days'),
            1
          ) > 0.25
        )
        OR
        -- Notas baixas
        EXISTS (
          SELECT 1 FROM diary_entries de3
          INNER JOIN enrollments e3 ON e3.id = de3.enrollment_id
          WHERE e3.student_id = st.id
            AND de3.date >= CURRENT_DATE - INTERVAL '30 days'
            AND de3.grade IS NOT NULL
            AND de3.grade::numeric < 6.0
          GROUP BY de3.enrollment_id
          HAVING AVG(de3.grade::numeric) < 6.0
        )
        OR
        -- Sem PEI mas com necessidade especial
        (
          NOT EXISTS (
            SELECT 1 FROM peis p2
            WHERE p2.student_id = st.id
              AND p2.status = 'approved'
          )
          AND st.special_needs IS NOT NULL
        )
      )
  )
  SELECT 
    ri.student_id,
    ri.student_name,
    ri.class_name,
    ri.risk_type,
    ri.risk_level,
    ri.risk_factors,
    ri.last_updated
  FROM risk_indicators ri
  WHERE ri.risk_type IS NOT NULL
    AND (p_risk_type = 'all' OR ri.risk_type = p_risk_type)
  ORDER BY 
    CASE ri.risk_level
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    ri.student_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 3: Evolução das Turmas
-- ============================================================================

CREATE OR REPLACE FUNCTION get_class_evolution(
  p_school_id uuid,
  p_period_start date DEFAULT CURRENT_DATE - INTERVAL '90 days',
  p_period_end date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  class_id uuid,
  class_name text,
  total_students bigint,
  attendance_evolution jsonb,
  grades_evolution jsonb,
  performance_trend text
) AS $$
BEGIN
  RETURN QUERY
  WITH class_data AS (
    SELECT 
      c.id as class_id,
      c.class_name,
      COUNT(DISTINCT e.student_id) as total_students
    FROM classes c
    LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'active'
    WHERE c.school_id = p_school_id
    GROUP BY c.id, c.class_name
  ),
  monthly_attendance AS (
    SELECT 
      c.id as class_id,
      DATE_TRUNC('month', de.date)::date as month,
      COUNT(DISTINCT CASE WHEN de.attendance_status = 'present' THEN de.enrollment_id END)::numeric /
      NULLIF(COUNT(DISTINCT de.enrollment_id), 0)::numeric * 100 as attendance_rate
    FROM classes c
    INNER JOIN enrollments e ON e.class_id = c.id
    INNER JOIN diary_entries de ON de.enrollment_id = e.id
    WHERE c.school_id = p_school_id
      AND de.date BETWEEN p_period_start AND p_period_end
    GROUP BY c.id, DATE_TRUNC('month', de.date)
  ),
  monthly_grades AS (
    SELECT 
      c.id as class_id,
      DATE_TRUNC('month', de.date)::date as month,
      AVG(de.grade::numeric) as avg_grade
    FROM classes c
    INNER JOIN enrollments e ON e.class_id = c.id
    INNER JOIN diary_entries de ON de.enrollment_id = e.id
    WHERE c.school_id = p_school_id
      AND de.date BETWEEN p_period_start AND p_period_end
      AND de.grade IS NOT NULL
    GROUP BY c.id, DATE_TRUNC('month', de.date)
  )
  SELECT 
    cd.class_id,
    cd.class_name,
    cd.total_students,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'month', ma.month,
        'rate', ROUND(ma.attendance_rate::numeric, 2)
      ) ORDER BY ma.month
    ) FILTER (WHERE ma.month IS NOT NULL), '[]'::jsonb) as attendance_evolution,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'month', mg.month,
        'avg_grade', ROUND(mg.avg_grade::numeric, 2)
      ) ORDER BY mg.month
    ) FILTER (WHERE mg.month IS NOT NULL), '[]'::jsonb) as grades_evolution,
    CASE
      WHEN (
        SELECT ma2.attendance_rate 
        FROM monthly_attendance ma2
        WHERE ma2.class_id = cd.class_id
        ORDER BY ma2.month DESC
        LIMIT 1
      ) > (
        SELECT ma3.attendance_rate 
        FROM monthly_attendance ma3
        WHERE ma3.class_id = cd.class_id
        ORDER BY ma3.month ASC
        LIMIT 1
      ) THEN 'melhorando'
      WHEN (
        SELECT ma2.attendance_rate 
        FROM monthly_attendance ma2
        WHERE ma2.class_id = cd.class_id
        ORDER BY ma2.month DESC
        LIMIT 1
      ) < (
        SELECT ma3.attendance_rate 
        FROM monthly_attendance ma3
        WHERE ma3.class_id = cd.class_id
        ORDER BY ma3.month ASC
        LIMIT 1
      ) THEN 'piorando'
      ELSE 'estável'
    END as performance_trend
  FROM class_data cd
  LEFT JOIN monthly_attendance ma ON ma.class_id = cd.class_id
  LEFT JOIN monthly_grades mg ON mg.class_id = cd.class_id
  GROUP BY cd.class_id, cd.class_name, cd.total_students
  ORDER BY cd.class_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PARTE 4: Indicadores de Inclusão e AEE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_inclusion_metrics(
  p_school_id uuid DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_students_with_needs bigint,
  students_with_pei bigint,
  students_with_aee bigint,
  pei_coverage_rate numeric,
  aee_coverage_rate numeric,
  needs_distribution jsonb,
  aee_effectiveness numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH students_needs AS (
    SELECT 
      st.id as student_id,
      st.special_needs,
      EXISTS (
        SELECT 1 FROM peis p
        WHERE p.student_id = st.id
          AND p.status = 'approved'
      ) as has_pei,
      EXISTS (
        SELECT 1 FROM aee_plans ap
        WHERE ap.student_id = st.id
          AND ap.status = 'active'
      ) as has_aee
    FROM students st
    WHERE 
      (p_school_id IS NULL OR st.school_id = p_school_id)
      AND (p_tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM schools s
        WHERE s.id = st.school_id
          AND s.tenant_id = p_tenant_id
      ))
      AND st.special_needs IS NOT NULL
  ),
  needs_count AS (
    SELECT 
      sn.special_needs,
      COUNT(*) as count
    FROM students_needs sn
    GROUP BY sn.special_needs
  ),
  aee_progress AS (
    SELECT 
      AVG(
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM aee_evaluations ae
            WHERE ae.student_id = sn.student_id
              AND ae.evaluation_date >= CURRENT_DATE - INTERVAL '90 days'
              AND ae.progress_level IN ('excellent', 'good')
          ) THEN 100
          WHEN EXISTS (
            SELECT 1 FROM aee_evaluations ae2
            WHERE ae2.student_id = sn.student_id
              AND ae2.evaluation_date >= CURRENT_DATE - INTERVAL '90 days'
              AND ae2.progress_level = 'satisfactory'
          ) THEN 70
          ELSE 50
        END
      ) as effectiveness
    FROM students_needs sn
    WHERE sn.has_aee = true
  )
  SELECT 
    COUNT(*)::bigint as total_students_with_needs,
    COUNT(*) FILTER (WHERE sn.has_pei)::bigint as students_with_pei,
    COUNT(*) FILTER (WHERE sn.has_aee)::bigint as students_with_aee,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE sn.has_pei)::numeric / COUNT(*)::numeric * 100)::numeric(5,2)
      ELSE 0::numeric(5,2)
    END as pei_coverage_rate,
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE sn.has_aee)::numeric / COUNT(*)::numeric * 100)::numeric(5,2)
      ELSE 0::numeric(5,2)
    END as aee_coverage_rate,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'need', nc.special_needs,
        'count', nc.count
      )
    ) FILTER (WHERE nc.special_needs IS NOT NULL), '[]'::jsonb) as needs_distribution,
    COALESCE((SELECT effectiveness FROM aee_progress), 0)::numeric(5,2) as aee_effectiveness
  FROM students_needs sn
  LEFT JOIN needs_count nc ON true
  CROSS JOIN LATERAL (SELECT * FROM aee_progress) ap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- LOG DE MIGRAÇÃO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração de RPCs para Dashboards Avançados concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'RPCs criados:';
  RAISE NOTICE '  1. ✅ get_school_attendance_metrics - Métricas de frequência por escola';
  RAISE NOTICE '  2. ✅ get_students_at_risk - Alunos com risco de aprendizagem/inclusão';
  RAISE NOTICE '  3. ✅ get_class_evolution - Evolução das turmas ao longo do tempo';
  RAISE NOTICE '  4. ✅ get_inclusion_metrics - Indicadores de inclusão e AEE';
END $$;

