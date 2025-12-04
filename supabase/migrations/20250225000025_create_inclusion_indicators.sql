-- ============================================================================
-- MIGRAÇÃO: Indicadores de Inclusão
-- Data: 25/02/2025
-- Descrição: Criar estrutura para indicadores de inclusão no Dashboard da Rede
-- ============================================================================

-- ============================================================================
-- PARTE 1: View de Indicadores de Inclusão por Escola
-- ============================================================================

CREATE OR REPLACE VIEW "public"."inclusion_indicators_by_school" AS
SELECT 
    s.id as school_id,
    s.name as school_name,
    t.id as tenant_id,
    t.network_name,
    -- Contadores básicos
    COUNT(DISTINCT st.id) FILTER (WHERE st.id IS NOT NULL) as total_students,
    COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL AND p.status = 'approved') as students_with_pei,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.id IS NOT NULL AND pa.status = 'approved') as students_with_aee,
    -- Frequência
    ROUND(
        AVG(
            CASE 
                WHEN att.status = 'present' THEN 1.0
                WHEN att.status = 'absent' THEN 0.0
                ELSE NULL
            END
        ) * 100, 2
    ) as average_attendance_rate,
    COUNT(DISTINCT st.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM "public"."attendance" att2
            WHERE att2.student_id = st.id
            AND att2.date >= CURRENT_DATE - interval '30 days'
            AND att2.status = 'absent'
            GROUP BY att2.student_id
            HAVING COUNT(*) >= 5
        )
    ) as students_low_attendance,
    -- PEI
    COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'alcançada') as pei_goals_achieved,
    COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'em andamento') as pei_goals_in_progress,
    COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level IS NULL OR pg.progress_level = 'não iniciada') as pei_goals_not_started,
    -- AEE
    COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'completed') as aee_objectives_completed,
    COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'active') as aee_objectives_active,
    -- Professores
    COUNT(DISTINCT p2.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM "public"."peis" p3
            WHERE p3.assigned_teacher_id = p2.id
            AND p3.status = 'approved'
        )
    ) as teachers_with_pei_assigned,
    COUNT(DISTINCT p2.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM "public"."plano_aee" pa2
            WHERE pa2.assigned_aee_teacher_id = p2.id
            AND pa2.status = 'approved'
        )
    ) as aee_teachers_active
FROM "public"."schools" s
JOIN "public"."tenants" t ON t.id = s.tenant_id
LEFT JOIN "public"."students" st ON st.school_id = s.id AND st.is_active = true
LEFT JOIN "public"."peis" p ON p.student_id = st.id
LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id
LEFT JOIN "public"."pei_goals" pg ON pg.pei_id = p.id
LEFT JOIN "public"."aee_objectives" ao ON ao.aee_id = pa.id
LEFT JOIN "public"."attendance" att ON att.student_id = st.id
LEFT JOIN "public"."profiles" p2 ON p2.school_id = s.id
GROUP BY s.id, s.name, t.id, t.network_name;

-- ============================================================================
-- PARTE 2: View de Indicadores de Inclusão por Rede
-- ============================================================================

CREATE OR REPLACE VIEW "public"."inclusion_indicators_by_network" AS
SELECT 
    t.id as tenant_id,
    t.network_name,
    COUNT(DISTINCT s.id) as total_schools,
    COUNT(DISTINCT st.id) FILTER (WHERE st.id IS NOT NULL) as total_students,
    COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL AND p.status = 'approved') as students_with_pei,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.id IS NOT NULL AND pa.status = 'approved') as students_with_aee,
    ROUND(
        (COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL AND p.status = 'approved')::numeric / 
         NULLIF(COUNT(DISTINCT st.id) FILTER (WHERE st.id IS NOT NULL), 0)) * 100, 
        2
    ) as pei_coverage_percentage,
    ROUND(
        (COUNT(DISTINCT pa.id) FILTER (WHERE pa.id IS NOT NULL AND pa.status = 'approved')::numeric / 
         NULLIF(COUNT(DISTINCT st.id) FILTER (WHERE st.id IS NOT NULL), 0)) * 100, 
        2
    ) as aee_coverage_percentage,
    ROUND(
        AVG(
            CASE 
                WHEN att.status = 'present' THEN 1.0
                WHEN att.status = 'absent' THEN 0.0
                ELSE NULL
            END
        ) * 100, 2
    ) as average_attendance_rate,
    COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'alcançada') as total_pei_goals_achieved,
    COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'em andamento') as total_pei_goals_in_progress,
    COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'completed') as total_aee_objectives_completed
FROM "public"."tenants" t
LEFT JOIN "public"."schools" s ON s.tenant_id = t.id
LEFT JOIN "public"."students" st ON st.school_id = s.id AND st.is_active = true
LEFT JOIN "public"."peis" p ON p.student_id = st.id
LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id
LEFT JOIN "public"."pei_goals" pg ON pg.pei_id = p.id
LEFT JOIN "public"."aee_objectives" ao ON ao.aee_id = pa.id
LEFT JOIN "public"."attendance" att ON att.student_id = st.id
WHERE t.is_active = true
GROUP BY t.id, t.network_name;

-- ============================================================================
-- PARTE 3: Função para calcular indicadores de inclusão
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_inclusion_indicators(
    p_tenant_id uuid DEFAULT NULL,
    p_school_id uuid DEFAULT NULL,
    p_start_date date DEFAULT CURRENT_DATE - interval '90 days',
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'students', (
            SELECT jsonb_build_object(
                'total', COUNT(DISTINCT st.id),
                'with_pei', COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'approved'),
                'with_aee', COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'approved'),
                'pei_coverage', ROUND(
                    (COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'approved')::numeric / 
                     NULLIF(COUNT(DISTINCT st.id), 0)) * 100, 
                    2
                ),
                'aee_coverage', ROUND(
                    (COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'approved')::numeric / 
                     NULLIF(COUNT(DISTINCT st.id), 0)) * 100, 
                    2
                )
            )
            FROM "public"."students" st
            LEFT JOIN "public"."peis" p ON p.student_id = st.id
            LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id
            WHERE st.is_active = true
            AND (p_tenant_id IS NULL OR st.tenant_id = p_tenant_id)
            AND (p_school_id IS NULL OR st.school_id = p_school_id)
        ),
        'pei', (
            SELECT jsonb_build_object(
                'total_goals', COUNT(DISTINCT pg.id),
                'goals_achieved', COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'alcançada'),
                'goals_in_progress', COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'em andamento'),
                'goals_not_started', COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level IS NULL OR pg.progress_level = 'não iniciada'),
                'achievement_rate', ROUND(
                    (COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'alcançada')::numeric / 
                     NULLIF(COUNT(DISTINCT pg.id), 0)) * 100, 
                    2
                )
            )
            FROM "public"."peis" p
            JOIN "public"."pei_goals" pg ON pg.pei_id = p.id
            JOIN "public"."students" st ON st.id = p.student_id
            WHERE p.status = 'approved'
            AND (p_tenant_id IS NULL OR st.tenant_id = p_tenant_id)
            AND (p_school_id IS NULL OR st.school_id = p_school_id)
        ),
        'aee', (
            SELECT jsonb_build_object(
                'total_objectives', COUNT(DISTINCT ao.id),
                'objectives_completed', COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'completed'),
                'objectives_active', COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'active'),
                'completion_rate', ROUND(
                    (COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'completed')::numeric / 
                     NULLIF(COUNT(DISTINCT ao.id), 0)) * 100, 
                    2
                )
            )
            FROM "public"."plano_aee" pa
            JOIN "public"."aee_objectives" ao ON ao.aee_id = pa.id
            JOIN "public"."students" st ON st.id = pa.student_id
            WHERE pa.status = 'approved'
            AND (p_tenant_id IS NULL OR st.tenant_id = p_tenant_id)
            AND (p_school_id IS NULL OR st.school_id = p_school_id)
        ),
        'attendance', (
            SELECT jsonb_build_object(
                'average_rate', ROUND(
                    AVG(
                        CASE 
                            WHEN att.status = 'present' THEN 1.0
                            WHEN att.status = 'absent' THEN 0.0
                            ELSE NULL
                        END
                    ) * 100, 2
                ),
                'students_low_attendance', COUNT(DISTINCT st.id) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM "public"."attendance" att2
                        WHERE att2.student_id = st.id
                        AND att2.date BETWEEN p_start_date AND p_end_date
                        AND att2.status = 'absent'
                        GROUP BY att2.student_id
                        HAVING COUNT(*) >= 5
                    )
                )
            )
            FROM "public"."students" st
            LEFT JOIN "public"."attendance" att ON att.student_id = st.id
            WHERE st.is_active = true
            AND (p_tenant_id IS NULL OR st.tenant_id = p_tenant_id)
            AND (p_school_id IS NULL OR st.school_id = p_school_id)
            AND att.date BETWEEN p_start_date AND p_end_date
        ),
        'teachers', (
            SELECT jsonb_build_object(
                'total_teachers', COUNT(DISTINCT p.id),
                'teachers_with_pei', COUNT(DISTINCT p.id) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM "public"."peis" p2
                        WHERE p2.assigned_teacher_id = p.id
                        AND p2.status = 'approved'
                    )
                ),
                'aee_teachers_active', COUNT(DISTINCT p.id) FILTER (
                    WHERE EXISTS (
                        SELECT 1 FROM "public"."plano_aee" pa2
                        WHERE pa2.assigned_aee_teacher_id = p.id
                        AND pa2.status = 'approved'
                    )
                )
            )
            FROM "public"."profiles" p
            WHERE (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
            AND (p_school_id IS NULL OR p.school_id = p_school_id)
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: Permissões
-- ============================================================================

GRANT SELECT ON "public"."inclusion_indicators_by_school" TO authenticated;
GRANT SELECT ON "public"."inclusion_indicators_by_network" TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_inclusion_indicators(uuid, uuid, date, date) TO authenticated;

-- Comentários
COMMENT ON VIEW "public"."inclusion_indicators_by_school" IS 'Indicadores de inclusão agregados por escola';
COMMENT ON VIEW "public"."inclusion_indicators_by_network" IS 'Indicadores de inclusão agregados por rede';
COMMENT ON FUNCTION calculate_inclusion_indicators(uuid, uuid, date, date) IS 'Calcula indicadores de inclusão detalhados';

