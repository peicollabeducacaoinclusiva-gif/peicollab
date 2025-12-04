-- ============================================================================
-- MIGRAÇÃO: Planejamento Conectado ao PEI/AEE
-- Data: 25/02/2025
-- Descrição: Criar estrutura para integração entre Planejamento e PEI/AEE
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Planejamentos Pedagógicos
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pedagogical_plannings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "planning_type" text NOT NULL, -- 'daily', 'weekly', 'monthly', 'bimonthly'
    "start_date" date NOT NULL,
    "end_date" date,
    "subject" text,
    "content" jsonb DEFAULT '{}'::jsonb,
    "pei_insights" jsonb DEFAULT '{}'::jsonb, -- Metas PEI relacionadas
    "aee_strategies" jsonb DEFAULT '[]'::jsonb, -- Estratégias AEE sugeridas
    "adaptations" jsonb DEFAULT '[]'::jsonb, -- Adaptações necessárias
    "resources" jsonb DEFAULT '[]'::jsonb, -- Recursos sugeridos
    "tags" text[],
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pedagogical_plannings_class" ON "public"."pedagogical_plannings"("class_id");
CREATE INDEX IF NOT EXISTS "idx_pedagogical_plannings_teacher" ON "public"."pedagogical_plannings"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_pedagogical_plannings_dates" ON "public"."pedagogical_plannings"("start_date", "end_date");

-- ============================================================================
-- PARTE 2: Tabela de Vínculos PEI-Planejamento
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."planning_pei_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "planning_id" uuid NOT NULL REFERENCES "public"."pedagogical_plannings"("id") ON DELETE CASCADE,
    "pei_goal_id" uuid REFERENCES "public"."pei_goals"("id") ON DELETE SET NULL,
    "pei_id" uuid REFERENCES "public"."peis"("id") ON DELETE SET NULL,
    "link_type" text NOT NULL, -- 'goal', 'adaptation', 'resource', 'strategy'
    "description" text,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_planning_pei_links_planning" ON "public"."planning_pei_links"("planning_id");
CREATE INDEX IF NOT EXISTS "idx_planning_pei_links_pei_goal" ON "public"."planning_pei_links"("pei_goal_id");
CREATE INDEX IF NOT EXISTS "idx_planning_pei_links_pei" ON "public"."planning_pei_links"("pei_id");

-- ============================================================================
-- PARTE 3: Tabela de Vínculos AEE-Planejamento
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."planning_aee_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "planning_id" uuid NOT NULL REFERENCES "public"."pedagogical_plannings"("id") ON DELETE CASCADE,
    "aee_objective_id" uuid REFERENCES "public"."aee_objectives"("id") ON DELETE SET NULL,
    "aee_id" uuid REFERENCES "public"."plano_aee"("id") ON DELETE SET NULL,
    "link_type" text NOT NULL, -- 'objective', 'methodology', 'strategy', 'activity'
    "description" text,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_planning_aee_links_planning" ON "public"."planning_aee_links"("planning_id");
CREATE INDEX IF NOT EXISTS "idx_planning_aee_links_aee_objective" ON "public"."planning_aee_links"("aee_objective_id");
CREATE INDEX IF NOT EXISTS "idx_planning_aee_links_aee" ON "public"."planning_aee_links"("aee_id");

-- ============================================================================
-- PARTE 4: Função para buscar insights PEI/AEE para uma turma
-- ============================================================================

CREATE OR REPLACE FUNCTION get_planning_insights(p_class_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'pei_goals', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'goal_id', pg.id,
                    'description', pg.description,
                    'category', pg.category,
                    'progress_level', pg.progress_level,
                    'student_id', p.student_id,
                    'student_name', s.full_name
                )
            )
            FROM "public"."peis" p
            JOIN "public"."pei_goals" pg ON pg.pei_id = p.id
            JOIN "public"."students" s ON s.id = p.student_id
            JOIN "public"."enrollments" e ON e.student_id = s.id
            WHERE e.class_id = p_class_id
            AND p.status = 'approved'
            AND (pg.progress_level IS NULL OR pg.progress_level != 'alcançada')
        ),
        'aee_objectives', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'objective_id', ao.id,
                    'title', ao.title,
                    'description', ao.description,
                    'objective_type', ao.objective_type,
                    'status', ao.status,
                    'student_id', pa.student_id,
                    'student_name', s.full_name
                )
            )
            FROM "public"."plano_aee" pa
            JOIN "public"."aee_objectives" ao ON ao.aee_id = pa.id
            JOIN "public"."students" s ON s.id = pa.student_id
            JOIN "public"."enrollments" e ON e.student_id = s.id
            WHERE e.class_id = p_class_id
            AND pa.status = 'approved'
            AND ao.status = 'active'
        ),
        'adaptations', (
            SELECT jsonb_agg(
                DISTINCT jsonb_build_object(
                    'adaptation_type', a->>'adaptation_type',
                    'description', a->>'description',
                    'student_id', p.student_id,
                    'student_name', s.full_name
                )
            )
            FROM "public"."peis" p
            JOIN "public"."students" s ON s.id = p.student_id
            JOIN "public"."enrollments" e ON e.student_id = s.id
            CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.planning_data->'adaptations', '[]'::jsonb)) a
            WHERE e.class_id = p_class_id
            AND p.status = 'approved'
        ),
        'resources', (
            SELECT jsonb_agg(
                DISTINCT jsonb_build_object(
                    'resource_type', r->>'resource_type',
                    'description', r->>'description',
                    'student_id', p.student_id
                )
            )
            FROM "public"."peis" p
            JOIN "public"."students" s ON s.id = p.student_id
            JOIN "public"."enrollments" e ON e.student_id = s.id
            CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.planning_data->'resources', '[]'::jsonb)) r
            WHERE e.class_id = p_class_id
            AND p.status = 'approved'
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 5: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."pedagogical_plannings" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."planning_pei_links" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."planning_aee_links" TO authenticated;
GRANT EXECUTE ON FUNCTION get_planning_insights(uuid, date) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."pedagogical_plannings" IS 'Planejamentos pedagógicos conectados ao PEI/AEE';
COMMENT ON TABLE "public"."planning_pei_links" IS 'Vínculos entre planejamentos e metas do PEI';
COMMENT ON TABLE "public"."planning_aee_links" IS 'Vínculos entre planejamentos e objetivos do AEE';
COMMENT ON FUNCTION get_planning_insights(uuid, date) IS 'Retorna insights PEI/AEE para uma turma';

