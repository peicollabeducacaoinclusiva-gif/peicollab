-- ============================================================================
-- MIGRAÇÃO: Sistema de Planejamento de Aulas
-- ============================================================================
-- Sistema completo de planejamento com base na BNCC
-- Data: 2025-01-08
-- ============================================================================

-- ============================================================================
-- ENUM: modalidade_organizativa
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "public"."modalidade_organizativa" AS ENUM (
        'sequencia_didatica',
        'atividade_permanente',
        'atividade_independente',
        'projeto'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABELA: planos_curso (Plano de Curso Anual)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."planos_curso" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Identificação
    "academic_year" text NOT NULL,
    "title" text NOT NULL,
    
    -- Conteúdo baseado na BNCC
    "bncc_competencies" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"code": "EF01LP01", "description": "..."}]
    
    "bncc_skills" jsonb DEFAULT '[]'::jsonb,
    -- Formato: [{"code": "EF01MA01", "description": "..."}]
    
    "course_objectives" jsonb DEFAULT '[]'::jsonb,
    "course_content" jsonb DEFAULT '[]'::jsonb,
    -- Formato por bimestre/trimestre
    
    "methodology" text,
    "evaluation_criteria" text,
    "resources" jsonb DEFAULT '[]'::jsonb,
    "bibliography" text,
    
    -- Organização Temporal
    "workload" integer, -- Carga horária total
    "weekly_classes" integer, -- Aulas por semana
    
    -- Status
    "status" text DEFAULT 'draft',
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "approved_by" uuid REFERENCES "auth"."users"("id"),
    "approved_at" timestamptz,
    
    CONSTRAINT "planos_curso_status_check" CHECK (status IN ('draft', 'pending', 'approved', 'archived'))
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_planos_curso_class" ON "public"."planos_curso"("class_id");
CREATE INDEX IF NOT EXISTS "idx_planos_curso_subject" ON "public"."planos_curso"("subject_id");
CREATE INDEX IF NOT EXISTS "idx_planos_curso_teacher" ON "public"."planos_curso"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_planos_curso_year" ON "public"."planos_curso"("academic_year");

-- ============================================================================
-- TABELA: planos_aula (Planos de Aula)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."planos_aula" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Vinculações
    "plano_curso_id" uuid REFERENCES "public"."planos_curso"("id") ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES "auth"."users"("id"),
    
    -- Modalidade Organizativa
    "modalidade" modalidade_organizativa NOT NULL,
    
    -- Identificação
    "title" text NOT NULL,
    "lesson_number" integer,
    "duration" integer, -- Duração em minutos
    
    -- Data
    "lesson_date" date,
    "start_time" time,
    "end_time" time,
    
    -- Planejamento
    "objectives" jsonb DEFAULT '[]'::jsonb,
    "bncc_skills" jsonb DEFAULT '[]'::jsonb,
    "content" text,
    "methodology" text,
    
    -- Atividades
    "opening_activity" text,
    "development_activities" jsonb DEFAULT '[]'::jsonb,
    "closing_activity" text,
    
    -- Recursos
    "resources" jsonb DEFAULT '[]'::jsonb,
    "materials" jsonb DEFAULT '[]'::jsonb,
    
    -- Avaliação
    "evaluation_criteria" text,
    "evaluation_instruments" jsonb DEFAULT '[]'::jsonb,
    
    -- Observações
    "observations" text,
    "homework" text,
    
    -- Adaptações
    "adaptations" jsonb DEFAULT '[]'::jsonb,
    -- Para alunos com necessidades especiais
    
    -- Status
    "status" text DEFAULT 'draft',
    "is_executed" boolean DEFAULT false,
    "execution_notes" text,
    
    -- Metadados
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    
    CONSTRAINT "planos_aula_status_check" CHECK (status IN ('draft', 'scheduled', 'executed', 'cancelled'))
);

-- Índices
CREATE INDEX IF NOT EXISTS "idx_planos_aula_curso" ON "public"."planos_aula"("plano_curso_id");
CREATE INDEX IF NOT EXISTS "idx_planos_aula_class" ON "public"."planos_aula"("class_id");
CREATE INDEX IF NOT EXISTS "idx_planos_aula_teacher" ON "public"."planos_aula"("teacher_id");
CREATE INDEX IF NOT EXISTS "idx_planos_aula_date" ON "public"."planos_aula"("lesson_date");
CREATE INDEX IF NOT EXISTS "idx_planos_aula_modalidade" ON "public"."planos_aula"("modalidade");

-- ============================================================================
-- TABELA: plano_aula_atividades (Vinculação Plano ↔ Atividade)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."plano_aula_atividades" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "plano_aula_id" uuid NOT NULL REFERENCES "public"."planos_aula"("id") ON DELETE CASCADE,
    "atividade_id" uuid NOT NULL REFERENCES "public"."atividades"("id") ON DELETE CASCADE,
    "order" integer DEFAULT 0,
    "notes" text,
    "created_at" timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_plano_aula_atividades_plano" ON "public"."plano_aula_atividades"("plano_aula_id");
CREATE INDEX IF NOT EXISTS "idx_plano_aula_atividades_atividade" ON "public"."plano_aula_atividades"("atividade_id");

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE "public"."planos_curso" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manage_own_planos_curso"
    ON "public"."planos_curso"
    FOR ALL
    USING (teacher_id = auth.uid());

CREATE POLICY "coord_view_all_planos_curso"
    ON "public"."planos_curso"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

ALTER TABLE "public"."planos_aula" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manage_own_planos_aula"
    ON "public"."planos_aula"
    FOR ALL
    USING (teacher_id = auth.uid());

CREATE POLICY "coord_view_all_planos_aula"
    ON "public"."planos_aula"
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM "public"."user_roles" ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('coordinator', 'school_manager', 'education_secretary')
        )
    );

ALTER TABLE "public"."plano_aula_atividades" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_manage_vinculacao"
    ON "public"."plano_aula_atividades"
    FOR ALL
    USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_planos_curso_updated_at
    BEFORE UPDATE ON "public"."planos_curso"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planos_aula_updated_at
    BEFORE UPDATE ON "public"."planos_aula"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "public"."planos_curso" IS 'Planos de Curso anuais por disciplina/turma baseados na BNCC';
COMMENT ON TABLE "public"."planos_aula" IS 'Planos de aula individuais com modalidades organizativas';
COMMENT ON TABLE "public"."plano_aula_atividades" IS 'Vinculação entre planos de aula e atividades do banco';

COMMENT ON COLUMN "public"."planos_aula"."modalidade" IS 'Modalidade organizativa: sequência didática, atividade permanente, etc.';

SELECT '✅ Migração 8 (Planejamento de Aulas) aplicada com sucesso!' AS status;

