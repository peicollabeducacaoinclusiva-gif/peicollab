-- ============================================================================
-- MIGRAÇÃO: PEI Simplificado para Famílias
-- Data: 25/02/2025
-- Descrição: Criar view e função para PEI simplificado e acessível
-- ============================================================================

-- ============================================================================
-- PARTE 1: View de PEI Simplificado
-- ============================================================================

CREATE OR REPLACE VIEW "public"."simplified_pei_view" AS
SELECT 
    p.id as pei_id,
    p.student_id,
    s.full_name as student_name,
    p.status,
    p.created_at,
    p.updated_at,
    -- Metas simplificadas
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', pg.id,
                'description', pg.description,
                'category', pg.category,
                'progress_level', pg.progress_level,
                'target_date', pg.target_date
            )
        )
        FROM "public"."pei_goals" pg
        WHERE pg.pei_id = p.id
        ORDER BY pg.created_at
    ) as goals,
    -- Adaptações simplificadas
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'type', a->>'adaptation_type',
                'description', a->>'description'
            )
        )
        FROM jsonb_array_elements(COALESCE(p.planning_data->'adaptations', '[]'::jsonb)) a
    ) as adaptations,
    -- Recursos simplificados
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'type', r->>'resource_type',
                'description', r->>'description'
            )
        )
        FROM jsonb_array_elements(COALESCE(p.planning_data->'resources', '[]'::jsonb)) r
    ) as resources
FROM "public"."peis" p
JOIN "public"."students" s ON s.id = p.student_id
WHERE p.status = 'approved';

-- ============================================================================
-- PARTE 2: Função para buscar PEI simplificado (respeitando privacidade)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_simplified_pei_for_family(
    p_student_id uuid,
    p_family_member_id uuid
)
RETURNS jsonb AS $$
DECLARE
    v_privacy_settings record;
    v_pei_data jsonb;
BEGIN
    -- Buscar configurações de privacidade
    SELECT * INTO v_privacy_settings
    FROM "public"."family_privacy_settings"
    WHERE student_id = p_student_id
    AND family_member_id = p_family_member_id;

    -- Buscar dados do PEI
    SELECT jsonb_build_object(
        'pei_id', p.id,
        'student_name', s.full_name,
        'status', p.status,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'goals', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', pg.id,
                    'description', pg.description,
                    'category', pg.category,
                    'progress_level', pg.progress_level,
                    'target_date', pg.target_date
                )
            )
            FROM "public"."pei_goals" pg
            WHERE pg.pei_id = p.id
            ORDER BY pg.created_at
        ),
        'adaptations', CASE
            WHEN v_privacy_settings IS NULL OR v_privacy_settings.show_full_pei = true THEN
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'type', a->>'adaptation_type',
                            'description', a->>'description'
                        )
                    )
                    FROM jsonb_array_elements(COALESCE(p.planning_data->'adaptations', '[]'::jsonb)) a
                )
            ELSE '[]'::jsonb
        END,
        'resources', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', r->>'resource_type',
                    'description', r->>'description'
                )
            )
            FROM jsonb_array_elements(COALESCE(p.planning_data->'resources', '[]'::jsonb)) r
        ),
        'diagnosis', CASE
            WHEN v_privacy_settings IS NULL OR v_privacy_settings.show_diagnosis = true THEN
                p.diagnosis_data
            ELSE NULL
        END
    ) INTO v_pei_data
    FROM "public"."peis" p
    JOIN "public"."students" s ON s.id = p.student_id
    WHERE p.student_id = p_student_id
    AND p.status = 'approved'
    ORDER BY p.created_at DESC
    LIMIT 1;

    RETURN v_pei_data;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 3: Permissões
-- ============================================================================

GRANT SELECT ON "public"."simplified_pei_view" TO authenticated;
GRANT EXECUTE ON FUNCTION get_simplified_pei_for_family(uuid, uuid) TO authenticated;

-- Comentários
COMMENT ON VIEW "public"."simplified_pei_view" IS 'View simplificada do PEI para famílias';
COMMENT ON FUNCTION get_simplified_pei_for_family(uuid, uuid) IS 'Retorna PEI simplificado respeitando configurações de privacidade';

