-- ============================================================================
-- MIGRAÇÃO: Painel Multi-Escola
-- Data: 25/02/2025
-- Descrição: Criar estrutura para painel multi-escola com drilldown
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Metas da Rede
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."network_goals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "goal_name" text NOT NULL,
    "goal_description" text,
    "target_value" numeric,
    "current_value" numeric DEFAULT 0,
    "metric_type" text NOT NULL, -- 'pei_coverage', 'aee_coverage', 'attendance_rate', 'goal_achievement'
    "target_date" date,
    "status" text DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "created_by" uuid REFERENCES "auth"."users"("id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_network_goals_tenant" ON "public"."network_goals"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_network_goals_status" ON "public"."network_goals"("status");

-- ============================================================================
-- PARTE 2: Função para drilldown (escola → turma → aluno)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_drilldown_data(
    p_tenant_id uuid,
    p_school_id uuid DEFAULT NULL,
    p_class_id uuid DEFAULT NULL,
    p_student_id uuid DEFAULT NULL,
    p_metric_type text DEFAULT 'all'
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Se student_id fornecido, retornar dados do aluno
    IF p_student_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'level', 'student',
            'student_id', st.id,
            'student_name', st.full_name,
            'school_id', st.school_id,
            'school_name', s.name,
            'class_id', e.class_id,
            'class_name', c.name,
            'pei', (
                SELECT jsonb_build_object(
                    'has_pei', EXISTS(SELECT 1 FROM "public"."peis" p WHERE p.student_id = st.id AND p.status = 'approved'),
                    'pei_id', p.id,
                    'goals_count', COUNT(DISTINCT pg.id),
                    'goals_achieved', COUNT(DISTINCT pg.id) FILTER (WHERE pg.progress_level = 'alcançada')
                )
                FROM "public"."peis" p
                LEFT JOIN "public"."pei_goals" pg ON pg.pei_id = p.id
                WHERE p.student_id = st.id
                AND p.status = 'approved'
            ),
            'aee', (
                SELECT jsonb_build_object(
                    'has_aee', EXISTS(SELECT 1 FROM "public"."plano_aee" pa WHERE pa.student_id = st.id AND pa.status = 'approved'),
                    'aee_id', pa.id,
                    'objectives_count', COUNT(DISTINCT ao.id),
                    'objectives_completed', COUNT(DISTINCT ao.id) FILTER (WHERE ao.status = 'completed')
                )
                FROM "public"."plano_aee" pa
                LEFT JOIN "public"."aee_objectives" ao ON ao.aee_id = pa.id
                WHERE pa.student_id = st.id
                AND pa.status = 'approved'
            ),
            'attendance', (
                SELECT jsonb_build_object(
                    'total_days', COUNT(DISTINCT date),
                    'present_days', COUNT(DISTINCT date) FILTER (WHERE status = 'present'),
                    'absent_days', COUNT(DISTINCT date) FILTER (WHERE status = 'absent'),
                    'attendance_rate', ROUND(
                        (COUNT(DISTINCT date) FILTER (WHERE status = 'present')::numeric / 
                         NULLIF(COUNT(DISTINCT date), 0)) * 100, 
                        2
                    )
                )
                FROM "public"."attendance"
                WHERE student_id = st.id
                AND date >= CURRENT_DATE - interval '30 days'
            )
        ) INTO v_result
        FROM "public"."students" st
        JOIN "public"."schools" s ON s.id = st.school_id
        LEFT JOIN "public"."enrollments" e ON e.student_id = st.id AND e.is_active = true
        LEFT JOIN "public"."classes" c ON c.id = e.class_id
        LEFT JOIN "public"."peis" p ON p.student_id = st.id AND p.status = 'approved'
        LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id AND pa.status = 'approved'
        WHERE st.id = p_student_id
        AND (p_tenant_id IS NULL OR st.tenant_id = p_tenant_id)
        AND (p_school_id IS NULL OR st.school_id = p_school_id)
        LIMIT 1;

        RETURN v_result;
    END IF;

    -- Se class_id fornecido, retornar dados da turma
    IF p_class_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'level', 'class',
            'class_id', c.id,
            'class_name', c.name,
            'school_id', c.school_id,
            'school_name', s.name,
            'students_count', COUNT(DISTINCT e.student_id),
            'students_with_pei', COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved'),
            'students_with_aee', COUNT(DISTINCT pa.student_id) FILTER (WHERE pa.status = 'approved'),
            'average_attendance', ROUND(
                AVG(
                    CASE 
                        WHEN att.status = 'present' THEN 1.0
                        WHEN att.status = 'absent' THEN 0.0
                        ELSE NULL
                    END
                ) * 100, 2
            )
        ) INTO v_result
        FROM "public"."classes" c
        JOIN "public"."schools" s ON s.id = c.school_id
        LEFT JOIN "public"."enrollments" e ON e.class_id = c.id AND e.is_active = true
        LEFT JOIN "public"."peis" p ON p.student_id = e.student_id
        LEFT JOIN "public"."plano_aee" pa ON pa.student_id = e.student_id
        LEFT JOIN "public"."attendance" att ON att.student_id = e.student_id
        WHERE c.id = p_class_id
        AND (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND (p_school_id IS NULL OR c.school_id = p_school_id)
        GROUP BY c.id, c.name, c.school_id, s.name;

        RETURN v_result;
    END IF;

    -- Se school_id fornecido, retornar dados da escola
    IF p_school_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'level', 'school',
            'school_id', s.id,
            'school_name', s.name,
            'tenant_id', s.tenant_id,
            'classes_count', COUNT(DISTINCT c.id),
            'students_count', COUNT(DISTINCT st.id),
            'students_with_pei', COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved'),
            'students_with_aee', COUNT(DISTINCT pa.student_id) FILTER (WHERE pa.status = 'approved'),
            'pei_coverage', ROUND(
                (COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved')::numeric / 
                 NULLIF(COUNT(DISTINCT st.id), 0)) * 100, 
                2
            ),
            'aee_coverage', ROUND(
                (COUNT(DISTINCT pa.student_id) FILTER (WHERE pa.status = 'approved')::numeric / 
                 NULLIF(COUNT(DISTINCT st.id), 0)) * 100, 
                2
            )
        ) INTO v_result
        FROM "public"."schools" s
        LEFT JOIN "public"."classes" c ON c.school_id = s.id
        LEFT JOIN "public"."students" st ON st.school_id = s.id AND st.is_active = true
        LEFT JOIN "public"."peis" p ON p.student_id = st.id
        LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id
        WHERE s.id = p_school_id
        AND (p_tenant_id IS NULL OR s.tenant_id = p_tenant_id)
        GROUP BY s.id, s.name, s.tenant_id;

        RETURN v_result;
    END IF;

    -- Se apenas tenant_id, retornar dados da rede
    SELECT jsonb_build_object(
        'level', 'network',
        'tenant_id', t.id,
        'network_name', t.network_name,
        'schools_count', COUNT(DISTINCT s.id),
        'students_count', COUNT(DISTINCT st.id),
        'students_with_pei', COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved'),
        'students_with_aee', COUNT(DISTINCT pa.student_id) FILTER (WHERE pa.status = 'approved')
    ) INTO v_result
    FROM "public"."tenants" t
    LEFT JOIN "public"."schools" s ON s.tenant_id = t.id
    LEFT JOIN "public"."students" st ON st.school_id = s.id AND st.is_active = true
    LEFT JOIN "public"."peis" p ON p.student_id = st.id
    LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id
    WHERE t.id = p_tenant_id
    GROUP BY t.id, t.network_name;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 3: Função para exportar dados (CSV/Excel)
-- ============================================================================

CREATE OR REPLACE FUNCTION export_inclusion_data(
    p_tenant_id uuid,
    p_school_id uuid DEFAULT NULL,
    p_format text DEFAULT 'csv',
    p_include_details boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Preparar dados para exportação
    SELECT jsonb_build_object(
        'export_date', CURRENT_DATE,
        'tenant_id', p_tenant_id,
        'school_id', p_school_id,
        'format', p_format,
        'data', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'school_id', s.id,
                    'school_name', s.name,
                    'students_total', COUNT(DISTINCT st.id),
                    'students_with_pei', COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved'),
                    'students_with_aee', COUNT(DISTINCT pa.student_id) FILTER (WHERE pa.status = 'approved'),
                    'pei_coverage', ROUND(
                        (COUNT(DISTINCT p.student_id) FILTER (WHERE p.status = 'approved')::numeric / 
                         NULLIF(COUNT(DISTINCT st.id), 0)) * 100, 
                        2
                    ),
                    'aee_coverage', ROUND(
                        (COUNT(DISTINCT pa.student_id) FILTER (WHERE pa.status = 'approved')::numeric / 
                         NULLIF(COUNT(DISTINCT st.id), 0)) * 100, 
                        2
                    )
                )
            )
            FROM "public"."schools" s
            LEFT JOIN "public"."students" st ON st.school_id = s.id AND st.is_active = true
            LEFT JOIN "public"."peis" p ON p.student_id = st.id
            LEFT JOIN "public"."plano_aee" pa ON pa.student_id = st.id
            WHERE s.tenant_id = p_tenant_id
            AND (p_school_id IS NULL OR s.id = p_school_id)
            GROUP BY s.id, s.name
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."network_goals" TO authenticated;
GRANT EXECUTE ON FUNCTION get_drilldown_data(uuid, uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION export_inclusion_data(uuid, uuid, text, boolean) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."network_goals" IS 'Metas da rede de ensino para inclusão';
COMMENT ON FUNCTION get_drilldown_data(uuid, uuid, uuid, uuid, text) IS 'Retorna dados para drilldown (rede → escola → turma → aluno)';
COMMENT ON FUNCTION export_inclusion_data(uuid, uuid, text, boolean) IS 'Exporta dados de inclusão em formato CSV/Excel';

