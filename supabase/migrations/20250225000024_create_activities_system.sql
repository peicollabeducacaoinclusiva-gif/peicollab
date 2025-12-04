-- ============================================================================
-- MIGRAÇÃO: Sistema de Atividades
-- Data: 25/02/2025
-- Descrição: Criar estrutura completa para App Atividades
-- ============================================================================

-- ============================================================================
-- PARTE 1: Banco de Atividades
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."activity_bank" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "activity_name" text NOT NULL,
    "activity_description" text NOT NULL,
    "stage" text NOT NULL, -- 'infantil', 'fundamental_anos_iniciais', etc.
    "knowledge_area" text, -- Área do conhecimento (BNCC)
    "experience_field" text, -- Campo de experiência (Educação Infantil)
    "subject" text,
    "content" jsonb NOT NULL, -- Conteúdo da atividade (estrutura flexível)
    "adaptations" jsonb DEFAULT '[]'::jsonb, -- Adaptações disponíveis
    "rubrics" jsonb DEFAULT '[]'::jsonb, -- Rubricas de avaliação
    "tags" text[],
    "pei_goal_categories" text[], -- Categorias de metas PEI relacionadas
    "aee_objective_types" text[], -- Tipos de objetivos AEE relacionados
    "usage_count" integer DEFAULT 0,
    "rating" numeric(3,2) DEFAULT 0.0, -- 0.0 a 5.0
    "enabled" boolean DEFAULT true,
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_activity_bank_stage" ON "public"."activity_bank"("stage");
CREATE INDEX IF NOT EXISTS "idx_activity_bank_knowledge_area" ON "public"."activity_bank"("knowledge_area");
CREATE INDEX IF NOT EXISTS "idx_activity_bank_tenant" ON "public"."activity_bank"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_activity_bank_tags" ON "public"."activity_bank" USING GIN("tags");

-- ============================================================================
-- PARTE 2: Tabela de Atividades Criadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    "activity_bank_id" uuid REFERENCES "public"."activity_bank"("id") ON DELETE SET NULL,
    "title" text NOT NULL,
    "description" text,
    "content" jsonb NOT NULL, -- Conteúdo da atividade (editor moderno)
    "due_date" date,
    "pei_goal_id" uuid REFERENCES "public"."pei_goals"("id") ON DELETE SET NULL,
    "aee_objective_id" uuid REFERENCES "public"."aee_objectives"("id") ON DELETE SET NULL,
    "adaptation_applied" jsonb, -- Adaptação aplicada (se houver)
    "rubric_id" uuid REFERENCES "public"."rubrics"("id") ON DELETE SET NULL,
    "tags" text[],
    "status" text DEFAULT 'draft', -- 'draft', 'published', 'completed', 'archived'
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_activities_class" ON "public"."activities"("class_id");
CREATE INDEX IF NOT EXISTS "idx_activities_teacher" ON "public"."activities"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_activities_pei_goal" ON "public"."activities"("pei_goal_id");
CREATE INDEX IF NOT EXISTS "idx_activities_aee_objective" ON "public"."activities"("aee_objective_id");
CREATE INDEX IF NOT EXISTS "idx_activities_status" ON "public"."activities"("status");

-- ============================================================================
-- PARTE 3: Tabela de Respostas/Feedback de Atividades
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."activity_responses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "activity_id" uuid NOT NULL REFERENCES "public"."activities"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "response_data" jsonb NOT NULL, -- Respostas do aluno
    "ai_feedback" jsonb, -- Feedback gerado por IA
    "teacher_feedback" text,
    "score" numeric,
    "submitted_at" timestamptz,
    "graded_at" timestamptz,
    "graded_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("activity_id", "student_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_activity_responses_activity" ON "public"."activity_responses"("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_responses_student" ON "public"."activity_responses"("student_id");

-- ============================================================================
-- PARTE 4: Tabela de Vínculos com Diário
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."activity_diary_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "activity_id" uuid NOT NULL REFERENCES "public"."activities"("id") ON DELETE CASCADE,
    "diary_entry_id" uuid, -- Referência a entrada do diário
    "evaluation_id" uuid REFERENCES "public"."evaluations"("id") ON DELETE SET NULL,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_activity_diary_links_activity" ON "public"."activity_diary_links"("activity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_diary_links_evaluation" ON "public"."activity_diary_links"("evaluation_id");

-- ============================================================================
-- PARTE 5: Função para gerar atividade baseada em PEI/AEE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_activity_from_pei_aee(
    p_student_id uuid,
    p_class_id uuid,
    p_teacher_id uuid,
    p_pei_goal_id uuid DEFAULT NULL,
    p_aee_objective_id uuid DEFAULT NULL,
    p_base_activity_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_activity_id uuid;
    v_base_activity record;
    v_pei_goal record;
    v_aee_objective record;
    v_adaptation jsonb;
    v_content jsonb;
BEGIN
    -- Buscar atividade base se fornecida
    IF p_base_activity_id IS NOT NULL THEN
        SELECT * INTO v_base_activity
        FROM "public"."activity_bank"
        WHERE id = p_base_activity_id
        AND enabled = true;
    END IF;

    -- Buscar meta do PEI se fornecida
    IF p_pei_goal_id IS NOT NULL THEN
        SELECT * INTO v_pei_goal
        FROM "public"."pei_goals"
        WHERE id = p_pei_goal_id;
    END IF;

    -- Buscar objetivo do AEE se fornecido
    IF p_aee_objective_id IS NOT NULL THEN
        SELECT * INTO v_aee_objective
        FROM "public"."aee_objectives"
        WHERE id = p_aee_objective_id;
    END IF;

    -- Preparar conteúdo base
    IF v_base_activity IS NOT NULL THEN
        v_content := v_base_activity.content;
    ELSE
        v_content := '{"blocks": []}'::jsonb;
    END IF;

    -- Aplicar adaptações baseadas em PEI/AEE
    v_adaptation := jsonb_build_object(
        'pei_goal_id', p_pei_goal_id,
        'aee_objective_id', p_aee_objective_id,
        'adaptations', COALESCE(v_base_activity.adaptations, '[]'::jsonb),
        'suggestions', jsonb_build_object(
            'instructions', CASE
                WHEN v_pei_goal IS NOT NULL THEN 'Adaptar instruções conforme meta do PEI: ' || v_pei_goal.description
                WHEN v_aee_objective IS NOT NULL THEN 'Adaptar conforme objetivo AEE: ' || v_aee_objective.title
                ELSE NULL
            END,
            'materials', 'Considerar recursos assistivos se necessário',
            'evaluation', 'Avaliar progresso em relação à meta vinculada'
        )
    );

    -- Criar atividade
    INSERT INTO "public"."activities" (
        class_id,
        teacher_id,
        activity_bank_id,
        title,
        description,
        content,
        pei_goal_id,
        aee_objective_id,
        adaptation_applied,
        status
    )
    VALUES (
        p_class_id,
        p_teacher_id,
        p_base_activity_id,
        COALESCE(v_base_activity.activity_name, 'Atividade Adaptada'),
        COALESCE(v_base_activity.activity_description, 'Atividade gerada automaticamente baseada em PEI/AEE'),
        v_content,
        p_pei_goal_id,
        p_aee_objective_id,
        v_adaptation,
        'draft'
    )
    RETURNING id INTO v_activity_id;

    -- Incrementar contador de uso se atividade base foi usada
    IF p_base_activity_id IS NOT NULL THEN
        UPDATE "public"."activity_bank"
        SET usage_count = usage_count + 1
        WHERE id = p_base_activity_id;
    END IF;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 6: Função para buscar atividades do banco
-- ============================================================================

CREATE OR REPLACE FUNCTION search_activity_bank(
    p_stage text DEFAULT NULL,
    p_knowledge_area text DEFAULT NULL,
    p_subject text DEFAULT NULL,
    p_tags text[] DEFAULT NULL,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    activity_name text,
    activity_description text,
    stage text,
    knowledge_area text,
    subject text,
    usage_count integer,
    rating numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ab.id,
        ab.activity_name,
        ab.activity_description,
        ab.stage,
        ab.knowledge_area,
        ab.subject,
        ab.usage_count,
        ab.rating
    FROM "public"."activity_bank" ab
    WHERE ab.enabled = true
    AND (p_stage IS NULL OR ab.stage = p_stage)
    AND (p_knowledge_area IS NULL OR ab.knowledge_area = p_knowledge_area)
    AND (p_subject IS NULL OR ab.subject = p_subject)
    AND (p_tags IS NULL OR ab.tags && p_tags)
    AND (p_tenant_id IS NULL OR ab.tenant_id = p_tenant_id OR ab.tenant_id IS NULL)
    ORDER BY ab.rating DESC, ab.usage_count DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 7: Inserir atividades padrão
-- ============================================================================

INSERT INTO "public"."activity_bank" (tenant_id, activity_name, activity_description, stage, knowledge_area, content, tags, pei_goal_categories)
VALUES
    (NULL, 'Leitura com Material Concreto', 'Atividade de leitura utilizando objetos e imagens', 
     'fundamental_anos_iniciais', 'Linguagens', 
     '{"blocks": [{"type": "heading", "content": "Objetivo"}, {"type": "paragraph", "content": "Desenvolver habilidades de leitura"}]}'::jsonb,
     ARRAY['leitura', 'material_concreto'],
     ARRAY['academic', 'communication']),
    (NULL, 'Atividade de Matemática Adaptada', 'Atividade matemática com suporte visual', 
     'fundamental_anos_iniciais', 'Matemática',
     '{"blocks": [{"type": "heading", "content": "Objetivo"}, {"type": "paragraph", "content": "Desenvolver habilidades matemáticas"}]}'::jsonb,
     ARRAY['matematica', 'adaptacao'],
     ARRAY['academic'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PARTE 8: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."activity_bank" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."activities" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."activity_responses" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."activity_diary_links" TO authenticated;
GRANT EXECUTE ON FUNCTION generate_activity_from_pei_aee(uuid, uuid, uuid, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_activity_bank(text, text, text, text[], uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."activity_bank" IS 'Banco de atividades reutilizáveis por etapa e área';
COMMENT ON TABLE "public"."activities" IS 'Atividades criadas pelos professores';
COMMENT ON TABLE "public"."activity_responses" IS 'Respostas e feedback de atividades';
COMMENT ON TABLE "public"."activity_diary_links" IS 'Vínculos entre atividades e diário de classe';
COMMENT ON FUNCTION generate_activity_from_pei_aee(uuid, uuid, uuid, uuid, uuid, uuid) IS 'Gera atividade adaptada baseada em PEI/AEE';
COMMENT ON FUNCTION search_activity_bank(text, text, text, text[], uuid) IS 'Busca atividades no banco com filtros';

