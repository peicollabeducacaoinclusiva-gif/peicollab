-- ============================================================================
-- MIGRAÇÃO: Busca Global Unificada (Spotlight)
-- Data: 25/02/2025
-- Descrição: Criar índices full-text search e função RPC para busca global
-- ============================================================================

-- ============================================================================
-- PARTE 1: Criar índices full-text search
-- ============================================================================

-- Índice para students
CREATE INDEX IF NOT EXISTS "idx_students_search" ON "public"."students" 
USING gin(to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(registration_number, '') || ' ' || coalesce(email, '')));

-- Índice para classes
CREATE INDEX IF NOT EXISTS "idx_classes_search" ON "public"."classes"
USING gin(to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(grade, '') || ' ' || coalesce(shift, '')));

-- Índice para profiles (profissionais)
CREATE INDEX IF NOT EXISTS "idx_profiles_search" ON "public"."profiles"
USING gin(to_tsvector('portuguese', coalesce(full_name, '') || ' ' || coalesce(email, '')));

-- Índice para peis (busca em dados JSONB)
CREATE INDEX IF NOT EXISTS "idx_peis_search" ON "public"."peis"
USING gin(to_tsvector('portuguese', 
    coalesce((diagnosis_data->>'description')::text, '') || ' ' ||
    coalesce((planning_data->>'goals')::text, '')
));

-- ============================================================================
-- PARTE 2: Função RPC para busca global
-- ============================================================================

CREATE OR REPLACE FUNCTION global_search(
    p_query text,
    p_tenant_id uuid DEFAULT NULL,
    p_school_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 20
)
RETURNS TABLE (
    type text,
    id uuid,
    title text,
    description text,
    metadata jsonb,
    relevance real
) AS $$
BEGIN
    RETURN QUERY
    WITH search_results AS (
        -- Buscar estudantes
        SELECT 
            'student'::text AS type,
            s.id,
            s.name AS title,
            COALESCE(s.registration_number, '') AS description,
            jsonb_build_object(
                'school_id', s.school_id,
                'class_name', s.class_name,
                'is_active', s.is_active
            ) AS metadata,
            ts_rank(to_tsvector('portuguese', coalesce(s.name, '') || ' ' || coalesce(s.registration_number, '')), 
                   plainto_tsquery('portuguese', p_query)) AS relevance
        FROM "public"."students" s
        WHERE (
            to_tsvector('portuguese', coalesce(s.name, '') || ' ' || coalesce(s.registration_number, '')) 
            @@ plainto_tsquery('portuguese', p_query)
        )
        AND (p_tenant_id IS NULL OR s.tenant_id = p_tenant_id)
        AND (p_school_id IS NULL OR s.school_id = p_school_id)

        UNION ALL

        -- Buscar turmas
        SELECT 
            'class'::text AS type,
            c.id,
            c.name AS title,
            COALESCE(c.grade || ' - ' || c.shift, '') AS description,
            jsonb_build_object(
                'school_id', c.school_id,
                'grade', c.grade,
                'shift', c.shift
            ) AS metadata,
            ts_rank(to_tsvector('portuguese', coalesce(c.name, '') || ' ' || coalesce(c.grade, '') || ' ' || coalesce(c.shift, '')), 
                   plainto_tsquery('portuguese', p_query)) AS relevance
        FROM "public"."classes" c
        WHERE (
            to_tsvector('portuguese', coalesce(c.name, '') || ' ' || coalesce(c.grade, '') || ' ' || coalesce(c.shift, '')) 
            @@ plainto_tsquery('portuguese', p_query)
        )
        AND (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND (p_school_id IS NULL OR c.school_id = p_school_id)

        UNION ALL

        -- Buscar profissionais
        SELECT 
            'professional'::text AS type,
            p.id,
            p.full_name AS title,
            COALESCE(p.email, '') AS description,
            jsonb_build_object(
                'role', p.role,
                'school_id', p.school_id
            ) AS metadata,
            ts_rank(to_tsvector('portuguese', coalesce(p.full_name, '') || ' ' || coalesce(p.email, '')), 
                   plainto_tsquery('portuguese', p_query)) AS relevance
        FROM "public"."profiles" p
        WHERE (
            to_tsvector('portuguese', coalesce(p.full_name, '') || ' ' || coalesce(p.email, '')) 
            @@ plainto_tsquery('portuguese', p_query)
        )
        AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
        AND (p_school_id IS NULL OR p.school_id = p_school_id)

        UNION ALL

        -- Buscar PEIs
        SELECT 
            'pei'::text AS type,
            pei.id,
            'PEI - ' || COALESCE(st.name, 'Aluno') AS title,
            COALESCE((pei.diagnosis_data->>'description')::text, '') AS description,
            jsonb_build_object(
                'student_id', pei.student_id,
                'student_name', st.name,
                'status', pei.status,
                'school_id', pei.school_id
            ) AS metadata,
            ts_rank(
                to_tsvector('portuguese', 
                    coalesce((pei.diagnosis_data->>'description')::text, '') || ' ' ||
                    coalesce(st.name, '')
                ), 
                plainto_tsquery('portuguese', p_query)
            ) AS relevance
        FROM "public"."peis" pei
        LEFT JOIN "public"."students" st ON pei.student_id = st.id
        WHERE (
            to_tsvector('portuguese', 
                coalesce((pei.diagnosis_data->>'description')::text, '') || ' ' ||
                coalesce(st.name, '')
            ) 
            @@ plainto_tsquery('portuguese', p_query)
        )
        AND (p_tenant_id IS NULL OR pei.tenant_id = p_tenant_id)
        AND (p_school_id IS NULL OR pei.school_id = p_school_id)
        AND pei.is_active_version = true
    )
    SELECT 
        sr.type,
        sr.id,
        sr.title,
        sr.description,
        sr.metadata,
        sr.relevance
    FROM search_results sr
    WHERE sr.relevance > 0
    ORDER BY sr.relevance DESC, sr.title
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 3: Permissões
-- ============================================================================

GRANT EXECUTE ON FUNCTION global_search(text, uuid, uuid, integer) TO authenticated;

-- Comentários
COMMENT ON FUNCTION global_search(text, uuid, uuid, integer) IS 'Busca global unificada em estudantes, turmas, profissionais e PEIs';

