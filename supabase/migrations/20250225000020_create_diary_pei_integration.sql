-- ============================================================================
-- MIGRAÇÃO: Conexão Automática Diário ↔ PEI
-- Data: 25/02/2025
-- Descrição: Criar sistema de sugestões automáticas de relação com metas PEI
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Vínculos Diário-PEI
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."diary_pei_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "evaluation_id" uuid REFERENCES "public"."evaluations"("id") ON DELETE CASCADE,
    "activity_id" uuid, -- Referência a atividades do diário
    "pei_goal_id" uuid NOT NULL REFERENCES "public"."pei_goals"("id") ON DELETE CASCADE,
    "link_type" text NOT NULL, -- 'suggested', 'confirmed', 'rejected'
    "confidence_score" numeric(3,2) DEFAULT 0.5, -- 0.0 a 1.0
    "suggested_by" text DEFAULT 'system', -- 'system', 'teacher', 'ai'
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_diary_pei_links_evaluation" ON "public"."diary_pei_links"("evaluation_id");
CREATE INDEX IF NOT EXISTS "idx_diary_pei_links_pei_goal" ON "public"."diary_pei_links"("pei_goal_id");
CREATE INDEX IF NOT EXISTS "idx_diary_pei_links_type" ON "public"."diary_pei_links"("link_type");

-- ============================================================================
-- PARTE 2: Tabela de Alertas de Relação PEI
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."pei_relation_alerts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "pei_goal_id" uuid REFERENCES "public"."pei_goals"("id") ON DELETE CASCADE,
    "evaluation_id" uuid REFERENCES "public"."evaluations"("id") ON DELETE CASCADE,
    "alert_type" text NOT NULL, -- 'activity_related', 'progress_update', 'goal_achievement'
    "message" text NOT NULL,
    "priority" text DEFAULT 'medium', -- 'low', 'medium', 'high'
    "read" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_pei_relation_alerts_student" ON "public"."pei_relation_alerts"("student_id");
CREATE INDEX IF NOT EXISTS "idx_pei_relation_alerts_pei_goal" ON "public"."pei_relation_alerts"("pei_goal_id");
CREATE INDEX IF NOT EXISTS "idx_pei_relation_alerts_read" ON "public"."pei_relation_alerts"("read");

-- ============================================================================
-- PARTE 3: Função para sugerir relações PEI
-- ============================================================================

CREATE OR REPLACE FUNCTION suggest_pei_relations(
    p_evaluation_id uuid,
    p_student_id uuid DEFAULT NULL
)
RETURNS TABLE (
    pei_goal_id uuid,
    goal_description text,
    confidence_score numeric,
    reason text
) AS $$
DECLARE
    v_evaluation record;
    v_subject text;
    v_tags text[];
BEGIN
    -- Buscar dados da avaliação
    SELECT e.*, s.name as subject_name
    INTO v_evaluation
    FROM "public"."evaluations" e
    LEFT JOIN "public"."subjects" s ON s.id = e.subject_id
    WHERE e.id = p_evaluation_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_subject := v_evaluation.subject_name;
    v_tags := COALESCE(v_evaluation.tags, ARRAY[]::text[]);

    -- Buscar metas PEI relacionadas
    RETURN QUERY
    SELECT 
        pg.id,
        pg.description,
        CASE
            WHEN v_subject IS NOT NULL AND pg.category = LOWER(v_subject) THEN 0.8
            WHEN array_length(v_tags, 1) > 0 AND pg.description ILIKE ANY(SELECT '%' || tag || '%' FROM unnest(v_tags) tag) THEN 0.7
            WHEN pg.category IN ('academic', 'functional') THEN 0.5
            ELSE 0.3
        END as confidence_score,
        CASE
            WHEN v_subject IS NOT NULL AND pg.category = LOWER(v_subject) THEN 'Relacionado à disciplina ' || v_subject
            WHEN array_length(v_tags, 1) > 0 THEN 'Tags correspondem à meta'
            ELSE 'Meta relacionada à categoria'
        END as reason
    FROM "public"."pei_goals" pg
    JOIN "public"."peis" p ON p.id = pg.pei_id
    WHERE p.student_id = COALESCE(p_student_id, (
        SELECT student_id FROM "public"."enrollments" 
        WHERE class_id = v_evaluation.class_id 
        LIMIT 1
    ))
    AND p.status = 'approved'
    AND (pg.progress_level IS NULL OR pg.progress_level != 'alcançada')
    ORDER BY confidence_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 4: Função para criar alerta quando atividade relaciona-se a meta
-- ============================================================================

CREATE OR REPLACE FUNCTION create_pei_relation_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando um vínculo é confirmado, criar alerta
    IF NEW.link_type = 'confirmed' THEN
        INSERT INTO "public"."pei_relation_alerts" (
            student_id,
            pei_goal_id,
            evaluation_id,
            alert_type,
            message,
            priority
        )
        SELECT 
            p.student_id,
            NEW.pei_goal_id,
            NEW.evaluation_id,
            'activity_related',
            'Atividade relacionada à meta do PEI: ' || pg.description,
            'medium'
        FROM "public"."pei_goals" pg
        JOIN "public"."peis" p ON p.id = pg.pei_id
        WHERE pg.id = NEW.pei_goal_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_pei_alert
AFTER INSERT OR UPDATE ON "public"."diary_pei_links"
FOR EACH ROW
WHEN (NEW.link_type = 'confirmed')
EXECUTE FUNCTION create_pei_relation_alert();

-- ============================================================================
-- PARTE 5: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."diary_pei_links" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON "public"."pei_relation_alerts" TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_pei_relations(uuid, uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."diary_pei_links" IS 'Vínculos entre avaliações/atividades do diário e metas do PEI';
COMMENT ON TABLE "public"."pei_relation_alerts" IS 'Alertas quando atividades relacionam-se a metas do PEI';
COMMENT ON FUNCTION suggest_pei_relations(uuid, uuid) IS 'Sugere relações entre avaliação e metas do PEI';

