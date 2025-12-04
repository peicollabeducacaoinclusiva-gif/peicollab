-- ============================================================================
-- MIGRAÇÃO: Modelo de Dados Universal para Avaliações
-- Data: 25/02/2025
-- Descrição: Criar estrutura flexível para suportar todos os tipos de avaliação
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Tipos de Avaliação
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."evaluation_types" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "type_name" text NOT NULL UNIQUE, -- 'prova', 'registro_descritivo', 'rubrica', 'formativa', 'eja', 'conceito'
    "display_name" text NOT NULL,
    "description" text,
    "schema_template" jsonb NOT NULL, -- Template do schema para este tipo
    "enabled" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_evaluation_types_name" ON "public"."evaluation_types"("type_name");

-- ============================================================================
-- PARTE 2: Melhorar tabela evaluations (se já existir, adicionar campos)
-- ============================================================================

-- Adicionar campos se não existirem
ALTER TABLE "public"."evaluations" 
ADD COLUMN IF NOT EXISTS "evaluation_type_id" uuid REFERENCES "public"."evaluation_types"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "evaluation_data" jsonb DEFAULT '{}'::jsonb, -- Dados flexíveis conforme tipo
ADD COLUMN IF NOT EXISTS "regime" text, -- 'numerico', 'descritivo', 'eja', 'infantil'
ADD COLUMN IF NOT EXISTS "rubric_id" uuid, -- Se for avaliação por rubrica
ADD COLUMN IF NOT EXISTS "pei_goal_id" uuid REFERENCES "public"."pei_goals"("id") ON DELETE SET NULL, -- Vinculação com PEI
ADD COLUMN IF NOT EXISTS "tags" text[];

CREATE INDEX IF NOT EXISTS "idx_evaluations_type" ON "public"."evaluations"("evaluation_type_id");
CREATE INDEX IF NOT EXISTS "idx_evaluations_regime" ON "public"."evaluations"("regime");
CREATE INDEX IF NOT EXISTS "idx_evaluations_pei_goal" ON "public"."evaluations"("pei_goal_id");
CREATE INDEX IF NOT EXISTS "idx_evaluations_rubric" ON "public"."evaluations"("rubric_id");

-- ============================================================================
-- PARTE 3: Tabela de Rubricas
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."rubrics" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "rubric_name" text NOT NULL,
    "description" text,
    "criteria" jsonb NOT NULL, -- Array de critérios com níveis
    "scale_type" text DEFAULT 'numeric', -- 'numeric', 'descriptive', 'levels'
    "created_by" uuid REFERENCES "auth"."users"("id"),
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_rubrics_tenant" ON "public"."rubrics"("tenant_id");

-- ============================================================================
-- PARTE 4: Tabela de Resultados de Avaliação (flexível)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."evaluation_results" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "evaluation_id" uuid NOT NULL REFERENCES "public"."evaluations"("id") ON DELETE CASCADE,
    "student_id" uuid NOT NULL REFERENCES "public"."students"("id") ON DELETE CASCADE,
    "result_data" jsonb NOT NULL, -- Dados flexíveis conforme tipo de avaliação
    "score" numeric, -- Para avaliações numéricas
    "concept" text, -- Para avaliações por conceito
    "description" text, -- Para registros descritivos
    "rubric_scores" jsonb, -- Para avaliações por rubrica
    "pei_goal_progress" jsonb, -- Progresso relacionado a meta do PEI
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("evaluation_id", "student_id")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_evaluation_results_evaluation" ON "public"."evaluation_results"("evaluation_id");
CREATE INDEX IF NOT EXISTS "idx_evaluation_results_student" ON "public"."evaluation_results"("student_id");

-- ============================================================================
-- PARTE 5: Inserir tipos de avaliação padrão
-- ============================================================================

INSERT INTO "public"."evaluation_types" (type_name, display_name, description, schema_template)
VALUES
    ('prova', 'Prova', 'Avaliação tradicional com questões e pontuação',
     '{"questions": [], "total_score": 0, "passing_score": 0}'::jsonb),
    ('registro_descritivo', 'Registro Descritivo', 'Avaliação qualitativa descritiva',
     '{"fields": ["observations", "strengths", "improvements"], "format": "text"}'::jsonb),
    ('rubrica', 'Rubrica', 'Avaliação por critérios e níveis',
     '{"rubric_id": null, "criteria_scores": {}}'::jsonb),
    ('formativa', 'Avaliação Formativa', 'Avaliação contínua durante o processo',
     '{"observations": [], "checkpoints": []}'::jsonb),
    ('eja', 'Avaliação EJA', 'Avaliação específica para Educação de Jovens e Adultos',
     '{"modules": [], "competencies": []}'::jsonb),
    ('conceito', 'Conceito', 'Avaliação por conceitos (MB, B, R, I)',
     '{"concept_scale": ["MB", "B", "R", "I"]}'::jsonb),
    ('infantil', 'Avaliação Educação Infantil', 'Avaliação específica para Educação Infantil',
     '{"experience_fields": [], "observations": []}'::jsonb)
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- PARTE 6: Função para criar avaliação universal
-- ============================================================================

CREATE OR REPLACE FUNCTION create_universal_evaluation(
    p_class_id uuid,
    p_subject_id uuid,
    p_evaluation_type_name text,
    p_title text,
    p_date date,
    p_evaluation_data jsonb DEFAULT '{}'::jsonb,
    p_regime text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_evaluation_type_id uuid;
    v_evaluation_id uuid;
    v_schema_template jsonb;
BEGIN
    -- Buscar tipo de avaliação
    SELECT id, schema_template INTO v_evaluation_type_id, v_schema_template
    FROM "public"."evaluation_types"
    WHERE type_name = p_evaluation_type_name
    AND enabled = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tipo de avaliação não encontrado ou desabilitado';
    END IF;

    -- Mesclar schema template com dados fornecidos
    v_schema_template := v_schema_template || p_evaluation_data;

    -- Criar avaliação
    INSERT INTO "public"."evaluations" (
        class_id,
        subject_id,
        evaluation_type_id,
        title,
        date,
        evaluation_data,
        regime
    )
    VALUES (
        p_class_id,
        p_subject_id,
        v_evaluation_type_id,
        p_title,
        p_date,
        v_schema_template,
        p_regime
    )
    RETURNING id INTO v_evaluation_id;

    RETURN v_evaluation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 7: Permissões
-- ============================================================================

GRANT SELECT ON "public"."evaluation_types" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."rubrics" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."evaluation_results" TO authenticated;
GRANT EXECUTE ON FUNCTION create_universal_evaluation(uuid, uuid, text, text, date, jsonb, text) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."evaluation_types" IS 'Tipos de avaliação suportados pelo sistema';
COMMENT ON TABLE "public"."rubrics" IS 'Rubricas de avaliação reutilizáveis';
COMMENT ON TABLE "public"."evaluation_results" IS 'Resultados de avaliação (modelo flexível)';
COMMENT ON FUNCTION create_universal_evaluation(uuid, uuid, text, text, date, jsonb, text) IS 'Cria avaliação universal com schema flexível';

