-- ============================================================================
-- MIGRAÇÃO: Endpoints Centralizados para Superficha
-- Data: 27/01/2025
-- Descrição: Criar RPCs centralizados para dados completos da Superficha
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO: get_student_complete_profile
-- Retorna todos os dados do estudante em uma única query otimizada
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_complete_profile(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'student', (
      SELECT to_jsonb(s.*)
      FROM students s
      WHERE s.id = p_student_id
    ),
    'school', (
      SELECT jsonb_build_object(
        'id', sc.id,
        'school_name', sc.school_name,
        'school_address', sc.school_address,
        'school_email', sc.school_email,
        'school_phone', sc.school_phone,
        'director_name', sc.school_responsible
      )
      FROM schools sc
      INNER JOIN students s ON s.school_id = sc.id
      WHERE s.id = p_student_id
    ),
    'tenant', (
      SELECT jsonb_build_object(
        'id', t.id,
        'network_name', t.network_name,
        'network_address', t.network_address,
        'network_phone', t.network_phone,
        'network_email', t.network_email
      )
      FROM tenants t
      INNER JOIN students s ON s.tenant_id = t.id
      WHERE s.id = p_student_id
    ),
    'active_pei', (
      SELECT jsonb_build_object(
        'id', p.id,
        'status', p.status,
        'version_number', p.version_number,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'goals', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', g.id,
              'description', g.description,
              'category', g.category,
              'progress_level', g.progress_level
            )
          ), '[]'::jsonb)
          FROM pei_goals g
          WHERE g.pei_id = p.id
        ),
        'barriers', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', b.id,
              'barrier_type', b.barrier_type,
              'description', b.description,
              'severity', b.severity
            )
          ), '[]'::jsonb)
          FROM pei_barriers b
          WHERE b.pei_id = p.id
        ),
        'goals_count', (SELECT COUNT(*) FROM pei_goals WHERE pei_id = p.id),
        'barriers_count', (SELECT COUNT(*) FROM pei_barriers WHERE pei_id = p.id)
      )
      FROM peis p
      WHERE p.student_id = p_student_id AND p.is_active_version = true
      ORDER BY p.created_at DESC
      LIMIT 1
    ),
    'active_aee', (
      SELECT jsonb_build_object(
        'id', aee.id,
        'status', aee.status,
        'created_at', aee.created_at,
        'updated_at', aee.updated_at,
        'resources', aee.resources,
        'adaptations', aee.adaptations
      )
      FROM plano_aee aee
      WHERE aee.student_id = p_student_id
      ORDER BY aee.created_at DESC
      LIMIT 1
    ),
    'current_enrollment', (
      SELECT jsonb_build_object(
        'id', e.id,
        'grade', e.grade,
        'shift', e.shift,
        'academic_year', e.academic_year,
        'status', e.status,
        'class_id', e.class_id,
        'enrollment_date', e.enrollment_date,
        'class', (
          SELECT jsonb_build_object(
            'id', c.id,
            'name', c.class_name,
            'main_teacher_id', c.main_teacher_id
          )
          FROM classes c
          WHERE c.id = e.class_id
        )
      )
      FROM student_enrollments e
      WHERE e.student_id = p_student_id AND e.status = 'active'
      ORDER BY e.academic_year DESC
      LIMIT 1
    ),
    'enrollments_history', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'academic_year', e.academic_year,
          'grade', e.grade,
          'shift', e.shift,
          'status', e.status,
          'enrollment_date', e.enrollment_date,
          'created_at', e.created_at
        )
        ORDER BY e.academic_year DESC
      ), '[]'::jsonb)
      FROM student_enrollments e
      WHERE e.student_id = p_student_id
    ),
    'recent_attendance', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'date', a.data,
          'present', a.presenca,
          'delay_minutes', a.atraso_minutos,
          'notes', a.observacao
        )
        ORDER BY a.data DESC
      ), '[]'::jsonb)
      FROM (
        SELECT a.*
        FROM attendance a
        WHERE a.student_id = p_student_id
        ORDER BY a.data DESC
        LIMIT 10
      ) a
    ),
    'accessibility_indicators', (
      SELECT jsonb_build_object(
        'has_pei', EXISTS(SELECT 1 FROM peis WHERE student_id = p_student_id AND is_active_version = true),
        'has_aee', EXISTS(SELECT 1 FROM plano_aee WHERE student_id = p_student_id),
        'has_adaptations', EXISTS(
          SELECT 1 FROM pei_barriers 
          WHERE pei_id IN (SELECT id FROM peis WHERE student_id = p_student_id)
        ),
        'needs_special_attention', (
          SELECT s.necessidades_especiais
          FROM students s
          WHERE s.id = p_student_id
        )
      )
    )
  ) INTO v_result
  FROM students s
  WHERE s.id = p_student_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 2. FUNÇÃO: get_student_risk_indicators
-- Calcula indicadores de risco de aprendizagem e inclusão
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_risk_indicators(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_frequency_risk jsonb;
  v_grade_risk jsonb;
  v_inclusion_risk jsonb;
  v_total_absences integer;
  v_total_classes integer;
  v_recent_absences integer;
  v_avg_grade numeric;
BEGIN
  -- Calcular risco de frequência (usando tabela attendance)
  SELECT 
    COUNT(*) FILTER (WHERE a.presenca = false) as total_absences,
    COUNT(*) FILTER (WHERE a.data >= CURRENT_DATE - INTERVAL '30 days') as recent_classes,
    COUNT(*) FILTER (WHERE a.data >= CURRENT_DATE - INTERVAL '30 days' AND a.presenca = false) as recent_absences
  INTO v_total_absences, v_total_classes, v_recent_absences
  FROM attendance a
  WHERE a.student_id = p_student_id 
    AND a.data >= CURRENT_DATE - INTERVAL '90 days';

  v_total_classes := COALESCE(v_total_classes, 0);
  v_total_absences := COALESCE(v_total_absences, 0);
  v_recent_absences := COALESCE(v_recent_absences, 0);

  v_frequency_risk := jsonb_build_object(
    'level', CASE
      WHEN v_total_classes = 0 THEN 'unknown'
      WHEN (v_total_absences::numeric / NULLIF(v_total_classes, 0)) > 0.25 THEN 'high'
      WHEN (v_total_absences::numeric / NULLIF(v_total_classes, 0)) > 0.15 THEN 'medium'
      ELSE 'low'
    END,
    'percentage', CASE
      WHEN v_total_classes = 0 THEN 0
      ELSE (v_total_absences::numeric / NULLIF(v_total_classes, 0)) * 100
    END,
    'total_absences', v_total_absences,
    'total_classes', v_total_classes,
    'recent_absences', v_recent_absences
  );

  -- Calcular risco de notas (usando tabela grades)
  SELECT AVG(g.nota_valor) INTO v_avg_grade
  FROM grades g
  INNER JOIN enrollments e ON e.id = g.enrollment_id
  WHERE e.student_id = p_student_id
    AND g.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND g.nota_valor IS NOT NULL;

  v_grade_risk := jsonb_build_object(
    'level', CASE
      WHEN v_avg_grade IS NULL THEN 'unknown'
      WHEN v_avg_grade < 5 THEN 'high'
      WHEN v_avg_grade < 7 THEN 'medium'
      ELSE 'low'
    END,
    'average_grade', v_avg_grade,
    'needs_attention', COALESCE(v_avg_grade, 0) < 7
  );

  -- Calcular risco de inclusão
  SELECT jsonb_build_object(
    'level', CASE
      WHEN EXISTS(SELECT 1 FROM students s WHERE s.id = p_student_id AND s.necessidades_especiais = true)
        AND NOT EXISTS(SELECT 1 FROM peis WHERE student_id = p_student_id AND is_active_version = true)
        THEN 'high'
      WHEN EXISTS(SELECT 1 FROM peis p 
                  WHERE p.student_id = p_student_id 
                  AND p.is_active_version = true 
                  AND p.status != 'approved')
        THEN 'medium'
      ELSE 'low'
    END,
    'has_special_needs', EXISTS(SELECT 1 FROM students s WHERE s.id = p_student_id AND s.necessidades_especiais = true),
    'has_active_pei', EXISTS(SELECT 1 FROM peis WHERE student_id = p_student_id AND is_active_version = true),
    'has_active_aee', EXISTS(SELECT 1 FROM plano_aee WHERE student_id = p_student_id),
    'pei_status', (
      SELECT p.status
      FROM peis p
      WHERE p.student_id = p_student_id AND p.is_active_version = true
      LIMIT 1
    )
  ) INTO v_inclusion_risk;

  -- Construir resultado final
  v_result := jsonb_build_object(
    'frequency_risk', v_frequency_risk,
    'grade_risk', v_grade_risk,
    'inclusion_risk', v_inclusion_risk,
    'overall_risk', CASE
      WHEN v_frequency_risk->>'level' = 'high' OR v_grade_risk->>'level' = 'high' OR v_inclusion_risk->>'level' = 'high' THEN 'high'
      WHEN v_frequency_risk->>'level' = 'medium' OR v_grade_risk->>'level' = 'medium' OR v_inclusion_risk->>'level' = 'medium' THEN 'medium'
      ELSE 'low'
    END,
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. FUNÇÃO: get_student_suggestions
-- Gera sugestões pedagógicas baseadas nos dados do estudante
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_suggestions(p_student_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_has_low_frequency boolean;
  v_has_low_grades boolean;
  v_has_special_needs boolean;
  v_has_no_pei boolean;
  v_suggestions jsonb := '[]'::jsonb;
BEGIN
  -- Verificar condições para sugestões
  SELECT 
    EXISTS(SELECT 1 FROM attendance 
           WHERE student_id = p_student_id 
           AND presenca = false
           AND data >= CURRENT_DATE - INTERVAL '15 days'
           GROUP BY student_id
           HAVING COUNT(*) >= 5) INTO v_has_low_frequency;

  SELECT 
    EXISTS(SELECT 1 FROM grades g
           INNER JOIN enrollments e ON e.id = g.enrollment_id
           WHERE e.student_id = p_student_id 
           AND g.nota_valor < 7
           AND g.created_at >= CURRENT_DATE - INTERVAL '30 days') INTO v_has_low_grades;

  SELECT 
    EXISTS(SELECT 1 FROM students WHERE id = p_student_id AND necessidades_especiais = true) INTO v_has_special_needs;

  SELECT 
    NOT EXISTS(SELECT 1 FROM peis WHERE student_id = p_student_id AND is_active_version = true) INTO v_has_no_pei;

  -- Gerar sugestões baseadas nas condições
  IF v_has_low_frequency THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'frequency',
      'priority', 'high',
      'title', 'Frequência baixa detectada',
      'description', 'O estudante está faltando muitas aulas. Considere entrar em contato com a família.',
      'action', 'contact_family'
    );
  END IF;

  IF v_has_low_grades THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'academic',
      'priority', 'medium',
      'title', 'Desempenho acadêmico abaixo do esperado',
      'description', 'As notas recentes estão abaixo da média. Considere estratégias de reforço.',
      'action', 'review_performance'
    );
  END IF;

  IF v_has_special_needs AND v_has_no_pei THEN
    v_suggestions := v_suggestions || jsonb_build_object(
      'type', 'inclusion',
      'priority', 'high',
      'title', 'PEI não identificado',
      'description', 'O estudante tem necessidades especiais mas não possui PEI ativo. Considere criar um PEI.',
      'action', 'create_pei'
    );
  END IF;

  v_result := jsonb_build_object(
    'suggestions', v_suggestions,
    'count', jsonb_array_length(v_suggestions),
    'high_priority_count', (
      SELECT COUNT(*) 
      FROM jsonb_array_elements(v_suggestions) s
      WHERE s->>'priority' = 'high'
    ),
    'generated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 4. FUNÇÃO: update_student_field
-- Atualiza um campo específico do estudante (edição incremental)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_student_field(
  p_student_id uuid,
  p_field_name text,
  p_field_value text
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_sql text;
BEGIN
  -- Validar campo permitido
  IF p_field_name NOT IN (
    'name', 'date_of_birth', 'email', 'phone', 
    'mother_name', 'father_name', 'address',
    'city', 'state', 'zip_code'
  ) THEN
    RAISE EXCEPTION 'Campo % não permitido para edição', p_field_name;
  END IF;

  -- Construir SQL dinâmico
  v_sql := format(
    'UPDATE students SET %I = $1, updated_at = NOW() WHERE id = $2 RETURNING %I',
    p_field_name, p_field_name
  );

  EXECUTE v_sql USING p_field_value::text, p_student_id;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'student_id', p_student_id,
    'field', p_field_name,
    'value', p_field_value,
    'updated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNÇÃO: get_student_activity_timeline
-- Retorna timeline completa de atividades do estudante
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_activity_timeline(
  p_student_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', activity.id,
      'type', activity.activity_type,
      'title', activity.title,
      'description', activity.description,
      'date', activity.activity_date,
      'created_at', activity.created_at,
      'created_by', activity.created_by,
      'metadata', activity.metadata
    )
    ORDER BY activity.activity_date DESC, activity.created_at DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    -- Alterações de matrícula
    SELECT 
      e.id,
      'enrollment_change' as activity_type,
      'Alteração de Matrícula' as title,
      'Matrícula ' || COALESCE(e.status, 'N/A') || ' - ' || COALESCE(e.grade, 'N/A') as description,
      COALESCE(e.enrollment_date, e.created_at::date) as activity_date,
      e.created_at,
      e.created_by,
      jsonb_build_object(
        'enrollment_id', e.id,
        'status', e.status,
        'grade', e.grade,
        'academic_year', e.academic_year
      ) as metadata
    FROM student_enrollments e
    WHERE e.student_id = p_student_id

    UNION ALL

    -- Alterações de PEI
    SELECT 
      p.id,
      'pei_change' as activity_type,
      'Alteração no PEI' as title,
      'PEI ' || COALESCE(p.status::text, 'N/A') as description,
      p.updated_at::date as activity_date,
      p.updated_at as created_at,
      p.created_by,
      jsonb_build_object(
        'pei_id', p.id,
        'status', p.status,
        'version_number', p.version_number
      ) as metadata
    FROM peis p
    WHERE p.student_id = p_student_id

    ORDER BY activity_date DESC, created_at DESC
    LIMIT p_limit
  ) activity;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PERMISSÕES
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_student_complete_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_risk_indicators(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_suggestions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_student_field(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_activity_timeline(uuid, integer) TO authenticated;

-- Comentários
COMMENT ON FUNCTION get_student_complete_profile(uuid) IS 'Retorna todos os dados do estudante em uma única query otimizada';
COMMENT ON FUNCTION get_student_risk_indicators(uuid) IS 'Calcula indicadores de risco de aprendizagem e inclusão';
COMMENT ON FUNCTION get_student_suggestions(uuid) IS 'Gera sugestões pedagógicas baseadas nos dados do estudante';
COMMENT ON FUNCTION update_student_field(uuid, text, text) IS 'Atualiza um campo específico do estudante (edição incremental)';
COMMENT ON FUNCTION get_student_activity_timeline(uuid, integer) IS 'Retorna timeline completa de atividades do estudante';