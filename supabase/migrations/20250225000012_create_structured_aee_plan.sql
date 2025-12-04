-- ============================================================================
-- MIGRAÇÃO: Plano de AEE Altamente Estruturado
-- Data: 25/02/2025
-- Descrição: Estruturar plano AEE com objetivos, metodologias, tecnologias e plano semanal
-- ============================================================================

-- ============================================================================
-- PARTE 1: Tabela de Objetivos do AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_objectives" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "pei_goal_id" uuid REFERENCES "public"."pei_goals"("id") ON DELETE SET NULL,
    "objective_type" text NOT NULL, -- 'academic', 'functional', 'social', 'communication'
    "title" text NOT NULL,
    "description" text NOT NULL,
    "target_date" date,
    "status" text DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    "progress_notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_objectives_aee" ON "public"."aee_objectives"("aee_id");
CREATE INDEX IF NOT EXISTS "idx_aee_objectives_pei_goal" ON "public"."aee_objectives"("pei_goal_id");
CREATE INDEX IF NOT EXISTS "idx_aee_objectives_status" ON "public"."aee_objectives"("status");

-- ============================================================================
-- PARTE 2: Tabela de Metodologias do AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_methodologies" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "objective_id" uuid REFERENCES "public"."aee_objectives"("id") ON DELETE CASCADE,
    "methodology_name" text NOT NULL,
    "description" text NOT NULL,
    "frequency" text, -- 'diaria', 'semanal', 'quinzenal', 'mensal'
    "duration_minutes" integer,
    "resources_needed" text[],
    "implementation_notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_methodologies_aee" ON "public"."aee_methodologies"("aee_id");
CREATE INDEX IF NOT EXISTS "idx_aee_methodologies_objective" ON "public"."aee_methodologies"("objective_id");

-- ============================================================================
-- PARTE 3: Tabela de Tecnologias Assistivas do AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_assistive_technologies" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "technology_type" text NOT NULL, -- 'comunicacao', 'mobilidade', 'acesso_informacao', 'outro'
    "technology_name" text NOT NULL,
    "description" text,
    "usage_frequency" text, -- 'diario', 'semanal', 'sob_demanda'
    "provider" text, -- 'escola', 'familia', 'outro'
    "training_required" boolean DEFAULT false,
    "training_completed" boolean DEFAULT false,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_technologies_aee" ON "public"."aee_assistive_technologies"("aee_id");
CREATE INDEX IF NOT EXISTS "idx_aee_technologies_type" ON "public"."aee_assistive_technologies"("technology_type");

-- ============================================================================
-- PARTE 4: Tabela de Plano Semanal do AEE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_weekly_plan" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "week_start_date" date NOT NULL,
    "week_end_date" date NOT NULL,
    "monday_objectives" uuid[],
    "tuesday_objectives" uuid[],
    "wednesday_objectives" uuid[],
    "thursday_objectives" uuid[],
    "friday_objectives" uuid[],
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    UNIQUE("aee_id", "week_start_date")
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_weekly_plan_aee" ON "public"."aee_weekly_plan"("aee_id");
CREATE INDEX IF NOT EXISTS "idx_aee_weekly_plan_week" ON "public"."aee_weekly_plan"("week_start_date");

-- ============================================================================
-- PARTE 5: Melhorar tabela aee_sessions (se já existir, adicionar campos)
-- ============================================================================

-- Adicionar campos se não existirem
ALTER TABLE "public"."aee_sessions" 
ADD COLUMN IF NOT EXISTS "objective_id" uuid REFERENCES "public"."aee_objectives"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "methodology_id" uuid REFERENCES "public"."aee_methodologies"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "student_participation" text, -- 'alta', 'media', 'baixa'
ADD COLUMN IF NOT EXISTS "session_type" text DEFAULT 'regular', -- 'regular', 'avaliacao', 'reuniao'
ADD COLUMN IF NOT EXISTS "next_session_focus" text;

CREATE INDEX IF NOT EXISTS "idx_aee_sessions_objective" ON "public"."aee_sessions"("objective_id");
CREATE INDEX IF NOT EXISTS "idx_aee_sessions_methodology" ON "public"."aee_sessions"("methodology_id");

-- ============================================================================
-- PARTE 6: Função para buscar plano estruturado completo
-- ============================================================================

CREATE OR REPLACE FUNCTION get_structured_aee_plan(p_aee_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'aee_id', p_aee_id,
        'objectives', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ao.id,
                    'title', ao.title,
                    'description', ao.description,
                    'objective_type', ao.objective_type,
                    'target_date', ao.target_date,
                    'status', ao.status,
                    'pei_goal_id', ao.pei_goal_id,
                    'progress_notes', ao.progress_notes
                )
            )
            FROM "public"."aee_objectives" ao
            WHERE ao.aee_id = p_aee_id
        ),
        'methodologies', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', am.id,
                    'methodology_name', am.methodology_name,
                    'description', am.description,
                    'frequency', am.frequency,
                    'duration_minutes', am.duration_minutes,
                    'objective_id', am.objective_id,
                    'resources_needed', am.resources_needed
                )
            )
            FROM "public"."aee_methodologies" am
            WHERE am.aee_id = p_aee_id
        ),
        'assistive_technologies', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', at.id,
                    'technology_type', at.technology_type,
                    'technology_name', at.technology_name,
                    'description', at.description,
                    'usage_frequency', at.usage_frequency,
                    'provider', at.provider,
                    'training_required', at.training_required,
                    'training_completed', at.training_completed
                )
            )
            FROM "public"."aee_assistive_technologies" at
            WHERE at.aee_id = p_aee_id
        ),
        'weekly_plans', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', awp.id,
                    'week_start_date', awp.week_start_date,
                    'week_end_date', awp.week_end_date,
                    'monday_objectives', awp.monday_objectives,
                    'tuesday_objectives', awp.tuesday_objectives,
                    'wednesday_objectives', awp.wednesday_objectives,
                    'thursday_objectives', awp.thursday_objectives,
                    'friday_objectives', awp.friday_objectives,
                    'notes', awp.notes
                )
            )
            FROM "public"."aee_weekly_plan" awp
            WHERE awp.aee_id = p_aee_id
            ORDER BY awp.week_start_date DESC
            LIMIT 4
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PARTE 7: Tabela de Relatórios Oficiais
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."aee_official_reports" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "aee_id" uuid NOT NULL REFERENCES "public"."plano_aee"("id") ON DELETE CASCADE,
    "report_type" text NOT NULL, -- 'sed', 'seduc', 'inep', 'municipal'
    "generated_at" timestamptz DEFAULT now(),
    "generated_by" uuid REFERENCES "auth"."users"("id"),
    "file_url" text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_aee_official_reports_aee" ON "public"."aee_official_reports"("aee_id");
CREATE INDEX IF NOT EXISTS "idx_aee_official_reports_type" ON "public"."aee_official_reports"("report_type");

-- ============================================================================
-- PARTE 8: Permissões
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_objectives" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_methodologies" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_assistive_technologies" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_weekly_plan" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."aee_official_reports" TO authenticated;
GRANT EXECUTE ON FUNCTION get_structured_aee_plan(uuid) TO authenticated;

-- Comentários
COMMENT ON TABLE "public"."aee_objectives" IS 'Objetivos específicos do plano AEE';
COMMENT ON TABLE "public"."aee_methodologies" IS 'Metodologias utilizadas no AEE';
COMMENT ON TABLE "public"."aee_assistive_technologies" IS 'Tecnologias assistivas do plano AEE';
COMMENT ON TABLE "public"."aee_weekly_plan" IS 'Plano semanal do AEE';
COMMENT ON TABLE "public"."aee_official_reports" IS 'Relatórios oficiais gerados do AEE';
COMMENT ON FUNCTION get_structured_aee_plan(uuid) IS 'Retorna plano AEE estruturado completo';

